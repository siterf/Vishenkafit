<?php
/**
 * ============================================================================
 * VISHENKA WELLNESS & FITNESS — Главный API контроллер
 * ============================================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$config = require __DIR__ . '/config.php';
date_default_timezone_set($config['timezone'] ?? 'Europe/Moscow');

require_once __DIR__ . '/YandexDisk.php';
require_once __DIR__ . '/XlsxHandler.php';
require_once __DIR__ . '/VkNotifier.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'schedule');

$localFile = __DIR__ . '/data/vishenka_studio.xlsx';
$cacheFile = __DIR__ . '/data/schedule_cache.json';
$sessionFile = __DIR__ . '/data/tokens.json';

// Инициализация локального файла, если его еще нет
if (!file_exists($localFile)) {
    XlsxHandler::createDefaultWorkbook($localFile);
}

$yandex = new YandexDisk($config['yandex']['oauth_token'] ?? '', (int)($config['yandex']['timeout'] ?? 15));
$vk = new VkNotifier($config['vk'] ?? []);

try {
    switch ($action) {
        // ── 1. ВЫДАЧА РАСПИСАНИЯ ──────────────────────────────────────────
        case 'schedule':
        case 'get_schedule':
            $ttl = (int)($config['cache']['ttl'] ?? 60);
            $cacheValid = file_exists($cacheFile) && (time() - filemtime($cacheFile) < $ttl);

            if ($cacheValid) {
                $cachedJson = file_get_contents($cacheFile);
                $response = json_decode($cachedJson, true);
            } else {
                // Пытаемся синхронизировать с Яндекс.Диском, если настроен токен
                if ($yandex->isConfigured()) {
                    $remotePath = $config['yandex']['file_path'];
                    $tempDownload = __DIR__ . '/data/temp_download.xlsx';
                    if ($yandex->downloadFile($remotePath, $tempDownload)) {
                        @rename($tempDownload, $localFile);
                    }
                }

                $wbData = XlsxHandler::readWorkbook($localFile);
                $rawSchedule = $wbData['schedule'] ?? [];

                // Группируем расписание
                $larochelle = [];
                $zaytseva = [];

                foreach ($rawSchedule as $slot) {
                    $branch = $slot['branch'] ?? 'larochelle';
                    if ($branch === 'zaytseva') {
                        $zaytseva[] = $slot;
                    } else {
                        $larochelle[] = $slot;
                    }
                }

                $response = [
                    'success'   => true,
                    'updated'   => date('d.m.Y H:i:s'),
                    'branches'  => $config['branches'],
                    'schedule'  => [
                        'larochelle' => $larochelle,
                        'zaytseva'   => $zaytseva,
                    ],
                    'all_slots' => $rawSchedule,
                ];

                @file_put_contents($cacheFile, json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            }

            // Генерируем свежий CSRF-токен для формы
            $token = bin2hex(random_bytes(16));
            saveToken($sessionFile, $token, (int)($config['security']['csrf_ttl'] ?? 900));
            $response['_token'] = $token;

            echo json_encode($response, JSON_UNESCAPED_UNICODE);
            break;

        // ── 2. ОНЛАЙН-ЗАПИСЬ (БРОНИРОВАНИЕ) ──────────────────────────────
        case 'book':
        case 'booking':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                echo json_encode(['success' => false, 'error' => 'Метод должен быть POST']);
                exit;
            }

            // Получаем входные данные
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true) ?: $_POST;

            $name       = trim($input['name'] ?? '');
            $phone      = trim($input['phone'] ?? '');
            $branch     = trim($input['branch'] ?? 'наб. Ла-Рошель, 13');
            $direction  = trim($input['direction'] ?? ($input['program'] ?? 'Общая заявка'));
            $date       = trim($input['date'] ?? '');
            $time       = trim($input['time'] ?? '');
            $trainer    = trim($input['trainer'] ?? '');
            $goal       = trim($input['goal'] ?? '');
            $token      = trim($input['token'] ?? ($input['_token'] ?? ''));
            $source     = trim($input['source'] ?? 'Сайт');

            if (empty($name) || mb_strlen($name) < 2) {
                echo json_encode(['success' => false, 'error' => 'Пожалуйста, укажите ваше имя (не менее 2 символов)']);
                exit;
            }

            $phoneDigits = preg_replace('/\D/', '', $phone);
            if (strlen($phoneDigits) < 10) {
                echo json_encode(['success' => false, 'error' => 'Пожалуйста, укажите корректный номер телефона']);
                exit;
            }

            // Проверка CSRF токена (если передан)
            if (!empty($token) && !verifyAndConsumeToken($sessionFile, $token)) {
                echo json_encode(['success' => false, 'error' => 'Сессия устарела. Пожалуйста, обновите страницу.']);
                exit;
            }

            // Защита от дублей за последние N минут
            $dupLock = (int)($config['security']['duplicate_lock_period'] ?? 600);
            $dupFile = __DIR__ . '/data/recent_bookings.json';
            $recent = file_exists($dupFile) ? json_decode(file_get_contents($dupFile), true) : [];
            $now = time();
            $recentKey = md5("{$phoneDigits}_{$direction}_{$date}_{$time}");

            if (isset($recent[$recentKey]) && ($now - $recent[$recentKey] < $dupLock)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Вы уже отправили эту заявку! Мы свяжемся с вами в течение 15 минут.',
                ]);
                exit;
            }

            // Блокировка файла на время записи
            $lockFp = fopen(__DIR__ . '/data/process.lock', 'w+');
            flock($lockFp, LOCK_EX);

            try {
                // Если Яндекс настроен, скачиваем свежий файл перед изменением
                if ($yandex->isConfigured()) {
                    $remotePath = $config['yandex']['file_path'];
                    $tempDownload = __DIR__ . '/data/temp_sync.xlsx';
                    if ($yandex->downloadFile($remotePath, $tempDownload)) {
                        @rename($tempDownload, $localFile);
                    }
                }

                // Добавляем запись в лист «Записи» и обновляем «Расписание»
                $bookingData = [
                    'name'      => $name,
                    'phone'     => $phone,
                    'branch'    => $branch,
                    'direction' => $direction,
                    'date'      => $date,
                    'time'      => $time,
                    'trainer'   => $trainer,
                    'goal'      => $goal,
                    'source'    => $source,
                ];

                $updated = XlsxHandler::appendBookingAndUpdateSlot($localFile, $bookingData);

                // Если Яндекс настроен, сразу выгружаем обновленный файл обратно в облако
                if ($updated && $yandex->isConfigured()) {
                    $remotePath = $config['yandex']['file_path'];
                    $yandex->uploadFile($localFile, $remotePath, true);
                }

                // Сбрасываем кэш расписания
                @unlink($cacheFile);

                // Сохраняем в антидубль
                $recent[$recentKey] = $now;
                // Очистка старых дублей
                foreach ($recent as $k => $t) {
                    if ($now - $t > $dupLock) unset($recent[$k]);
                }
                @file_put_contents($dupFile, json_encode($recent));

                // Отправляем уведомление ВКонтакте
                $vkResult = $vk->sendBookingNotification($bookingData);

            } finally {
                flock($lockFp, LOCK_UN);
                fclose($lockFp);
            }

            echo json_encode([
                'success' => true,
                'message' => "Спасибо, {$name}! Мы подтвердили предварительную запись и свяжемся с вами в течение 15 минут.",
                'vk'      => $vkResult,
            ], JSON_UNESCAPED_UNICODE);
            break;

        // ── 3. ПЕРВОНАЧАЛЬНАЯ НАСТРОЙКА И ИНИЦИАЛИЗАЦИЯ ──────────────────
        case 'setup':
            XlsxHandler::createDefaultWorkbook($localFile);
            $yandexStatus = 'Локальный файл создан.';

            if ($yandex->isConfigured()) {
                $remotePath = $config['yandex']['file_path'];
                $uploaded = $yandex->uploadFile($localFile, $remotePath, true);
                $yandexStatus = $uploaded
                    ? "Успешно создан и загружен на Яндекс.Диск в: {$remotePath}"
                    : 'Не удалось загрузить на Яндекс.Диск. Проверьте oauth_token в config.php.';
            } else {
                $yandexStatus .= ' OAuth токен Яндекса не указан (работает в локальном автономном режиме).';
            }

            @unlink($cacheFile);

            echo json_encode([
                'success' => true,
                'message' => 'Инициализация таблиц Vishenka завершена!',
                'yandex'  => $yandexStatus,
                'local'   => $localFile,
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;

        // ── 4. ДИАГНОСТИЧЕСКИЙ ТЕСТ ──────────────────────────────────────
        case 'test':
            $yandexConfigured = $yandex->isConfigured();
            $yandexConnected = false;
            if ($yandexConfigured) {
                $remotePath = $config['yandex']['file_path'];
                $yandexConnected = $yandex->fileExists($remotePath);
            }

            $vkTest = false;
            if (!empty($_GET['test_vk'])) {
                $vkTest = $vk->sendMessage('🔔 Тестовое уведомление из бэкенда Vishenka: система работает отлично!');
            }

            echo json_encode([
                'status'           => 'OK',
                'php_version'      => PHP_VERSION,
                'extensions'       => [
                    'zip'       => extension_loaded('zip'),
                    'curl'      => extension_loaded('curl'),
                    'simplexml' => extension_loaded('simplexml'),
                ],
                'local_xlsx'       => file_exists($localFile) ? filesize($localFile) . ' bytes' : 'Not created',
                'yandex_disk'      => [
                    'token_configured' => $yandexConfigured,
                    'file_path'        => $config['yandex']['file_path'] ?? '',
                    'file_exists_on_disk' => $yandexConnected,
                ],
                'vk'               => [
                    'enabled' => $config['vk']['enabled'] ?? false,
                    'peer_id' => $config['vk']['peer_id'] ?? 0,
                    'test'    => $vkTest,
                ],
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;

        default:
            echo json_encode(['success' => false, 'error' => "Неизвестное действие: {$action}"]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Внутренняя ошибка сервера: ' . $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}

// Вспомогательные функции для CSRF
function saveToken(string $sessionFile, string $token, int $ttl): void {
    $data = file_exists($sessionFile) ? json_decode(file_get_contents($sessionFile), true) : [];
    $now = time();
    $data[$token] = $now + $ttl;
    foreach ($data as $t => $exp) {
        if ($exp < $now) unset($data[$t]);
    }
    @file_put_contents($sessionFile, json_encode($data));
}

function verifyAndConsumeToken(string $sessionFile, string $token): bool {
    if (!file_exists($sessionFile)) return true;
    $data = json_decode(file_get_contents($sessionFile), true);
    if (!isset($data[$token])) return false;
    $exp = $data[$token];
    unset($data[$token]);
    @file_put_contents($sessionFile, json_encode($data));
    return $exp >= time();
}
