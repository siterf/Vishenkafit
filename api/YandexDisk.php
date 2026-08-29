<?php
/**
 * ============================================================================
 * VISHENKA — Клиент REST API Яндекс.Диска
 * ============================================================================
 */

class YandexDisk {
    private string $token;
    private int $timeout;
    private string $apiBase = 'https://cloud-api.yandex.net/v1/disk/resources';

    public function __construct(string $token, int $timeout = 15) {
        $this->token = trim($token);
        $this->timeout = $timeout;
    }

    public function isConfigured(): bool {
        return !empty($this->token);
    }

    /**
     * Проверяет существование файла на Яндекс.Диске
     */
    public function fileExists(string $remotePath): bool {
        if (!$this->isConfigured()) return false;
        
        $url = $this->apiBase . '?path=' . urlencode($remotePath);
        $res = $this->request('GET', $url);
        return isset($res['http_code']) && $res['http_code'] === 200;
    }

    /**
     * Создает директорию на Яндекс.Диске при необходимости
     */
    public function ensureDirectory(string $dirPath): bool {
        if (!$this->isConfigured()) return false;
        
        $dirPath = trim($dirPath, '/');
        if (empty($dirPath)) return true;

        $parts = explode('/', $dirPath);
        $current = '';
        foreach ($parts as $part) {
            $current .= '/' . $part;
            $url = $this->apiBase . '?path=' . urlencode($current);
            $this->request('PUT', $url);
        }
        return true;
    }

    /**
     * Скачивает файл с Яндекс.Диска и сохраняет локально
     */
    public function downloadFile(string $remotePath, string $localSavePath): bool {
        if (!$this->isConfigured()) return false;

        $url = $this->apiBase . '/download?path=' . urlencode($remotePath);
        $meta = $this->request('GET', $url);

        if (!isset($meta['data']['href'])) {
            error_log('YandexDisk::downloadFile href not found: ' . json_encode($meta));
            return false;
        }

        $downloadUrl = $meta['data']['href'];
        $ch = curl_init($downloadUrl);
        $fp = fopen($localSavePath, 'wb');
        if (!$fp) return false;

        curl_setopt_array($ch, [
            CURLOPT_FILE           => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => $this->timeout * 2,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $success = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        fclose($fp);

        return $success && $httpCode >= 200 && $httpCode < 300 && filesize($localSavePath) > 0;
    }

    /**
     * Загружает локальный файл на Яндекс.Диск с перезаписью
     */
    public function uploadFile(string $localFilePath, string $remotePath, bool $overwrite = true): bool {
        if (!$this->isConfigured() || !file_exists($localFilePath)) return false;

        // Создаем родительскую папку на Диске, если её нет
        $parentDir = dirname($remotePath);
        if ($parentDir && $parentDir !== '/' && $parentDir !== '.') {
            $this->ensureDirectory($parentDir);
        }

        $url = $this->apiBase . '/upload?path=' . urlencode($remotePath) . '&overwrite=' . ($overwrite ? 'true' : 'false');
        $meta = $this->request('GET', $url);

        if (!isset($meta['data']['href'])) {
            error_log('YandexDisk::uploadFile href not found: ' . json_encode($meta));
            return false;
        }

        $uploadUrl = $meta['data']['href'];
        $fp = fopen($localFilePath, 'rb');
        if (!$fp) return false;

        $ch = curl_init($uploadUrl);
        curl_setopt_array($ch, [
            CURLOPT_PUT            => true,
            CURLOPT_INFILE         => $fp,
            CURLOPT_INFILESIZE     => filesize($localFilePath),
            CURLOPT_TIMEOUT        => $this->timeout * 2,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_RETURNTRANSFER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        fclose($fp);

        return $httpCode === 201 || $httpCode === 200 || $httpCode === 202;
    }

    /**
     * Выполнение HTTP-запроса к API Яндекс.Диска
     */
    private function request(string $method, string $url, array $headers = []): array {
        $ch = curl_init($url);
        $reqHeaders = [
            'Authorization: OAuth ' . $this->token,
            'Accept: application/json',
        ];
        $reqHeaders = array_merge($reqHeaders, $headers);

        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $reqHeaders,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $raw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        $json = $raw ? json_decode($raw, true) : null;
        return [
            'http_code' => $httpCode,
            'data'      => $json,
            'raw'       => $raw,
            'error'     => $error,
        ];
    }
}
