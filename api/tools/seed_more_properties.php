<?php
// =============================================
// SmartRE - Seed thêm bất động sản
// Run: http://localhost/smart-real-estate-management-system/api/tools/seed_more_properties.php
// =============================================

header('Content-Type: application/json; charset=utf-8');

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'smartre_db');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Lấy danh sách owner_id hợp lệ
    $owners = $pdo->query("SELECT id, role FROM users ORDER BY id")->fetchAll();
    $adminId  = 1;
    $userId   = 2;
    $agentId  = 3;

    $propStmt = $pdo->prepare("
        INSERT INTO properties
            (title, description, type, price, area, bedrooms, bathrooms, direction, legal, address,
             location_lat, location_lng, images, owner_id, status, ai_valuation, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    ");

    $properties = [

        /* ─── HÀ NỘI ─── */
        [
            'Căn hộ Vinhomes Smart City Tây Mỗ',
            'Căn hộ 3 phòng ngủ view hồ đẹp, nội thất cao cấp, tiện ích đẳng cấp 5 sao. Gần trường học quốc tế, bệnh viện.',
            'apartment', 4500, 85, 3, 2, 'Đông Nam', 'pink_book',
            'Tây Mỗ, Nam Từ Liêm, Hà Nội', 21.013, 105.742,
            '["https://picsum.photos/seed/hn_apt1/800/600","https://picsum.photos/seed/hn_apt2/800/600"]',
            $agentId, 4480,
            '["vinhomes","tay_mo","view_ho","noi_that_cao_cap"]'
        ],
        [
            'Nhà riêng ngõ ô tô Trung Hòa - Nhân Chính',
            'Nhà 4 tầng xây mới 2023, ngõ thông ô tô đỗ cửa, cách phố Trung Hòa 50m. Hướng Nam đón gió thoáng mát.',
            'house', 8900, 52, 4, 4, 'Nam', 'pink_book',
            '28 Ngõ 16 Trung Hòa, Cầu Giấy, Hà Nội', 21.014, 105.795,
            '["https://picsum.photos/seed/hn_house1/800/600","https://picsum.photos/seed/hn_house2/800/600"]',
            $agentId, 8750,
            '["o_to_cua","xay_moi","cau_giay"]'
        ],
        [
            'Đất nền biệt thự Ecopark Văn Giang',
            'Lô góc 2 mặt tiền, vị trí đẹp nhất phân khu Aqua Bay. Diện tích 200m², sổ đỏ lâu dài.',
            'land', 15000, 200, 0, 0, 'Bắc', 'red_book',
            'Ecopark, Văn Giang, Hưng Yên', 20.951, 105.923,
            '["https://picsum.photos/seed/hn_land1/800/600"]',
            $adminId, 14800,
            '["lo_goc","ecopark","van_giang","so_do"]'
        ],
        [
            'Biệt thự song lập Gamuda Gardens',
            'Biệt thự song lập 3 tầng, 250m², hồ bơi riêng, sân vườn thiết kế theo phong cách nhiệt đới. An ninh 24/7.',
            'villa', 28000, 250, 5, 5, 'Tây Nam', 'pink_book',
            'Gamuda Gardens, Hoàng Mai, Hà Nội', 20.972, 105.842,
            '["https://picsum.photos/seed/hn_villa1/800/600","https://picsum.photos/seed/hn_villa2/800/600"]',
            $adminId, 27500,
            '["song_lap","gamuda","ho_boi","hoang_mai"]'
        ],
        [
            'Chung cư The Zei Mỹ Đình - 2PN full nội thất',
            'Căn hộ 2 phòng ngủ 68m², ban công thoáng, ban giao full nội thất thương hiệu Châu Âu. Gần Keangnam, Big C.',
            'apartment', 4100, 68, 2, 2, 'Bắc', 'pink_book',
            '8 Lê Đức Thọ, Mỹ Đình, Nam Từ Liêm, Hà Nội', 21.027, 105.775,
            '["https://picsum.photos/seed/zei1/800/600","https://picsum.photos/seed/zei2/800/600"]',
            $agentId, 4050,
            '["the_zei","my_dinh","full_noi_that","2pn"]'
        ],
        [
            'Shophouse mặt phố Kim Mã',
            'Shophouse 5 tầng mặt phố Kim Mã, lô góc 2 mặt tiền, thích hợp văn phòng – kinh doanh – cho thuê.',
            'house', 52000, 95, 0, 0, 'Đông', 'pink_book',
            '127 Kim Mã, Ba Đình, Hà Nội', 21.033, 105.826,
            '["https://picsum.photos/seed/kimma1/800/600"]',
            $agentId, 51000,
            '["shophouse","kim_ma","mat_pho","ba_dinh","kinh_doanh"]'
        ],

        /* ─── TP.HCM ─── */
        [
            'Penthouse The Marq Quận 1 - 360° Panorama',
            'Penthouse tầng 38, 320m², 4 phòng ngủ, view 360° toàn cảnh TP.HCM. Thiết kế bởi kiến trúc sư Singapore.',
            'apartment', 85000, 320, 4, 5, 'Đông Nam', 'pink_book',
            '11D Hồng Hà, Phường 2, Tân Bình, TP.HCM', 10.813, 106.686,
            '["https://picsum.photos/seed/penthouse1/800/600","https://picsum.photos/seed/penthouse2/800/600"]',
            $adminId, 83000,
            '["penthouse","view_toan_canh","the_marq","hang_s"]'
        ],
        [
            'Căn hộ Masteri Thảo Điền 1PN Studio',
            'Studio 45m² thiết kế thông minh, view sông Sài Gòn, full nội thất cao cấp, thích hợp đầu tư cho thuê.',
            'apartment', 3200, 45, 1, 1, 'Tây', 'pink_book',
            'Masteri Thảo Điền, Quận 2, TP.HCM', 10.807, 106.741,
            '["https://picsum.photos/seed/masteri1/800/600","https://picsum.photos/seed/masteri2/800/600"]',
            $agentId, 3150,
            '["masteri","studio","view_song","thao_dien","dau_tu"]'
        ],
        [
            'Nhà phố liền kề Akari City Bình Tân',
            'Nhà phố liền kề 1 trệt 3 lầu, DT 5x17m, sân vườn trước sau, mặt tiền đường 30m trong khu compound an ninh.',
            'house', 12500, 85, 4, 3, 'Tây Nam', 'pink_book',
            'Akari City, Bình Tân, TP.HCM', 10.741, 106.613,
            '["https://picsum.photos/seed/akari1/800/600","https://picsum.photos/seed/akari2/800/600"]',
            $agentId, 12200,
            '["akari","lien_ke","binh_tan","san_vuon"]'
        ],
        [
            'Đất nền mặt tiền Quốc lộ 50 - Long An',
            'Đất mặt tiền 25m, DT 500m², phù hợp làm kho bãi, xưởng nhỏ hoặc nhà hàng. Đường 6 làn xe.',
            'land', 6800, 500, 0, 0, 'Tây', 'red_book',
            'Quốc lộ 50, Bình Chánh, TP.HCM', 10.676, 106.583,
            '["https://picsum.photos/seed/ql50_1/800/600"]',
            $adminId, 6700,
            '["mat_tien_ql","kho_bai","binh_chanh","dau_tu"]'
        ],
        [
            'Biệt thự compound Saigon Mystery Villas',
            'Biệt thự đơn lập 400m², hồ bơi infinity, gym riêng, sân tennis. Phong cách Địa Trung Hải sang trọng.',
            'villa', 95000, 400, 6, 6, 'Đông', 'pink_book',
            'Thảo Điền, TP. Thủ Đức, TP.HCM', 10.812, 106.745,
            '["https://picsum.photos/seed/mystery1/800/600","https://picsum.photos/seed/mystery2/800/600"]',
            $adminId, 94000,
            '["mystery_villas","ho_boi_infinity","dia_trung_hai","thu_duc"]'
        ],
        [
            'Căn hộ Sunrise City View Quận 7',
            'Căn hộ 2PN 80m², tầng 20, view Phú Mỹ Hưng, nội thất đầy đủ. Cộng đồng cư dân văn minh.',
            'apartment', 6300, 80, 2, 2, 'Nam', 'pink_book',
            'Sunrise City View, Quận 7, TP.HCM', 10.728, 106.713,
            '["https://picsum.photos/seed/sunrise1/800/600","https://picsum.photos/seed/sunrise2/800/600"]',
            $agentId, 6200,
            '["sunrise","view_phu_my_hung","quan_7","2pn"]'
        ],

        /* ─── ĐÀ NẴNG ─── */
        [
            'Căn hộ biển Mỹ Khê - Soleil Đà Nẵng',
            'Căn hộ 2PN mặt biển Mỹ Khê, tầng 15, view biển trực tiếp, đủ nội thất 5 sao, cam kết lợi nhuận 10%/năm.',
            'apartment', 5800, 72, 2, 2, 'Đông', 'pink_book',
            'Mỹ Khê, Sơn Trà, Đà Nẵng', 16.065, 108.245,
            '["https://picsum.photos/seed/dn_beach1/800/600","https://picsum.photos/seed/dn_beach2/800/600"]',
            $agentId, 5700,
            '["mat_bien","my_khe","cam_ket_loi_nhuan","da_nang"]'
        ],
        [
            'Nhà phố 3 tầng đường Nguyễn Văn Linh Đà Nẵng',
            'Nhà 3 tầng xây mới, mặt tiền 6m, hướng Đông, khu dân cư an ninh Ngũ Hành Sơn.',
            'house', 7500, 110, 5, 4, 'Đông', 'pink_book',
            '56 Nguyễn Văn Linh, Ngũ Hành Sơn, Đà Nẵng', 16.022, 108.239,
            '["https://picsum.photos/seed/dn_house1/800/600"]',
            $agentId, 7400,
            '["mat_tien","ngu_hanh_son","da_nang","xay_moi"]'
        ],
        [
            'Đất nền Nam Hoa - Ngũ Hành Sơn',
            'Lô 100m² đất ở đô thị, hướng Tây, gần biển Mỹ Khê 500m, sổ đỏ chính chủ, không quy hoạch.',
            'land', 4200, 100, 0, 0, 'Tây', 'red_book',
            'Nam Hoa, Ngũ Hành Sơn, Đà Nẵng', 16.031, 108.237,
            '["https://picsum.photos/seed/dn_land1/800/600"]',
            $adminId, 4100,
            '["gan_bien","so_do","ngu_hanh_son","da_nang"]'
        ],
        [
            'Biệt thự nghỉ dưỡng InterContinental Sun Peninsula',
            'Biệt thự 5* view biển Bán đảo Sơn Trà, thiết kế bởi Bill Bensley, cam kết thuê lại 65% doanh thu.',
            'villa', 68000, 350, 5, 5, 'Đông', 'pink_book',
            'Bán đảo Sơn Trà, Đà Nẵng', 16.103, 108.286,
            '["https://picsum.photos/seed/dn_villa1/800/600","https://picsum.photos/seed/dn_villa2/800/600"]',
            $adminId, 67000,
            '["5_sao","son_tra","view_bien","cam_ket_thue_lai"]'
        ],

        /* ─── NHA TRANG ─── */
        [
            'Căn hộ Goldengate Nha Trang - Rooftop Pool',
            'Căn hộ 2PN 65m², bể bơi vô cực tầng thượng, view vịnh Nha Trang thơ mộng. Cho thuê ngắn hạn tốt.',
            'apartment', 3500, 65, 2, 2, 'Đông', 'pink_book',
            'Trần Phú, Nha Trang, Khánh Hòa', 12.239, 109.194,
            '["https://picsum.photos/seed/nt_apt1/800/600","https://picsum.photos/seed/nt_apt2/800/600"]',
            $agentId, 3400,
            '["rooftop_pool","vinh_nha_trang","cho_thue_ngan_han","khanh_hoa"]'
        ],
        [
            'Đất biệt thự Vinpearl Golf Land Nha Trang',
            'Lô giới hạn trong khu Vinpearl Golf Land, 250m², view sân golf và biển, tiềm năng đầu tư cao.',
            'land', 12000, 250, 0, 0, 'Nam', 'pink_book',
            'Phước Đồng, Nha Trang, Khánh Hòa', 12.196, 109.152,
            '["https://picsum.photos/seed/nt_land1/800/600"]',
            $adminId, 11800,
            '["vinpearl","san_golf","view_bien","nha_trang"]'
        ],

        /* ─── PHÚ QUỐC ─── */
        [
            'Villa biển Phú Quốc - Premier Village',
            'Villa 3PN 300m² mặt biển Bãi Kem, hồ bơi vô cực trực tiếp ra biển, pháp lý 50 năm gia hạn.',
            'villa', 55000, 300, 3, 4, 'Đông', 'pink_book',
            'Bãi Kem, An Thới, Phú Quốc, Kiên Giang', 10.084, 104.008,
            '["https://picsum.photos/seed/pq_villa1/800/600","https://picsum.photos/seed/pq_villa2/800/600"]',
            $adminId, 54000,
            '["mat_bien","bai_kem","ho_boi","phu_quoc","premier_village"]'
        ],
        [
            'Shophouse Phú Quốc United Center',
            'Shophouse 2 tầng 120m², mặt tiền đường nội khu lớn, kinh doanh sầm uất, cam kết lợi nhuận 8%/năm.',
            'house', 18000, 120, 0, 0, 'Tây', 'pink_book',
            'Phú Quốc United Center, Kiên Giang', 10.201, 103.973,
            '["https://picsum.photos/seed/pq_shop1/800/600"]',
            $agentId, 17800,
            '["shophouse","phu_quoc_united","kinh_doanh","cam_ket_loi_nhuan"]'
        ],

        /* ─── HỘI AN ─── */
        [
            'Nhà phố cổ Hội An - Kinh doanh homestay',
            'Nhà 2 tầng 180m² kiến trúc cổ Hội An, 6 phòng suite đang cho thuê homestay 90% công suất.',
            'house', 22000, 180, 6, 6, 'Nam', 'pink_book',
            'Phường Minh An, Hội An, Quảng Nam', 15.877, 108.327,
            '["https://picsum.photos/seed/hoian1/800/600","https://picsum.photos/seed/hoian2/800/600"]',
            $agentId, 21500,
            '["nha_co","hoi_an","homestay","kinh_doanh","90_cong_suat"]'
        ],
        [
            'Đất nền Điện Bàn - Gần Hội An 2km',
            'Đất thổ cư 150m², mặt tiền 8m, cách phố cổ Hội An 2km, hạ tầng điện nước hoàn chỉnh.',
            'land', 2800, 150, 0, 0, 'Tây Nam', 'red_book',
            'Điện Bàn, Quảng Nam', 15.880, 108.294,
            '["https://picsum.photos/seed/hoian_land1/800/600"]',
            $agentId, 2750,
            '["gan_hoi_an","dien_ban","tho_cu","mat_tien_8m"]'
        ],

        /* ─── CẦN THƠ ─── */
        [
            'Căn hộ Saigon Central Cần Thơ - View Sông Hậu',
            'Căn hộ 2PN 75m² view sông Hậu, tầng 18, nội thất cơ bản, pháp lý sổ hồng riêng.',
            'apartment', 2800, 75, 2, 2, 'Tây', 'pink_book',
            'Ninh Kiều, Cần Thơ', 10.036, 105.788,
            '["https://picsum.photos/seed/cantho1/800/600","https://picsum.photos/seed/cantho2/800/600"]',
            $agentId, 2750,
            '["view_song_hau","ninh_kieu","can_tho","so_hong"]'
        ],
        [
            'Biệt thự vườn miền Tây Cần Thơ',
            'Biệt thự 4 tầng 600m² sân vườn, vườn cây ăn trái, ao cá, nhà hàng ẩm thực miền Tây đang hoạt động.',
            'villa', 18500, 600, 8, 6, 'Nam', 'pink_book',
            'Cái Răng, Cần Thơ', 10.002, 105.789,
            '["https://picsum.photos/seed/cantho_villa1/800/600","https://picsum.photos/seed/cantho_villa2/800/600"]',
            $adminId, 18000,
            '["vuon_mien_tay","nha_hang","ao_ca","cai_rang","can_tho"]'
        ],

        /* ─── BÌNH DƯƠNG / ĐỒNG NAI ─── */
        [
            'Căn hộ Bcons Miền Đông Bình Dương',
            'Căn hộ 1PN 55m² thích hợp đầu tư cho thuê công nhân - chuyên gia KCN VSIP 2. Lợi nhuận 7-8%/năm.',
            'apartment', 1350, 55, 1, 1, 'Bắc', 'pink_book',
            'Dĩ An, Bình Dương', 10.894, 106.771,
            '["https://picsum.photos/seed/bd_apt1/800/600"]',
            $agentId, 1320,
            '["bcons","di_an","binh_duong","kcn_vsip","dau_tu_cho_thue"]'
        ],
        [
            'Đất KCN Long Thành - Đồng Nai (1000m²)',
            'Đất công nghiệp 1000m², gần KCN Long Thành – Nhơn Trạch, tiếp giáp đường ĐT769, sổ đỏ.',
            'land', 5500, 1000, 0, 0, 'Đông', 'red_book',
            'Long Thành, Đồng Nai', 10.826, 107.012,
            '["https://picsum.photos/seed/dn_land2/800/600"]',
            $adminId, 5400,
            '["dat_cong_nghiep","kcn_long_thanh","dong_nai","so_do","1000m2"]'
        ],

        /* ─── VÂN ĐỒN / HẠ LONG ─── */
        [
            'Condotel Wyndham Sky Lake Vân Đồn',
            'Condotel tầng 25 view Vịnh Hạ Long, 50m², hoàn thiện nội thất 5*, cam kết thuê 8%/năm 10 năm.',
            'apartment', 2200, 50, 1, 1, 'Đông', 'pink_book',
            'Vân Đồn, Quảng Ninh', 21.013, 107.469,
            '["https://picsum.photos/seed/vd_condo1/800/600","https://picsum.photos/seed/vd_condo2/800/600"]',
            $agentId, 2150,
            '["condotel","wyndham","vinh_ha_long","cam_ket_thue_lai","5_sao"]'
        ],
        [
            'Đất nền nghỉ dưỡng Cô Tô - Quảng Ninh',
            'Đất 300m² ven biển đảo Cô Tô, phong trào du lịch nở rộ, tiềm năng phát triển resort mini.',
            'land', 3800, 300, 0, 0, 'Đông', 'other',
            'Cô Tô, Quảng Ninh', 20.992, 107.773,
            '["https://picsum.photos/seed/coto1/800/600"]',
            $adminId, 3700,
            '["co_to","bien_dao","resort_mini","quang_ninh","tiem_nang"]'
        ],
    ];

    $inserted = 0;
    foreach ($properties as $p) {
        $propStmt->execute([
            $p[0],  // title
            $p[1],  // description
            $p[2],  // type
            $p[3],  // price (triệu VNĐ)
            $p[4],  // area
            $p[5],  // bedrooms
            $p[6],  // bathrooms
            $p[7],  // direction
            $p[8],  // legal
            $p[9],  // address
            $p[10], // lat
            $p[11], // lng
            $p[12], // images JSON
            $p[13], // owner_id
            $p[14], // ai_valuation
            $p[15], // tags JSON
        ]);
        $inserted++;
    }

    // Seed thêm reviews cho các property mới
    $lastId = (int)$pdo->lastInsertId();
    $firstNewId = $lastId - $inserted + 1;

    $reviewStmt = $pdo->prepare("
        INSERT INTO reviews (property_id, user_id, user_name, rating, comment, likes, verified)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    ");

    $comments = [
        [5, 'Rất đáng mua, vị trí tiện lợi, giá hợp lý!'],
        [5, 'Nội thất cao cấp, dịch vụ chuyên nghiệp, tôi rất hài lòng.'],
        [4, 'Tiện ích xung quanh đầy đủ, giá tốt trong tầm giá này.'],
        [4, 'Pháp lý rõ ràng, đội ngũ tư vấn nhiệt tình.'],
        [3, 'Vị trí ổn nhưng hạ tầng xung quanh cần thêm thời gian phát triển.'],
    ];

    for ($i = $firstNewId; $i <= $lastId; $i++) {
        $c = $comments[$i % count($comments)];
        $uid = ($i % 2 === 0) ? $userId : $agentId;
        $name = ($uid === $userId) ? 'Nguyễn Văn Demo' : 'Trần Thị Agent';
        $reviewStmt->execute([$i, $uid, $name, $c[0], $c[1], rand(1, 15)]);
    }

    echo json_encode([
        'success'  => true,
        'message'  => "Đã thêm thành công $inserted bất động sản mới!",
        'inserted' => $inserted,
        'id_range' => "$firstNewId – $lastId",
        'regions'  => ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Hội An', 'Cần Thơ', 'Bình Dương / Đồng Nai', 'Vân Đồn / Hạ Long'],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
