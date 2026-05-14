<?php
// =============================================
// SmartRE - Thống kê Tin tức Thị trường
// API Gộp tin báo chí BĐS từ Google News và thảo luận Reddit
// Cache lưu tạm thời 10 phút để tránh bị chặn IP
// =============================================

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

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

// 2. Lấy dữ liệu Google News
$gnUrl = "https://news.google.com/rss/search?q=bất+động+sản+Hà+Nội+OR+nhà+đất+Hà+Nội&hl=vi&gl=VN&ceid=VN:vi";
$gnRaw = fetch_content_safe($gnUrl);

if ($gnRaw) {
    try {
        $xml = simplexml_load_string($gnRaw);
        if ($xml && isset($xml->channel->item)) {
            $count = 0;
            foreach ($xml->channel->item as $item) {
                if ($count++ >= 15) break; 
                $newsList[] = [
                    'id' => 'gn_' . md5((string)$item->link),
                    'title' => (string)$item->title,
                    'link' => (string)$item->link,
                    'snippet' => strip_tags((string)$item->description), // Đơn giản hóa HTML
                    'source' => 'google_news',
                    'author' => (string)$item->source,
                    'timestamp' => strtotime((string)$item->pubDate) * 1000 // Chuyển sang ms dùng trong JS
                ];
            }
        }
    } catch (Exception $e) { /* Lỗi parse XML -> bỏ qua */ }
}

// 3. Lấy dữ liệu Reddit
$rdUrl = "https://www.reddit.com/search.rss?q=hanoi+real+estate+OR+bất+động+sản+hà+nội&sort=new&limit=10";
$rdRaw = fetch_content_safe($rdUrl);

if ($rdRaw) {
    try {
        $xml = simplexml_load_string($rdRaw);
        // Reddit trả về dạng Atom feed thay vì RSS 2.0
        if ($xml && isset($xml->entry)) {
            $count = 0;
            foreach ($xml->entry as $entry) {
                if ($count++ >= 10) break;
                // Parse tác giả từ chuỗi /u/ABC
                $author = isset($entry->author->name) ? (string)$entry->author->name : 'Reddit User';
                $snippet = '';
                if(isset($entry->content)) {
                    // Extract a short sensible snippet from Reddit HTML chaos
                    $snippet = strip_tags(html_entity_decode((string)$entry->content));
                    $snippet = substr($snippet, 0, 150) . (strlen($snippet) > 150 ? '...' : '');
                }

                $newsList[] = [
                    'id' => 'rd_' . md5((string)$entry->link['href']),
                    'title' => (string)$entry->title,
                    'link' => (string)$entry->link['href'],
                    'snippet' => $snippet,
                    'source' => 'reddit',
                    'author' => $author,
                    'timestamp' => strtotime((string)$entry->updated) * 1000
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
