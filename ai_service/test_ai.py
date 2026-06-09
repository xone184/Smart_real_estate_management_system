import requests

url = "http://localhost:5000/api/ai/analyze_user"
data = {
    "user_id": "u123",
    "raw_data": ["Mua đất nền vùng ven", "Giá vàng hôm nay", "Cách chống bức xạ máy tính"]
}

response = requests.post(url, json=data)
print(response.json())
