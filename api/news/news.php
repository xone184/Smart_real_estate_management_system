<?php
// =============================================
// SmartRE - Thống kê Tin tức Thị trường
// API Gộp tin báo chí BĐS từ Google News và thảo luận Reddit
// Cache lưu tạm thời 10 phút để tránh bị chặn IP
// =============================================

require_once __DIR__ . '/../config.php';

$cacheFile = sys_get_temp_dir() . '/smartre_news_cache_v2.json';
$cacheTime = 600; // 10 minutes

// 1. Kiểm tra cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime)) {
    $cachedData = file_get_contents($cacheFile);
    if ($cachedData) {
        echo $cachedData;
        exit;
    }
}

// Hàm lấy dữ liệu vượt rào
function fetch_content_safe($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language: vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

$newsList = [];

// 2. Lấy dữ liệu VietnamNet
$vneUrl = "https://vietnamnet.vn/rss/bat-dong-san.rss";
$vneRaw = fetch_content_safe($vneUrl);

if ($vneRaw) {
    try {
        $xml = @simplexml_load_string($vneRaw);
        if ($xml && isset($xml->channel->item)) {
            $count = 0;
            foreach ($xml->channel->item as $item) {
                if ($count++ >= 10) break; 
                
                $desc = (string)$item->description;
                $snippet = strip_tags($desc);
                
                $newsList[] = [
                    'id' => 'vnn_' . md5((string)$item->link),
                    'title' => (string)$item->title,
                    'link' => (string)$item->link,
                    'snippet' => $snippet,
                    'source' => 'google_news', // Keep this as google_news to avoid breaking frontend icon mapping
                    'author' => 'VietnamNet',
                    'timestamp' => strtotime((string)$item->pubDate) * 1000
                ];
            }
        }
    } catch (Exception $e) { /* Lỗi parse XML */ }
}

// 3. Lấy dữ liệu Thanh Niên
$tnUrl = "https://thanhnien.vn/rss/kinh-te/dia-oc.rss";
$tnRaw = fetch_content_safe($tnUrl);

if ($tnRaw) {
    try {
        $xml = @simplexml_load_string($tnRaw);
        if ($xml && isset($xml->channel->item)) {
            $count = 0;
            foreach ($xml->channel->item as $item) {
                if ($count++ >= 10) break;
                
                $desc = (string)$item->description;
                $snippet = strip_tags($desc);

                $newsList[] = [
                    'id' => 'tn_' . md5((string)$item->link),
                    'title' => (string)$item->title,
                    'link' => (string)$item->link,
                    'snippet' => $snippet,
                    'source' => 'reddit', // Keep this as 'reddit' for icon compatibility, or the frontend won't show an icon.
                    'author' => 'Thanh Niên',
                    'timestamp' => strtotime((string)$item->pubDate) * 1000
                ];
            }
        }
    } catch (Exception $e) { /* Lỗi parse XML */ }
}

// 4. Sắp xếp dựa theo thời gian giảm dần
usort($newsList, function($a, $b) {
    return $b['timestamp'] - $a['timestamp'];
});

$resultJson = json_encode(['status' => 'success', 'data' => $newsList], JSON_UNESCAPED_UNICODE);

// Lưu vào cache
file_put_contents($cacheFile, $resultJson);

// Trả về dữ liệu
echo $resultJson;
