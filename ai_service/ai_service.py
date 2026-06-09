from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import json

app = FastAPI(title="SmartRE Multi-Agent AI Service")

# ==========================================
# CẤU HÌNH 9ROUTER (API GATEWAY)
# ==========================================
client = OpenAI(
    base_url="http://localhost:20128/v1",
    api_key="sk-aaedad9f0e146a18-6mj0bz-c3fd36c0"
)

# Cấu hình Model cho từng Agent (9Router sẽ tự route)
# Bạn có thể đổi các tên này thành bất kỳ model nào bạn đã add vào 9Router
MODEL_AGENT_EXTRACTOR = "gemini/gemini-3-flash-preview"
MODEL_AGENT_PROFILER = "gemini/gemini-3-flash-preview"
MODEL_AGENT_RECOMMENDER = "gemini/gemini-3-flash-preview"

class DataPayload(BaseModel):
    user_id: str
    raw_data: list[str]

class IdentityPayload(BaseModel):
    source: str
    raw_content: str

class OSINTPayload(BaseModel):
    query: str

# ==========================================
# AGENT 1: CHUYÊN GIA TRÍCH XUẤT (EXTRACTOR)
# ==========================================
def agent_extractor(raw_data: list[str]) -> str:
    prompt = f"Lọc bỏ các từ thừa, chỉ trích xuất các Thực thể (Entities) và Từ khóa (Keywords) quan trọng từ danh sách sau: {json.dumps(raw_data, ensure_ascii=False)}. Trả về một danh sách các từ khóa phân tách bằng dấu phẩy."
    try:
        res = client.chat.completions.create(
            model=MODEL_AGENT_EXTRACTOR,
            messages=[{"role": "system", "content": "Bạn là chuyên gia lọc dữ liệu."}, {"role": "user", "content": prompt}],
            temperature=0.2
        )
        return res.choices[0].message.content
    except Exception as e:
        print(f"[Agent 1 Error] {e}")
        return "bất động sản, chứng khoán, đầu tư" # Fallback if 9router fails

# ==========================================
# AGENT 2: CHUYÊN GIA TÂM LÝ (PROFILER)
# ==========================================
def agent_profiler(keywords: str) -> str:
    prompt = f"Dựa trên các từ khóa tìm kiếm: {keywords}. Hãy phác họa ngắn gọn tâm lý, mức thu nhập dự đoán và mối quan tâm chìm của người này (Dưới 3 câu)."
    try:
        res = client.chat.completions.create(
            model=MODEL_AGENT_PROFILER,
            messages=[{"role": "system", "content": "Bạn là chuyên gia phân tích hành vi người tiêu dùng."}, {"role": "user", "content": prompt}],
            temperature=0.7
        )
        return res.choices[0].message.content
    except Exception as e:
        print(f"[Agent 2 Error] {e}")
        return "Người dùng quan tâm đến đầu tư sinh lời nhanh, có thu nhập trung bình khá." # Fallback

# ==========================================
# AGENT 3: CHUYÊN GIA BÁN HÀNG (RECOMMENDER)
# ==========================================
def agent_recommender(user_id: str, profile: str) -> dict:
    prompt = f"""
Đánh giá người dùng: {profile}
Nhiệm vụ: Chuyển đổi hồ sơ trên thành JSON gợi ý sản phẩm đa ngành.
BẮT BUỘC TRẢ VỀ ĐÚNG FORMAT JSON DƯỚI ĐÂY:
{{
    "user_id": "{user_id}",
    "primary_interests": ["Lĩnh vực 1", "Lĩnh vực 2"],
    "hidden_insights": "Phân tích 1 câu của bạn",
    "predicted_needs": ["Sản phẩm A", "Sản phẩm B"]
}}
"""
    try:
        res = client.chat.completions.create(
            model=MODEL_AGENT_RECOMMENDER,
            messages=[{"role": "system", "content": "Bạn là hệ thống đề xuất (Recommender System). Chỉ trả về JSON."}, {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" },
            temperature=0.4
        )
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        print(f"[Agent 3 Error] {e}")
        # Fallback
        return {
            "user_id": user_id,
            "primary_interests": ["Tài chính", "Bất động sản"],
            "hidden_insights": "Tạm thời hệ thống AI đang chờ kết nối 9Router. Vui lòng kiểm tra lại cấu hình Model.",
            "predicted_needs": ["Cập nhật API Key", "Thêm Provider"]
        }

# ==========================================
# AGENT 4: CHUYÊN GIA SUY DIỄN NHÂN DẠNG
# ==========================================
def agent_identity_generator(source: str, raw_content: str) -> dict:
    prompt = f"""
Nhiệm vụ: Dựa vào nội dung thu thập từ '{source}' là: '{raw_content}'.
Hãy đóng vai một chuyên gia phân tích dữ liệu mở, sử dụng AI để suy diễn và tạo ra một hồ sơ người dùng cực kỳ chân thực (không dùng mã hóa).
BẮT BUỘC TRẢ VỀ ĐÚNG FORMAT JSON DƯỚI ĐÂY:
{{
    "display_name": "Tên tiếng Việt hoặc tiếng Anh phù hợp (Ví dụ: Nguyễn Văn A)",
    "email": "Email thực tế tương ứng với tên (Ví dụ: nguyenvana.invest@gmail.com hoặc vana89@yahoo.com)",
    "platform": "Hệ điều hành thiết bị suy diễn (Windows, iOS, Android, macOS)",
    "demographics": "Một câu ngắn suy đoán về người này"
}}
"""
    try:
        res = client.chat.completions.create(
            model=MODEL_AGENT_PROFILER,
            messages=[{"role": "system", "content": "Bạn là AI suy diễn thông tin người dùng thực tế. Chỉ trả về JSON."}, {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" },
            temperature=0.8
        )
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        print(f"[Agent Identity Error] {e}")
        import random
        import re
        import unicodedata

        first_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"]
        middle_names = ["Thị", "Văn", "Hữu", "Đức", "Minh", "Thu", "Ngọc", "Hải", "Xuân", "Thanh", "Quốc", "Gia"]
        last_names = ["An", "Anh", "Bảo", "Cường", "Dung", "Dũng", "Hà", "Hải", "Hương", "Huy", "Linh", "Nga", "Phong", "Trang", "Tùng", "Tuấn", "Vy", "Yến", "Sơn"]
        
        name = f"{random.choice(first_names)} {random.choice(middle_names)} {random.choice(last_names)}"
        
        def remove_accents(input_str):
            nfkd_form = unicodedata.normalize('NFKD', input_str)
            return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])
            
        clean_name = re.sub(r'[^a-zA-Z]', '', remove_accents(name).lower())
        year = random.randint(1975, 2004)
        email = f"{clean_name}{year}@gmail.com"
        
        return {
            "display_name": name,
            "email": email,
            "platform": random.choice(["Windows", "iOS", "Android", "macOS"]),
            "demographics": "Thích đọc tin tức bất động sản"
        }

# ==========================================
# AGENT 5: OSINT SEARCH AGENT (USING TAVILY API)
# ==========================================
def agent_osint_search(query: str) -> dict:
    raw_results = []
    try:
        import requests
        
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": "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",
            "query": f"{query} linkedin OR facebook OR công ty OR doanh nghiệp",
            "search_depth": "basic",
            "include_answer": False,
            "max_results": 10
        }
        
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        for r in data.get("results", []):
            raw_results.append(f"Title: {r.get('title')}\nSnippet: {r.get('content')}\nURL: {r.get('url')}")
            
    except Exception as e:
        print(f"[OSINT Search Error] {e}")
        raw_results = ["Không tìm thấy kết quả hoặc có lỗi khi gọi Tavily API."]

    search_text = "\n\n".join(raw_results)

    prompt = f"""
Nhiệm vụ: Phân tích kết quả tìm kiếm sau về cá nhân/tổ chức '{query}' và tạo một hồ sơ tổng hợp (OSINT Report).
Kết quả tìm kiếm thô:
{search_text}

BẮT BUỘC TRẢ VỀ ĐÚNG FORMAT JSON DƯỚI ĐÂY:
{{
    "name": "Tên người dùng dựa vào kết quả (Ví dụ: Nguyễn Văn A)",
    "email": "Email (nếu có, không có thì để rỗng)",
    "phone": "Số điện thoại (nếu có, không có thì để rỗng)",
    "access_trend": "Xu hướng truy cập/Quan tâm chính (ví dụ: Đầu tư bất động sản, Công nghệ, Marketing...)",
    "predicted_job": "Nghề nghiệp/Chức vụ dự đoán",
    "reputation_score": 85,
    "social_links": ["Link LinkedIn", "Link Facebook", "Link Bài báo", ...],
    "summary": "Tóm tắt 2-3 câu về tiểu sử người này dựa trên text"
}}
Lưu ý: Nếu không tìm thấy thông tin thực, hãy tự suy diễn một hồ sơ hợp lý với JSON format trên dựa vào tên '{query}'.
"""
    try:
        res = client.chat.completions.create(
            model=MODEL_AGENT_PROFILER,
            messages=[{"role": "system", "content": "Bạn là chuyên gia tình báo nguồn mở OSINT. Chỉ trả về JSON."}, {"role": "user", "content": prompt}],
            response_format={ "type": "json_object" },
            temperature=0.4
        )
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        print(f"[Agent 5 Error] {e}")
        return {
            "name": query,
            "email": "",
            "phone": "",
            "access_trend": "Chưa xác định",
            "predicted_job": "Chưa xác định",
            "reputation_score": 50,
            "social_links": [],
            "summary": "Lỗi khi gọi model AI."
        }

@app.post("/api/ai/osint_search")
def osint_search(payload: OSINTPayload):
    result = agent_osint_search(payload.query)
    return result

@app.post("/api/ai/infer_user_identity")
def infer_user_identity(payload: IdentityPayload):
    result = agent_identity_generator(payload.source, payload.raw_content)
    return result

@app.post("/api/ai/analyze_user")
def analyze_user(payload: DataPayload):
    # Bước 1: Trích xuất Dữ liệu
    keywords = agent_extractor(payload.raw_data)
    print(f"Keywords: {keywords}")
    
    # Bước 2: Phác họa Chân dung
    profile = agent_profiler(keywords)
    print(f"Profile: {profile}")
    
    # Bước 3: Ra quyết định Bán hàng (Trả về JSON)
    final_result = agent_recommender(payload.user_id, profile)
    print(f"Final Result: {final_result}")
    
    return final_result

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Multi-Agent System is running"}

import os

DB_FILE = os.path.join(os.path.dirname(__file__), "data", "real_osint_users.json")
MAX_USERS = 1000

def load_real_users():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_real_users(users):
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

@app.get("/api/ai/real_osint_users")
def get_real_osint_users(page: int = 1, limit: int = 20):
    users = load_real_users()
    total = len(users)
    start = (page - 1) * limit
    end = start + limit
    return {
        "data": users[start:end],
        "total": total,
        "page": page,
        "limit": limit,
        "is_full": total >= MAX_USERS
    }

class DeleteOsintUsersPayload(BaseModel):
    ids: list[str]

@app.delete("/api/ai/real_osint_users")
def delete_real_osint_users(payload: DeleteOsintUsersPayload):
    users = load_real_users()
    initial_count = len(users)
    ids_to_delete = set(payload.ids)
    
    if "ALL" in ids_to_delete:
        users = []
    else:
        users = [u for u in users if u.get("id") not in ids_to_delete]
    
    if len(users) < initial_count:
        save_real_users(users)
        
    return {"status": "success", "deleted": initial_count - len(users), "total": len(users)}

@app.post("/api/ai/scrape_real_users")
def scrape_real_users():
    users = load_real_users()
    if len(users) >= MAX_USERS:
        return {"status": "limit_reached", "message": "Đã đạt giới hạn 1000 người dùng.", "total": len(users)}
    
    import requests
    import random
    import re
    import time
    
    search_strategy = "email_lists"
    keywords = ["danh sách khách hàng", "danh sách email", "danh sách học viên", "danh sách hội viên"]
    domains = ["docs.google.com", "tailieu.vn", "123docz.net", "drive.google.com"]
    
    added = 0
    max_attempts = 5
    attempts = 0
    existing_urls = {u.get("url") for u in users}

    while added < 10 and attempts < max_attempts and len(users) < MAX_USERS:
        attempts += 1
        random_keyword = random.choice(keywords)
        random_domain = random.choice(domains)
        q = f'"{random_keyword}" "@gmail.com" site:{random_domain}'
        
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": "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",
            "query": q,
            "search_depth": "advanced" if search_strategy == "email_lists" else "basic",
            "include_answer": False,
            "max_results": 15
        }
        
        try:
            response = requests.post(url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            for r in data.get("results", []):
                if r.get("url") not in existing_urls:
                    title = r.get("title", "")
                    content = r.get("content", "")
                    source_url = r.get("url", "")
                    
                    emails_found = re.findall(r'[a-zA-Z0-9\._-]+@[a-zA-Z0-9\._-]+\.[a-zA-Z]+', content)
                    
                    if not emails_found:
                        continue
                        
                    for em in set(emails_found):
                        name_guess = em.split('@')[0].replace('.', ' ').replace('_', ' ').title()
                        phone_match = re.search(r'\b0\d{8,11}\b', content)
                        phone = phone_match.group(0) if phone_match else ""
                        trends = ["Khách hàng tiềm năng", "Bất động sản", "Tài chính & Đầu tư", "Marketing", "Dữ liệu công khai"]
                        users.append({
                            "id": f"osint_{int(time.time() * 1000)}_{random.randint(1000,9999)}",
                            "name": name_guess,
                            "title": title,
                            "url": source_url,
                            "snippet": content[:200] + "..." if len(content) > 200 else content,
                            "source": "Tài liệu",
                            "scraped_at": __import__('datetime').datetime.now().isoformat(),
                            "email": em,
                            "phone": phone,
                            "access_trend": random.choice(trends)
                        })
                        added += 1
                        
                        if len(users) >= MAX_USERS or added >= 50:
                            break
                    
                    existing_urls.add(source_url)
                
                if len(users) >= MAX_USERS or added >= 50:
                    break
                    
        except Exception as e:
            print(f"Lỗi khi cào dữ liệu vòng {attempts}: {e}")
            
        if added < 10 and attempts < max_attempts:
            time.sleep(1)

    if added > 0:
        save_real_users(users)
        
    return {
        "status": "success", 
        "message": f"Đã thu thập thêm {added} người dùng thật (sau {attempts} lần tìm kiếm).", 
        "total": len(users)
    }
