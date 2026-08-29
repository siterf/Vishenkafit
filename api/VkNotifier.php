<?php
/**
 * ============================================================================
 * VISHENKA — Модуль уведомлений ВКонтакте (VK API)
 * ============================================================================
 */

class VkNotifier {
    private array $config;

    public function __construct(array $config) {
        $this->config = $config;
    }

    /**
     * Отправляет уведомление о новой записи в VK
     */
    public function sendBookingNotification(array $data): array {
        if (empty($this->config['enabled']) || empty($this->config['access_token']) || empty($this->config['peer_id'])) {
            return ['success' => false, 'message' => 'VK notifications disabled or not configured'];
        }

        $branchName = $data['branch'] ?? 'наб. Ла-Рошель, 13';
        $direction  = $data['direction'] ?? 'Тренировка';
        $dateTime   = (!empty($data['date']) && !empty($data['time']))
            ? "{$data['date']} в {$data['time']}"
            : 'Удобное время (Общая заявка)';
        $trainer    = $data['trainer'] ?? 'Любой тренер';
        $name       = $data['name'] ?? 'Гость';
        $phone      = $data['phone'] ?? '';
        $goal       = !empty($data['goal']) ? $data['goal'] : '—';
        $source     = $data['source'] ?? 'Сайт (Расписание)';

        $msg = "🍒 Новая запись в студию Vishenka!

"
             . "👤 Имя: {$name}
"
             . "📞 Телефон: {$phone}
"
             . "🏢 Филиал: {$branchName}
"
             . "🧘 Практика: {$direction}
"
             . "📅 Дата и время: {$dateTime}
"
             . "👩‍🏫 Тренер: {$trainer}
"
             . "🎯 Запрос/Цель: {$goal}
"
             . "🌐 Источник: {$source}

"
             . "📊 Запись сохранена в Яндекс Таблицу!";

        return $this->sendMessage($msg);
    }

    /**
     * Отправляет произвольное текстовое сообщение через VK API
     */
    public function sendMessage(string $text): array {
        $url = 'https://api.vk.com/method/messages.send';
        $params = [
            'access_token' => $this->config['access_token'],
            'peer_id'      => (int)$this->config['peer_id'],
            'message'      => $text,
            'random_id'    => mt_rand(100000, 99999999),
            'v'            => $this->config['api_version'] ?? '5.131',
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($params),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['success' => false, 'error' => $error];
        }

        $json = json_decode($response, true);
        if (isset($json['error'])) {
            return [
                'success' => false,
                'error'   => $json['error']['error_msg'] ?? 'VK API error',
                'code'    => $json['error']['error_code'] ?? 0,
            ];
        }

        return ['success' => true, 'message_id' => $json['response'] ?? null];
    }
}
