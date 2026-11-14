//Ngô Kim Trâm_CE191681
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const CANDIDATE_MODELS = [
  process.env.EXPO_PUBLIC_GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-3.8-flash',
].filter(Boolean);
const MODELS = [...new Set(CANDIDATE_MODELS)];

const generateWithFallback = async (ai, contents) => {
  let lastError;
  for (const model of MODELS) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
      });
    } catch (err) {
      lastError = err;
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        /high demand|temporary|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(
          err?.message || ''
        );
      if (isTransient) {
        console.log(
          `[Gemini] Model ${model} quá tải tạm thời (503/429), tự động chuyển sang model kế tiếp...`
        );
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

export const getGeminiShoppingAdvice = async (productTitle, productDescription) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('YOUR_')) {
    throw new Error(
      'Chưa cấu hình Gemini API key. Hãy thêm EXPO_PUBLIC_GEMINI_API_KEY vào file .env rồi khởi động lại ứng dụng.'
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `Bạn là một trợ lý mua sắm thông minh. Hãy đánh giá ưu điểm và đưa ra lời khuyên ngắn gọn (3-4 câu) cho khách hàng có nên mua sản phẩm sau đây không:
    Tên sản phẩm: ${productTitle}
    Mô tả: ${productDescription}`;

    const response = await generateWithFallback(ai, prompt);

    return response.text || 'Không thể lấy phản hồi từ AI.';
  } catch (error) {
    console.error('Gemini shopping advice error:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (/API key not valid|API_KEY_INVALID/i.test(message)) {
      throw new Error(
        'Gemini API key không hợp lệ. Hãy kiểm tra EXPO_PUBLIC_GEMINI_API_KEY trong file .env và tạo key tại Google AI Studio.'
      );
    }

    throw new Error('Không thể kết nối Gemini lúc này. Vui lòng thử lại sau.');
  }
};

export const getOutfitRecommendations = async (occasion, products) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith('YOUR_')) {
    throw new Error('Chưa cấu hình Gemini API key trong file .env.');
  }
  if (typeof occasion !== 'string' || !occasion.trim()) {
    throw new Error('Vui lòng nhập dịp bạn muốn phối đồ.');
  }
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Danh mục hiện chưa có sản phẩm để tư vấn.');
  }

  const catalog = products.map(({ id, title, description, category, price }) => ({
    id,
    title,
    description,
    category,
    price,
  }));
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  let response;
  try {
    response = await generateWithFallback(
      ai,
      [
        'Bạn là stylist thời trang. Chỉ được chọn sản phẩm trong catalog bên dưới.',
        'Trả về JSON thuần đúng dạng {"productIds":[number],"advice":"lời khuyên ngắn bằng tiếng Việt"}.',
        'Không tự tạo product ID. Chỉ gợi ý tối đa 4 sản phẩm.',
        `Dịp/sở thích: ${occasion.trim()}`,
        `Catalog: ${JSON.stringify(catalog)}`,
      ].join('\n')
    );
  } catch (error) {
    console.error('Gemini outfit recommendations error:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (/API key not valid|API_KEY_INVALID/i.test(message)) {
      throw new Error(
        'Gemini API key không hợp lệ. Hãy kiểm tra EXPO_PUBLIC_GEMINI_API_KEY trong file .env.'
      );
    }
    throw new Error('Không thể kết nối Gemini lúc này. Vui lòng thử lại.');
  }

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error('Gemini chưa trả về gợi ý. Vui lòng thử lại.');
  }

  let parsed;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON format');
    }
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Gợi ý từ Gemini không đúng định dạng. Vui lòng thử lại.');
  }
  if (!Array.isArray(parsed.productIds) || typeof parsed.advice !== 'string') {
    throw new Error('Gợi ý từ Gemini thiếu danh sách sản phẩm hoặc lời khuyên.');
  }

  const catalogById = new Map(products.map((product) => [String(product.id), product]));
  const recommendations = [...new Set(parsed.productIds.map(String))]
    .map((productId) => catalogById.get(productId))
    .filter(Boolean)
    .slice(0, 4);

  if (recommendations.length === 0) {
    throw new Error('Gemini không đề xuất sản phẩm hợp lệ trong danh mục.');
  }

  return { recommendations, advice: parsed.advice.trim() };
};