<?php
/**
 * ============================================================================
 * VISHENKA — Автономный обработчик таблиц Excel (.XLSX)
 * ============================================================================
 * Читает и обновляет листы «Расписание» и «Записи» без тяжелых зависимостей.
 */

class XlsxHandler {
    /**
     * Создает начальный шаблон книги Excel со всеми формулами, расписанием и вкладками
     */
    public static function createDefaultWorkbook(string $filePath): bool {
        $dir = dirname($filePath);
        if (!is_dir($dir)) mkdir($dir, 0777, true);

        $defaultSchedule = self::getDefaultScheduleData();
        return self::buildXlsxFile($filePath, $defaultSchedule, []);
    }

    /**
     * Считывает данные из XLSX-файла
     */
    public static function readWorkbook(string $filePath): array {
        if (!file_exists($filePath)) {
            return ['schedule' => self::getDefaultScheduleData(), 'bookings' => []];
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return ['schedule' => self::getDefaultScheduleData(), 'bookings' => []];
        }

        // 1. Считываем sharedStrings
        $sharedStrings = [];
        $ssXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssXml !== false) {
            $xml = simplexml_load_string($ssXml);
            if ($xml) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string)$si->t;
                    } elseif (isset($si->r)) {
                        $tStr = '';
                        foreach ($si->r as $r) {
                            $tStr .= (string)$r->t;
                        }
                        $sharedStrings[] = $tStr;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Считываем карту листов
        $wbXml = $zip->getFromName('xl/workbook.xml');
        $sheetFiles = [1 => 'Расписание', 2 => 'Записи'];
        if ($wbXml !== false) {
            $wb = simplexml_load_string($wbXml);
            if ($wb && isset($wb->sheets->sheet)) {
                $sheetFiles = [];
                $idx = 1;
                foreach ($wb->sheets->sheet as $s) {
                    $name = (string)$s['name'];
                    $sheetFiles[$idx] = $name;
                    $idx++;
                }
            }
        }

        $schedule = [];
        $bookings = [];

        foreach ($sheetFiles as $idx => $sheetName) {
            $sheetXmlStr = $zip->getFromName("xl/worksheets/sheet{$idx}.xml");
            if ($sheetXmlStr === false) continue;

            $sheetXml = simplexml_load_string($sheetXmlStr);
            if (!$sheetXml || !isset($sheetXml->sheetData->row)) continue;

            $isSchedule = (mb_stripos($sheetName, 'распис') !== false || $idx === 1);
            $isBookings = (mb_stripos($sheetName, 'запис') !== false || $idx === 2);

            $rows = [];
            foreach ($sheetXml->sheetData->row as $row) {
                $rowNum = (int)$row['r'];
                $rowData = [];
                foreach ($row->c as $cell) {
                    $colLetter = preg_replace('/[0-9]/', '', (string)$cell['r']);
                    $colIdx = self::colLetterToIndex($colLetter);
                    $valType = (string)$cell['t'];
                    $rawVal = isset($cell->v) ? (string)$cell->v : '';

                    $val = $rawVal;
                    if ($valType === 's') {
                        $ssIdx = (int)$rawVal;
                        $val = $sharedStrings[$ssIdx] ?? '';
                    } elseif ($valType === 'inlineStr' && isset($cell->is->t)) {
                        $val = (string)$cell->is->t;
                    }
                    $rowData[$colIdx] = trim($val);
                }
                $rows[$rowNum] = $rowData;
            }

            if ($isSchedule) {
                $schedule = self::parseScheduleRows($rows);
            } elseif ($isBookings) {
                $bookings = self::parseBookingsRows($rows);
            }
        }

        $zip->close();

        if (empty($schedule)) {
            $schedule = self::getDefaultScheduleData();
        }

        return ['schedule' => $schedule, 'bookings' => $bookings];
    }

    /**
     * Добавляет запись и обновляет счетчик в XLSX файле
     */
    public static function appendBookingAndUpdateSlot(string $filePath, array $bookingData): bool {
        $data = self::readWorkbook($filePath);
        $schedule = $data['schedule'];
        $bookings = $data['bookings'];

        // Добавляем новую запись
        $bookings[] = [
            'created_at' => date('d.m.Y H:i:s'),
            'name'       => $bookingData['name'] ?? '',
            'phone'      => $bookingData['phone'] ?? '',
            'branch'     => $bookingData['branch'] ?? '',
            'direction'  => $bookingData['direction'] ?? '',
            'date'       => $bookingData['date'] ?? '',
            'time'       => $bookingData['time'] ?? '',
            'trainer'    => $bookingData['trainer'] ?? '',
            'goal'       => $bookingData['goal'] ?? '',
            'source'     => $bookingData['source'] ?? 'Сайт',
        ];

        // Если это запись на конкретный слот, увеличиваем число занятых мест
        if (!empty($bookingData['direction']) && !empty($bookingData['time'])) {
            $targetDir = mb_strtolower(trim($bookingData['direction']));
            $targetTime = trim($bookingData['time']);
            $targetBranch = mb_strtolower(trim($bookingData['branch'] ?? ''));

            foreach ($schedule as &$slot) {
                $sDir = mb_strtolower(trim($slot['direction']));
                $sTime = trim($slot['time']);
                $sBranch = mb_strtolower(trim($slot['branch']));

                $matchBranch = empty($targetBranch) || mb_stripos($sBranch, 'рошель') !== false && mb_stripos($targetBranch, 'рошель') !== false
                    || mb_stripos($sBranch, 'зайцев') !== false && mb_stripos($targetBranch, 'зайцев') !== false;

                if ($sDir === $targetDir && $sTime === $targetTime && $matchBranch) {
                    $slot['booked'] = min($slot['total'], ($slot['booked'] ?? 0) + 1);
                    $slot['available'] = max(0, $slot['total'] - $slot['booked']);
                    break;
                }
            }
        }

        return self::buildXlsxFile($filePath, $schedule, $bookings);
    }

    /**
     * Генерирует корректный ZIP/XLSX файл со структурой OpenXML
     */
    private static function buildXlsxFile(string $filePath, array $schedule, array $bookings): bool {
        $zip = new ZipArchive();
        if ($zip->open($filePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return false;
        }

        // Shared Strings Collector
        $strings = [];
        $stringMap = [];
        $addStr = function(string $s) use (&$strings, &$stringMap): int {
            $s = (string)$s;
            if (isset($stringMap[$s])) return $stringMap[$s];
            $idx = count($strings);
            $strings[] = $s;
            $stringMap[$s] = $idx;
            return $idx;
        };

        // 1. [Content_Types].xml
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            . '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            . '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            . '</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        // 2. _rels/.rels
        $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '</Relationships>';
        $zip->addFromString('_rels/.rels', $rels);

        // 3. xl/_rels/workbook.xml.rels
        $wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'
            . '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
            . '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            . '</Relationships>';
        $zip->addFromString('xl/_rels/workbook.xml.rels', $wbRels);

        // 4. xl/workbook.xml
        $wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheets>'
            . '<sheet name="Расписание" sheetId="1" r:id="rId1"/>'
            . '<sheet name="Записи" sheetId="2" r:id="rId2"/>'
            . '</sheets>'
            . '</workbook>';
        $zip->addFromString('xl/workbook.xml', $wb);

        // 5. xl/styles.xml
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<fonts count="2">'
            . '<font><sz val="11"/><name val="Calibri"/></font>'
            . '<font><b/><sz val="11"/><name val="Calibri"/></font>'
            . '</fonts>'
            . '<fills count="2">'
            . '<fill><patternFill patternType="none"/></fill>'
            . '<fill><patternFill patternType="gray125"/></fill>'
            . '</fills>'
            . '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            . '<cellXfs count="2">'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            . '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
            . '</cellXfs>'
            . '</styleSheet>';
        $zip->addFromString('xl/styles.xml', $styles);

        // 6. Build Sheet1: Расписание
        $sheet1Rows = [];
        $headers1 = ['Филиал', 'День недели', 'Время', 'Направление', 'Преподаватель', 'Длительность', 'Всего мест', 'Занято мест', 'Осталось мест', 'Тип'];
        $rowXml = '<row r="1">';
        foreach ($headers1 as $cIdx => $h) {
            $colLetter = self::indexToColLetter($cIdx);
            $sIdx = $addStr($h);
            $rowXml .= "<c r="{$colLetter}1" t="s" s="1"><v>{$sIdx}</v></c>";
        }
        $rowXml .= '</row>';
        $sheet1Rows[] = $rowXml;

        $rNum = 2;
        foreach ($schedule as $s) {
            $total = (int)($s['total'] ?? 8);
            $booked = (int)($s['booked'] ?? 0);
            $avail = max(0, $total - $booked);

            $vals = [
                0 => ['t' => 's', 'v' => $addStr($s['branch'] ?? 'Ла-Рошель')],
                1 => ['t' => 's', 'v' => $addStr(self::dayNumToName($s['day'] ?? 1))],
                2 => ['t' => 's', 'v' => $addStr($s['time'] ?? '09:00')],
                3 => ['t' => 's', 'v' => $addStr($s['direction'] ?? '')],
                4 => ['t' => 's', 'v' => $addStr($s['trainer'] ?? '')],
                5 => ['t' => 's', 'v' => $addStr($s['duration'] ?? '55 мин')],
                6 => ['t' => 'n', 'v' => $total],
                7 => ['t' => 'n', 'v' => $booked],
                8 => ['t' => 'n', 'v' => $avail, 'f' => "MAX(0,G{$rNum}-H{$rNum})"],
                9 => ['t' => 's', 'v' => $addStr($s['type'] ?? 'Фитнес')],
            ];

            $rowXml = "<row r="{$rNum}">";
            foreach ($vals as $cIdx => $vInfo) {
                $colLetter = self::indexToColLetter($cIdx);
                if (isset($vInfo['f'])) {
                    $rowXml .= "<c r="{$colLetter}{$rNum}"><f>{$vInfo['f']}</f><v>{$vInfo['v']}</v></c>";
                } elseif ($vInfo['t'] === 's') {
                    $rowXml .= "<c r="{$colLetter}{$rNum}" t="s"><v>{$vInfo['v']}</v></c>";
                } else {
                    $rowXml .= "<c r="{$colLetter}{$rNum}"><v>{$vInfo['v']}</v></c>";
                }
            }
            $rowXml .= '</row>';
            $sheet1Rows[] = $rowXml;
            $rNum++;
        }

        $sheet1Xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<sheetData>' . implode('', $sheet1Rows) . '</sheetData>'
            . '</worksheet>';
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet1Xml);

        // 7. Build Sheet2: Записи
        $sheet2Rows = [];
        $headers2 = ['Дата и время записи', 'Имя клиента', 'Телефон', 'Филиал', 'Направление', 'Дата занятия', 'Время занятия', 'Преподаватель', 'Цель / Запрос', 'Источник'];
        $rowXml = '<row r="1">';
        foreach ($headers2 as $cIdx => $h) {
            $colLetter = self::indexToColLetter($cIdx);
            $sIdx = $addStr($h);
            $rowXml .= "<c r="{$colLetter}1" t="s" s="1"><v>{$sIdx}</v></c>";
        }
        $rowXml .= '</row>';
        $sheet2Rows[] = $rowXml;

        $rNum = 2;
        foreach ($bookings as $b) {
            $vals = [
                0 => $addStr($b['created_at'] ?? date('d.m.Y H:i:s')),
                1 => $addStr($b['name'] ?? ''),
                2 => $addStr($b['phone'] ?? ''),
                3 => $addStr($b['branch'] ?? ''),
                4 => $addStr($b['direction'] ?? ''),
                5 => $addStr($b['date'] ?? ''),
                6 => $addStr($b['time'] ?? ''),
                7 => $addStr($b['trainer'] ?? ''),
                8 => $addStr($b['goal'] ?? ''),
                9 => $addStr($b['source'] ?? 'Сайт'),
            ];

            $rowXml = "<row r="{$rNum}">";
            foreach ($vals as $cIdx => $sIdx) {
                $colLetter = self::indexToColLetter($cIdx);
                $rowXml .= "<c r="{$colLetter}{$rNum}" t="s"><v>{$sIdx}</v></c>";
            }
            $rowXml .= '</row>';
            $sheet2Rows[] = $rowXml;
            $rNum++;
        }

        $sheet2Xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<sheetData>' . implode('', $sheet2Rows) . '</sheetData>'
            . '</worksheet>';
        $zip->addFromString('xl/worksheets/sheet2.xml', $sheet2Xml);

        // 8. SharedStrings XML
        $ssItems = [];
        foreach ($strings as $str) {
            $escaped = htmlspecialchars($str, ENT_XML1 | ENT_COMPAT, 'UTF-8');
            $ssItems[] = "<si><t>{$escaped}</t></si>";
        }
        $count = count($strings);
        $ssXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . "<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{$count}" uniqueCount="{$count}">"
            . implode('', $ssItems)
            . '</sst>';
        $zip->addFromString('xl/sharedStrings.xml', $ssXml);

        $zip->close();
        return true;
    }

    private static function parseScheduleRows(array $rows): array {
        $schedule = [];
        $id = 1;

        foreach ($rows as $rNum => $cells) {
            if ($rNum === 1) continue; // Пропуск заголовка
            if (empty($cells[3])) continue; // Пустое направление

            $branchRaw = $cells[0] ?? 'Ла-Рошель';
            $branch = (mb_stripos($branchRaw, 'зайцев') !== false) ? 'zaytseva' : 'larochelle';

            $dayRaw = $cells[1] ?? 'Понедельник';
            $dayNum = self::dayNameToNum($dayRaw);

            $time = $cells[2] ?? '09:00';
            $direction = $cells[3] ?? '';
            $trainer = $cells[4] ?? '';
            $duration = $cells[5] ?? '55 мин';
            $total = !empty($cells[6]) ? (int)$cells[6] : 8;
            $booked = !empty($cells[7]) ? (int)$cells[7] : 0;
            $avail = max(0, $total - $booked);
            $type = $cells[9] ?? '';

            $schedule[] = [
                'id'        => $id++,
                'branch'    => $branch,
                'day'       => $dayNum,
                'time'      => $time,
                'duration'  => $duration,
                'direction' => $direction,
                'trainer'   => $trainer,
                'total'     => $total,
                'booked'    => $booked,
                'spots'     => $avail,
                'available' => $avail,
                'type'      => $type,
            ];
        }

        return $schedule;
    }

    private static function parseBookingsRows(array $rows): array {
        $bookings = [];
        foreach ($rows as $rNum => $cells) {
            if ($rNum === 1) continue;
            if (empty($cells[1]) && empty($cells[2])) continue;

            $bookings[] = [
                'created_at' => $cells[0] ?? '',
                'name'       => $cells[1] ?? '',
                'phone'      => $cells[2] ?? '',
                'branch'     => $cells[3] ?? '',
                'direction'  => $cells[4] ?? '',
                'date'       => $cells[5] ?? '',
                'time'       => $cells[6] ?? '',
                'trainer'    => $cells[7] ?? '',
                'goal'       => $cells[8] ?? '',
                'source'     => $cells[9] ?? '',
            ];
        }
        return $bookings;
    }

    public static function getDefaultScheduleData(): array {
        return [
            // наб. Ла-Рошель, 13
            ['branch' => 'Ла-Рошель', 'day' => 1, 'time' => '09:30', 'duration' => '55 мин', 'direction' => 'Пилатес', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 4, 'type' => 'Осанка'],
            ['branch' => 'Ла-Рошель', 'day' => 1, 'time' => '18:30', 'duration' => '55 мин', 'direction' => 'Здоровая спина', 'trainer' => 'Алена', 'total' => 8, 'booked' => 6, 'type' => 'Спина'],
            ['branch' => 'Ла-Рошель', 'day' => 1, 'time' => '19:45', 'duration' => '55 мин', 'direction' => 'Классическая растяжка', 'trainer' => 'Алина', 'total' => 8, 'booked' => 5, 'type' => 'Гибкость'],

            ['branch' => 'Ла-Рошель', 'day' => 2, 'time' => '10:00', 'duration' => '55 мин', 'direction' => 'Пилатес Mat', 'trainer' => 'Алена', 'total' => 8, 'booked' => 5, 'type' => 'Осанка'],
            ['branch' => 'Ла-Рошель', 'day' => 2, 'time' => '18:30', 'duration' => '55 мин', 'direction' => 'Петли TRX', 'trainer' => 'Даша П.', 'total' => 8, 'booked' => 4, 'type' => 'Сила'],
            ['branch' => 'Ла-Рошель', 'day' => 2, 'time' => '19:45', 'duration' => '55 мин', 'direction' => 'Хатха-йога', 'trainer' => 'Настя', 'total' => 8, 'booked' => 3, 'type' => 'Йога'],

            ['branch' => 'Ла-Рошель', 'day' => 3, 'time' => '18:30', 'duration' => '55 мин', 'direction' => 'Силовой фитнес', 'trainer' => 'Даша П.', 'total' => 8, 'booked' => 5, 'type' => 'Тонус'],
            ['branch' => 'Ла-Рошель', 'day' => 3, 'time' => '19:45', 'duration' => '55 мин', 'direction' => 'Динамическая растяжка', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 6, 'type' => 'Гибкость'],

            ['branch' => 'Ла-Рошель', 'day' => 4, 'time' => '10:30', 'duration' => '55 мин', 'direction' => 'Женское здоровье', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 4, 'type' => 'Здоровье'],
            ['branch' => 'Ла-Рошель', 'day' => 4, 'time' => '18:30', 'duration' => '55 мин', 'direction' => 'Пилатес', 'trainer' => 'Алена', 'total' => 8, 'booked' => 6, 'type' => 'Осанка'],
            ['branch' => 'Ла-Рошель', 'day' => 4, 'time' => '19:45', 'duration' => '55 мин', 'direction' => 'Классическая растяжка', 'trainer' => 'Алина', 'total' => 8, 'booked' => 5, 'type' => 'Гибкость'],

            ['branch' => 'Ла-Рошель', 'day' => 5, 'time' => '18:30', 'duration' => '55 мин', 'direction' => 'Здоровая спина', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 5, 'type' => 'Спина'],
            ['branch' => 'Ла-Рошель', 'day' => 5, 'time' => '19:45', 'duration' => '55 мин', 'direction' => 'Хатха-йога', 'trainer' => 'Настя', 'total' => 8, 'booked' => 4, 'type' => 'Йога'],

            ['branch' => 'Ла-Рошель', 'day' => 6, 'time' => '11:00', 'duration' => '55 мин', 'direction' => 'Женское здоровье', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 4, 'type' => 'Здоровье'],
            ['branch' => 'Ла-Рошель', 'day' => 7, 'time' => '11:30', 'duration' => '55 мин', 'direction' => 'Йога-релакс', 'trainer' => 'Настя', 'total' => 8, 'booked' => 3, 'type' => 'Релакс'],

            // ул. Зайцева, 67
            ['branch' => 'Зайцева', 'day' => 1, 'time' => '09:00', 'duration' => '55 мин', 'direction' => 'Здоровая спина', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 5, 'type' => 'Спина'],
            ['branch' => 'Зайцева', 'day' => 1, 'time' => '11:00', 'duration' => '55 мин', 'direction' => 'Пилатес', 'trainer' => 'Алена', 'total' => 8, 'booked' => 6, 'type' => 'Осанка'],
            ['branch' => 'Зайцева', 'day' => 1, 'time' => '18:00', 'duration' => '55 мин', 'direction' => 'Петли TRX', 'trainer' => 'Даша П.', 'total' => 8, 'booked' => 4, 'type' => 'Сила'],
            ['branch' => 'Зайцева', 'day' => 1, 'time' => '19:15', 'duration' => '55 мин', 'direction' => 'Динамическая растяжка', 'trainer' => 'Алина', 'total' => 8, 'booked' => 6, 'type' => 'Гибкость'],
            ['branch' => 'Зайцева', 'day' => 1, 'time' => '20:30', 'duration' => '55 мин', 'direction' => 'Хатха-йога', 'trainer' => 'Настя', 'total' => 8, 'booked' => 3, 'type' => 'Йога'],

            ['branch' => 'Зайцева', 'day' => 2, 'time' => '10:00', 'duration' => '55 мин', 'direction' => 'Для будущих мам', 'trainer' => 'Алена', 'total' => 8, 'booked' => 5, 'type' => 'Мамы'],
            ['branch' => 'Зайцева', 'day' => 2, 'time' => '18:00', 'duration' => '55 мин', 'direction' => 'Силовой фитнес', 'trainer' => 'Даша П.', 'total' => 8, 'booked' => 4, 'type' => 'Тонус'],
            ['branch' => 'Зайцева', 'day' => 2, 'time' => '19:15', 'duration' => '55 мин', 'direction' => 'Здоровая спина', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 7, 'type' => 'Спина'],
            ['branch' => 'Зайцева', 'day' => 2, 'time' => '20:30', 'duration' => '55 мин', 'direction' => 'Классическая растяжка', 'trainer' => 'Алина', 'total' => 8, 'booked' => 5, 'type' => 'Гибкость'],

            ['branch' => 'Зайцева', 'day' => 3, 'time' => '09:00', 'duration' => '55 мин', 'direction' => 'Пилатес', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 4, 'type' => 'Осанка'],
            ['branch' => 'Зайцева', 'day' => 3, 'time' => '18:00', 'duration' => '55 мин', 'direction' => 'Петли TRX', 'trainer' => 'Даша П.', 'total' => 8, 'booked' => 6, 'type' => 'Сила'],
            ['branch' => 'Зайцева', 'day' => 3, 'time' => '19:15', 'duration' => '55 мин', 'direction' => 'Пилатес', 'trainer' => 'Алена', 'total' => 8, 'booked' => 5, 'type' => 'Осанка'],

            ['branch' => 'Зайцева', 'day' => 4, 'time' => '18:00', 'duration' => '55 мин', 'direction' => 'Силовой фитнес', 'trainer' => 'Даша П.', 'total' => 8, 'booked' => 4, 'type' => 'Тонус'],
            ['branch' => 'Зайцева', 'day' => 4, 'time' => '19:15', 'duration' => '55 мин', 'direction' => 'Классическая растяжка', 'trainer' => 'Алина', 'total' => 8, 'booked' => 6, 'type' => 'Гибкость'],
            ['branch' => 'Зайцева', 'day' => 4, 'time' => '20:30', 'duration' => '55 мин', 'direction' => 'Женское здоровье', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 5, 'type' => 'Здоровье'],

            ['branch' => 'Зайцева', 'day' => 5, 'time' => '09:00', 'duration' => '55 мин', 'direction' => 'Пилатес', 'trainer' => 'Алена', 'total' => 8, 'booked' => 4, 'type' => 'Осанка'],
            ['branch' => 'Зайцева', 'day' => 5, 'time' => '18:00', 'duration' => '55 мин', 'direction' => 'Здоровая спина', 'trainer' => 'Татьяна Прокопенко', 'total' => 8, 'booked' => 6, 'type' => 'Спина'],
            ['branch' => 'Зайцева', 'day' => 5, 'time' => '19:15', 'duration' => '55 мин', 'direction' => 'Петли TRX', 'trainer' => 'Даша П.', 'total' => 8, 'booked' => 5, 'type' => 'Сила'],

            ['branch' => 'Зайцева', 'day' => 6, 'time' => '11:00', 'duration' => '55 мин', 'direction' => 'Субботняя растяжка', 'trainer' => 'Алина', 'total' => 8, 'booked' => 3, 'type' => 'Гибкость'],
            ['branch' => 'Зайцева', 'day' => 7, 'time' => '11:00', 'duration' => '55 мин', 'direction' => 'Йога выходного дня', 'trainer' => 'Настя', 'total' => 8, 'booked' => 4, 'type' => 'Йога'],
        ];
    }

    private static function colLetterToIndex(string $col): int {
        $col = strtoupper($col);
        $len = strlen($col);
        $idx = 0;
        for ($i = 0; $i < $len; $i++) {
            $idx = $idx * 26 + (ord($col[$i]) - ord('A') + 1);
        }
        return $idx - 1;
    }

    private static function indexToColLetter(int $idx): string {
        $letter = '';
        $idx++;
        while ($idx > 0) {
            $mod = ($idx - 1) % 26;
            $letter = chr(65 + $mod) . $letter;
            $idx = (int)(($idx - $mod) / 26);
        }
        return $letter;
    }

    private static function dayNameToNum(string $name): int {
        $name = mb_strtolower(trim($name));
        if (mb_strpos($name, 'пон') !== false || $name === 'пн' || $name === '1') return 1;
        if (mb_strpos($name, 'втор') !== false || $name === 'вт' || $name === '2') return 2;
        if (mb_strpos($name, 'сред') !== false || $name === 'ср' || $name === '3') return 3;
        if (mb_strpos($name, 'четв') !== false || $name === 'чт' || $name === '4') return 4;
        if (mb_strpos($name, 'пятн') !== false || $name === 'пт' || $name === '5') return 5;
        if (mb_strpos($name, 'субб') !== false || $name === 'сб' || $name === '6') return 6;
        if (mb_strpos($name, 'воск') !== false || $name === 'вс' || $name === '7') return 7;
        return 1;
    }

    private static function dayNumToName(int $num): string {
        $days = [1 => 'Понедельник', 2 => 'Вторник', 3 => 'Среда', 4 => 'Четверг', 5 => 'Пятница', 6 => 'Суббота', 7 => 'Воскресенье'];
        return $days[$num] ?? 'Понедельник';
    }
}
