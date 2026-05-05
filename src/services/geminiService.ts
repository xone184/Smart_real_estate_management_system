// API key được đọc từ biến môi trường - KHÔNG hardcode ở đây
// Tạo file .env và thêm: VITE_GROQ_API_KEY=your_key_here
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';


export async function generatePropertyDescription(title: string, type: string, area: number, price: number, address: string) {
  const prompt = `Bạn là một chuyên gia môi giới bất động sản chuyên nghiệp tại Việt Nam. 
  Hãy viết một mô tả hấp dẫn, chuyên nghiệp và đầy đủ thông tin cho bất động sản sau:
  Tiêu đề: ${title}
  Loại: ${type}
  Diện tích: ${area}m2
  Giá: ${price} triệu VNĐ
  Địa chỉ: ${address}
  
  Yêu cầu:
  1. Mô tả chi tiết các ưu điểm về vị trí, tiện ích, pháp lý.
  2. Sử dụng ngôn ngữ thu hút người mua.
  3. Định dạng Markdown.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating description:", error);
    return "Không thể tạo mô tả tự động lúc này do lỗi kết nối AI.";
  }
}

export async function estimatePropertyPrice(type: string, area: number, address: string, bedrooms: number) {
  const prompt = `Dựa trên dữ liệu thị trường bất động sản Việt Nam năm 2024-2025, hãy ước tính giá cho bất động sản sau:
  Loại: ${type}
  Diện tích: ${area}m2
  Địa chỉ: ${address}
  Số phòng ngủ: ${bedrooms}
  
  Hãy trả về kết quả dưới dạng JSON (Chỉ JSON, không MD codeblocks, không thêm chữ giải thích ngoài JSON) với định dạng CHÍNH XÁC NHƯ SAU:
  {"estimatedPrice": <số kiểu number, ví dụ 1500>, "confidence": <số từ 0-1, ví dụ 0.85>, "reasoning": "<chuỗi lý do ngắn gọn>"}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Error estimating price:", error);
    return null;
  }
}

export async function chatWithAI(message: string, history: {role: string, content: string}[] = [], context?: string) {
  
  const formattedHistory = history.map(h => ({
    role: h.role,
    content: h.content
  }));

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Bạn là trợ lý ảo thông minh của hệ thống Quản lý Bất động sản SmartRE.\nBạn có kiến thức sâu rộng về thị trường BĐS Việt Nam, pháp lý nhà đất, và các dự án hiện có.\nHãy trả lời bằng tiếng Việt một cách lịch sự, thân thiện, chuyên nghiệp, súc tích và hữu ích.\nNếu người dùng hỏi về một bất động sản cụ thể, hãy sử dụng ngữ cảnh được cung cấp: ${context || "Không có ngữ cảnh cụ thể"}.`
          },
          ...formattedHistory,
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Lỗi khi gọi API Groq");
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Tôi đang gặp khó khăn khi kết nối với hệ thống. Vui lòng thử lại sau.";
  }
}

export async function generateRoomDescription(roomType: string, propertyTitle: string) {
  const prompt = `Bạn là một chuyên gia nội thất và môi giới bất động sản. 
  Hãy viết 1 đoạn văn ngắn (khoảng 2-3 câu) giới thiệu về ${roomType} của bất động sản "${propertyTitle}".
  Phong cách: Sang trọng, mời gọi, tập trung vào công năng và cảm giác không gian.
  Không dùng các từ như "Tôi là", "Trong ảnh này", hãy bắt đầu trực tiếp vào việc giới thiệu phòng.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 200,
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating room description:", error);
    return `Không gian ${roomType} rộng rãi, thoáng mát, được thiết kế tối ưu công năng sử dụng.`;
  }
}
