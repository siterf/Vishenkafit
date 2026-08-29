<?php
/**
 * ============================================================================
 * VISHENKA WELLNESS & FITNESS — Бэкенд конфигурация
 * ============================================================================
 */

return [
    // --- Яндекс.Диск API (Яндекс Документы) ---
    'yandex' => [
        // OAuth-токен от приложения Яндекс с доступом к Яндекс.Диску (https://oauth.yandex.ru/)
        'oauth_token' => 'y0__wgBEJelrSkYiKpIIPr_0OgYUXptaXQrkpZybKDiq0P0p2COnmM',

        // Путь к файлу таблицы на Яндекс.Диске (например: '/Vishenka/vishenka_studio.xlsx')
        'file_path'   => '/Vishenka/vishenka_studio.xlsx',

        // Таймаут HTTP-запросов к Яндекс.Диску (секунды)
        'timeout'     => 15,
    ],

    // --- Интеграция с ВКонтакте (VK API) ---
    'vk' => [
        'enabled'      => true,
        // Токен доступа VK с правами messages
        'access_token' => 'vk1.a.F8pUJffne9HalhK3YjDlpccyNm63qoSTAcpNc-eMUI_x5e74inzqA-x8_vZCsAdaJsyIr-dOC8zJUBdw3bevxT-DIRelX8ihrwggvqCDDKWtRp7SlktMjF_hO7zMOWzy6si_VNqFdVhc6R_k57q7AraZwKitaT7J6nX53h23iuPlGC28UM9uJ2KFppLAD0lcaM8f6fjdPVsS37pU2aSdFA',
        // ID получателя (ID администратора для личных сообщений)
        'peer_id'      => 74933608,
        // Версия VK API
        'api_version'  => '5.131',
    ],

    // --- Настройки кэширования и производительности ---
    'cache' => [
        // Время жизни кэша расписания (секунды). При новой записи кэш сбрасывается мгновенно.
        'ttl'          => 60,
    ],

    // --- Безопасность и лимиты ---
    'security' => [
        // Время жизни одноразового CSRF-токена (секунды)
        'csrf_ttl'              => 900,
        // Защита от дублей: блокировать повторную заявку с одного номера на то же занятие (секунды)
        'duplicate_lock_period' => 600,
        // Лимит мест по умолчанию в группе
        'default_capacity'      => 8,
    ],

    // --- Общие параметры ---
    'timezone' => 'Europe/Moscow',

    // Филиалы студии
    'branches' => [
        'larochelle' => [
            'id'    => 'larochelle',
            'name'  => 'наб. Ла-Рошель, 13',
            'short' => 'Ла-Рошель',
        ],
        'zaytseva' => [
            'id'    => 'zaytseva',
            'name'  => 'ул. Зайцева, 67',
            'short' => 'Зайцева',
        ],
    ],
];
