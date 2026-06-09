<?php
require_once __DIR__ . '/../config.php';

$method = getMethod();
if ($method === 'OPTIONS') {
    jsonResponse(200, ['status' => 'ok']);
}

if ($method !== 'GET') {
    jsonResponse(405, ['error' => 'Method not allowed']);
}

$user = getAuthUser();
$userId = $user ? $user['id'] : null;

try {
    $db = getDB();
    
    // 1. Phân tích từ khóa từ user_activities
    $keywordsMap = [];
    if ($userId) {
        $stmt = $db->prepare("SELECT metadata FROM user_activities WHERE user_id = ? AND metadata IS NOT NULL ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$userId]);
        $activities = $stmt->fetchAll();
        
        foreach ($activities as $act) {
            $meta = json_decode($act['metadata'], true);
            if ($meta && isset($meta['keywords']) && is_array($meta['keywords'])) {
                foreach ($meta['keywords'] as $kw) {
                    $k = mb_strtolower($kw, 'UTF-8');
                    $keywordsMap[$k] = ($keywordsMap[$k] ?? 0) + 1;
                }
            }
        }
    }
    
    // Sort keywords by frequency
    arsort($keywordsMap);
    $topKeywords = array_slice(array_keys($keywordsMap), 0, 5);
    
    if (empty($topKeywords)) {
        $topKeywords = ["bất động sản", "đầu tư", "chung cư"]; // Default fallbacks
    }

    // Cập nhật lại user_interests nếu có user
    if ($userId) {
        $jsonKeywords = json_encode($topKeywords, JSON_UNESCAPED_UNICODE);
        $stmt = $db->prepare("INSERT INTO user_interests (user_id, top_keywords) VALUES (?, ?) ON DUPLICATE KEY UPDATE top_keywords = VALUES(top_keywords), last_analyzed_at = CURRENT_TIMESTAMP");
        $stmt->execute([$userId, $jsonKeywords]);
    }

    // 2. Đề xuất tin tức (Mock logic: gọi news API và filter dựa trên keyword)
    // Để nhanh gọn, ta giả lập lấy tin tức cache từ smartre_news_cache_v2.json
    $cacheFile = sys_get_temp_dir() . '/smartre_news_cache_v2.json';
    $recommendedNews = [];
    
    if (file_exists($cacheFile)) {
        $newsData = json_decode(file_get_contents($cacheFile), true);
        if ($newsData && isset($newsData['data'])) {
            $allNews = $newsData['data'];
            
            // Simple scoring based on keywords
            foreach ($allNews as &$news) {
                $score = 0;
                $textToSearch = mb_strtolower($news['title'] . ' ' . $news['snippet'], 'UTF-8');
                foreach ($topKeywords as $kw) {
                    if (strpos($textToSearch, $kw) !== false) {
                        $score += 2;
                    }
                }
                $news['ai_score'] = $score;
            }
            
            // Sort by score
            usort($allNews, function($a, $b) {
                return $b['ai_score'] <=> $a['ai_score'];
            });
            
            // Take top 4 recommended
            $recommendedNews = array_slice($allNews, 0, 4);
        }
    }

    // 3. Thu thập xu hướng từ Mạng xã hội và các nền tảng khác
    $socialTrends = [
        'facebook' => ['nhà giá rẻ ven đô', 'vay vốn mua nhà', 'lãi suất ngân hàng giảm'], // Mock (khó cào real-time)
        'tiktok' => ['review chung cư', 'cách mua nhà trước 30 tuổi', 'vinhomes ocean park'] // Mock (khó cào real-time)
    ];

    // Lấy dữ liệu thật từ cronjob cache
    $socialCacheFile = sys_get_temp_dir() . '/smartre_social_trends.json';
    if (file_exists($socialCacheFile)) {
        $realTrends = json_decode(file_get_contents($socialCacheFile), true);
        if ($realTrends) {
            if (!empty($realTrends['reddit'])) $socialTrends['reddit'] = array_slice($realTrends['reddit'], 0, 5);
            if (!empty($realTrends['google'])) $socialTrends['google'] = array_slice($realTrends['google'], 0, 5);
            if (!empty($realTrends['google_news'])) $socialTrends['google_news'] = array_slice($realTrends['google_news'], 0, 5);
        }
    }

    jsonResponse(200, [
        'status' => 'success',
        'data' => [
            'top_keywords' => $topKeywords,
            'recommended_news' => $recommendedNews,
            'social_trends' => $socialTrends
        ]
    ]);
    
} catch (Exception $e) {
    jsonResponse(500, ['error' => 'AI Recommendation failed: ' . $e->getMessage()]);
}
