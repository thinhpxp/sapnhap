// /api/get-realtime-locations.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Hàm khởi tạo client (giống như API trước)
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
});
const propertyId = process.env.GA4_PROPERTY_ID;

export default async function handler(request, response) {
  // Cho phép trình duyệt từ mọi nguồn gọi API này (CORS)
  response.setHeader('Access-Control-Allow-Origin', '*');
  // Cache kết quả trong thời gian rất ngắn (ví dụ: 60 giây)
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      // Lấy dữ liệu theo chiều "thành phố"
      dimensions: [{ name: 'city' }],
      // Đếm số lượng người dùng đang hoạt động
      metrics: [{ name: 'activeUsers' }],
    });

    const locations = [];
    if (realtimeResponse.rows) {
      realtimeResponse.rows.forEach(row => {
        const city = row.dimensionValues[0].value;
        // Chỉ lấy các thành phố có tên (loại bỏ các kết quả "(not set)")
        if (city && city !== '(not set)') {
          locations.push(city);
        }
      });
    }

    // Trả về một mảng chứa tên các thành phố có người dùng đang hoạt động
    response.status(200).json({
      activeCities: locations
    });

  } catch (error) {
    console.error('Lỗi khi gọi Google Analytics Realtime API:', error);
    response.status(500).json({ error: 'Không thể lấy dữ liệu thời gian thực.' });
  }
}