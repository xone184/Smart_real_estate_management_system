<?php
// =============================================
// SmartRE - Phân tích Xu hướng Thị trường BĐS
// Tổng hợp dữ liệu thời gian thực từ nhiều nguồn internet
// Sources: VnExpress, VietnamNet, Thanh Niên, CafeF, Dân Trí
// Cache: 15 phút
// =============================================

require_once __DIR__ . '/../config.php';

$cacheFile = sys_get_temp_dir() . '/smartre_market_trends_v3.json';
$cacheTime = 900; // 15 minutes

// Kiểm tra cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime)) {
    $cachedData = file_get_contents($cacheFile);
    if ($cachedData) {
        header('Content-Type: application/json; charset=utf-8');
        echo $cachedData;
        exit;
    }
}

// ---- Helper: fetch URL an toàn ----
function fetch_url($url, $timeout = 10) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_USERAGENT => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        CURLOPT_HTTPHEADER => [
            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language: vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control: no-cache",
        ],
    ]);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($httpCode >= 200 && $httpCode < 400) ? $result : false;
}

// ---- Helper: parse RSS XML ----
function parse_rss($raw, $sourceName, $sourceKey, $maxItems = 15) {
    $items = [];
    if (!$raw) return $items;
    
    // Suppress XML errors
    libxml_use_internal_errors(true);
    $xml = @simplexml_load_string($raw);
    if (!$xml) return $items;
    
    $channel = $xml->channel ?? null;
    if (!$channel || !isset($channel->item)) return $items;
    
    $count = 0;
    foreach ($channel->item as $item) {
        if ($count++ >= $maxItems) break;
        
        $title = trim((string)$item->title);
        $link = trim((string)$item->link);
        $desc = strip_tags(trim((string)$item->description));
        $pubDate = (string)$item->pubDate;
        $timestamp = $pubDate ? @strtotime($pubDate) : time();
        
        if (!$title || !$link) continue;
        
        $items[] = [
            'id' => $sourceKey . '_' . md5($link),
            'title' => $title,
            'link' => $link,
            'snippet' => mb_substr($desc, 0, 250),
            'source' => $sourceName,
            'source_key' => $sourceKey,
            'timestamp' => $timestamp * 1000,
            'date' => date('Y-m-d', $timestamp),
            'date_label' => date('d/m', $timestamp),
        ];
    }
    
    return $items;
}

// ---- Nguồn dữ liệu RSS BĐS Việt Nam ----
$sources = [
    [
        'name' => 'VnExpress',
        'key' => 'vnexpress',
        'url' => 'https://vnexpress.net/rss/bat-dong-san.rss',
        'color' => '#e8342f',
    ],
    [
        'name' => 'VietnamNet',
        'key' => 'vietnamnet',
        'url' => 'https://vietnamnet.vn/rss/bat-dong-san.rss',
        'color' => '#0066cc',
    ],
    [
        'name' => 'Thanh Niên',
        'key' => 'thanhnien',
        'url' => 'https://thanhnien.vn/rss/kinh-te/dia-oc.rss',
        'color' => '#e4002b',
    ],
    [
        'name' => 'CafeF',
        'key' => 'cafef',
        'url' => 'https://cafef.vn/rss/bat-dong-san.rss',
        'color' => '#ff6600',
    ],
    [
        'name' => 'Dân Trí',
        'key' => 'dantri',
        'url' => 'https://dantri.com.vn/rss/bat-dong-san.htm',
        'color' => '#003d7a',
    ],
];

// ---- Fetch tất cả nguồn song song (curl_multi) ----
$multiHandle = curl_multi_init();
$curlHandles = [];

foreach ($sources as $i => $src) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $src['url'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_USERAGENT => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        CURLOPT_HTTPHEADER => [
            "Accept: application/xml,text/xml,*/*;q=0.8",
            "Accept-Language: vi-VN,vi;q=0.9",
        ],
    ]);
    $curlHandles[$i] = $ch;
    curl_multi_add_handle($multiHandle, $ch);
}

// Execute multi curl
$running = null;
do {
    curl_multi_exec($multiHandle, $running);
    curl_multi_select($multiHandle);
} while ($running > 0);

// Thu thập kết quả
$allArticles = [];
$sourceStats = [];

foreach ($sources as $i => $src) {
    $raw = curl_multi_getcontent($curlHandles[$i]);
    $httpCode = curl_getinfo($curlHandles[$i], CURLINFO_HTTP_CODE);
    curl_multi_remove_handle($multiHandle, $curlHandles[$i]);
    curl_close($curlHandles[$i]);
    
    $articles = [];
    if ($raw && $httpCode >= 200 && $httpCode < 400) {
        $articles = parse_rss($raw, $src['name'], $src['key']);
    }
    
    $sourceStats[] = [
        'name' => $src['name'],
        'key' => $src['key'],
        'color' => $src['color'],
        'count' => count($articles),
        'status' => count($articles) > 0 ? 'ok' : 'error',
    ];
    
    $allArticles = array_merge($allArticles, $articles);
}

curl_multi_close($multiHandle);

// ---- Sắp xếp theo thời gian ----
usort($allArticles, function($a, $b) {
    return $b['timestamp'] - $a['timestamp'];
});

// ---- Phân tích xu hướng ----

// 1. Số lượng tin theo ngày (7 ngày gần nhất)
$dailyCounts = [];
for ($i = 6; $i >= 0; $i--) {
    $d = date('Y-m-d', strtotime("-{$i} days"));
    $label = date('d/m', strtotime("-{$i} days"));
    $dailyCounts[$d] = ['date' => $d, 'label' => $label, 'count' => 0];
}
foreach ($allArticles as $art) {
    $d = $art['date'];
    if (isset($dailyCounts[$d])) {
        $dailyCounts[$d]['count']++;
    }
}
$dailyTrend = array_values($dailyCounts);

// 2. Số lượng tin theo nguồn
$bySource = [];
foreach ($sourceStats as $ss) {
    $bySource[] = [
        'name' => $ss['name'],
        'count' => $ss['count'],
        'color' => $ss['color'],
    ];
}

// 3. Phân tích từ khóa nóng (hot topics)
$keywordMap = [
    'Hà Nội' => 0, 'TP.HCM' => 0, 'Đà Nẵng' => 0, 'Bình Dương' => 0,
    'Đồng Nai' => 0, 'Hải Phòng' => 0, 'Quảng Ninh' => 0, 'Nha Trang' => 0,
    'Bắc Ninh' => 0, 'Long An' => 0, 'Hưng Yên' => 0, 'Thanh Hóa' => 0,
    'Bà Rịa' => 0, 'Phú Quốc' => 0, 'Cần Thơ' => 0,
];

$typeKeywords = [
    'Chung cư' => ['chung cư', 'căn hộ', 'apartment'],
    'Nhà phố' => ['nhà phố', 'nhà mặt tiền', 'nhà riêng'],
    'Đất nền' => ['đất nền', 'đất thổ cư', 'lô đất', 'phân lô'],
    'Biệt thự' => ['biệt thự', 'villa', 'penthouse'],
    'Văn phòng' => ['văn phòng', 'officetel', 'office'],
    'Shophouse' => ['shophouse', 'nhà phố thương mại'],
];

$topicKeywords = [
    'Tăng giá' => ['tăng giá', 'tăng mạnh', 'sốt đất', 'tăng nóng', 'lên giá', 'giá tăng', 'bùng nổ'],
    'Giảm giá' => ['giảm giá', 'hạ giá', 'giá giảm', 'giảm sâu', 'rớt giá', 'xuống giá', 'bán lỗ', 'cắt lỗ'],
    'Đầu tư' => ['đầu tư', 'sinh lời', 'lợi nhuận', 'đầu cơ'],
    'Pháp lý' => ['pháp lý', 'sổ đỏ', 'sổ hồng', 'giấy phép', 'quy hoạch'],
    'Hạ tầng' => ['hạ tầng', 'cao tốc', 'metro', 'sân bay', 'cầu', 'đường'],
    'Tín dụng' => ['lãi suất', 'vay', 'ngân hàng', 'tín dụng', 'cho vay'],
];

$typeCounts = [];
$topicCounts = [];

foreach ($allArticles as $art) {
    $text = mb_strtolower($art['title'] . ' ' . $art['snippet']);
    
    // Đếm khu vực
    foreach ($keywordMap as $kw => $c) {
        if (mb_stripos($text, mb_strtolower($kw)) !== false) {
            $keywordMap[$kw]++;
        }
    }
    
    // Đếm loại hình
    foreach ($typeKeywords as $type => $kws) {
        foreach ($kws as $kw) {
            if (mb_stripos($text, $kw) !== false) {
                $typeCounts[$type] = ($typeCounts[$type] ?? 0) + 1;
                break;
            }
        }
    }
    
    // Đếm chủ đề
    foreach ($topicKeywords as $topic => $kws) {
        foreach ($kws as $kw) {
            if (mb_stripos($text, $kw) !== false) {
                $topicCounts[$topic] = ($topicCounts[$topic] ?? 0) + 1;
                break;
            }
        }
    }
}

// Top khu vực nóng
arsort($keywordMap);
$hotAreas = [];
foreach ($keywordMap as $area => $count) {
    if ($count > 0) {
        $hotAreas[] = ['name' => $area, 'count' => $count];
    }
}
$hotAreas = array_slice($hotAreas, 0, 10);

// Loại hình BĐS
$typeColors = [
    'Chung cư' => '#3b82f6',
    'Nhà phố' => '#10b981',
    'Đất nền' => '#f59e0b',
    'Biệt thự' => '#8b5cf6',
    'Văn phòng' => '#ef4444',
    'Shophouse' => '#06b6d4',
];
arsort($typeCounts);
$typeDistribution = [];
foreach ($typeCounts as $type => $count) {
    $typeDistribution[] = [
        'name' => $type,
        'count' => $count,
        'color' => $typeColors[$type] ?? '#94a3b8',
    ];
}

// Chủ đề nóng
$topicColors = [
    'Tăng giá' => '#ef4444',
    'Giảm giá' => '#22c55e',
    'Đầu tư' => '#3b82f6',
    'Pháp lý' => '#f59e0b',
    'Hạ tầng' => '#8b5cf6',
    'Tín dụng' => '#06b6d4',
];
arsort($topicCounts);
$hotTopics = [];
foreach ($topicCounts as $topic => $count) {
    $hotTopics[] = [
        'name' => $topic,
        'count' => $count,
        'color' => $topicColors[$topic] ?? '#94a3b8',
    ];
}

// 4. Xu hướng giá (phân tích mentions giá trong tiêu đề)
$priceIndicators = [
    'up' => 0,    // Tăng
    'down' => 0,  // Giảm
    'stable' => 0, // Ổn định
];
$upWords = ['tăng giá', 'tăng mạnh', 'sốt', 'tăng nóng', 'lên giá', 'giá tăng', 'đắt đỏ', 'kỷ lục', 'cao nhất'];
$downWords = ['giảm giá', 'hạ giá', 'giảm sâu', 'rớt giá', 'bán lỗ', 'cắt lỗ', 'thanh lý', 'giải chấp', 'ế ẩm'];
$stableWords = ['ổn định', 'đi ngang', 'chững lại', 'bình ổn', 'giữ giá'];

foreach ($allArticles as $art) {
    $text = mb_strtolower($art['title']);
    foreach ($upWords as $w) { if (mb_stripos($text, $w) !== false) { $priceIndicators['up']++; break; } }
    foreach ($downWords as $w) { if (mb_stripos($text, $w) !== false) { $priceIndicators['down']++; break; } }
    foreach ($stableWords as $w) { if (mb_stripos($text, $w) !== false) { $priceIndicators['stable']++; break; } }
}

$totalSentiment = $priceIndicators['up'] + $priceIndicators['down'] + $priceIndicators['stable'];
$sentiment = 'neutral';
if ($totalSentiment > 0) {
    if ($priceIndicators['up'] > $priceIndicators['down'] * 1.5) $sentiment = 'bullish';
    elseif ($priceIndicators['down'] > $priceIndicators['up'] * 1.5) $sentiment = 'bearish';
    else $sentiment = 'neutral';
}

// ---- Kết quả tổng hợp ----
$result = [
    'status' => 'success',
    'fetched_at' => date('c'),
    'total_articles' => count($allArticles),
    'sources' => $sourceStats,
    'summary' => [
        'total_articles' => count($allArticles),
        'total_sources' => count(array_filter($sourceStats, fn($s) => $s['status'] === 'ok')),
        'sentiment' => $sentiment,
        'price_indicators' => $priceIndicators,
    ],
    'daily_trend' => $dailyTrend,
    'by_source' => $bySource,
    'hot_areas' => $hotAreas,
    'type_distribution' => $typeDistribution,
    'hot_topics' => $hotTopics,
    'articles' => array_slice($allArticles, 0, 30), // Top 30 tin mới nhất
];

$resultJson = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

// Lưu cache
file_put_contents($cacheFile, $resultJson);

// Trả kết quả
header('Content-Type: application/json; charset=utf-8');
echo $resultJson;