// /api/get-realtime-locations.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
});
const propertyId = process.env.GA4_PROPERTY_ID;

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
    });

    const locations = [];
    if (realtimeResponse.rows) {
      realtimeResponse.rows.forEach(row => {
        const city = row.dimensionValues[0].value;
        const userCount = parseInt(row.metricValues[0].value, 10);

        // Chỉ lấy các thành phố có tên và có ít nhất 1 người dùng
        if (city && city !== '(not set)' && userCount > 0) {
          locations.push({
            city: city,
            count: userCount
          });
        }
      });
    }

    // Sắp xếp danh sách theo số lượng người dùng giảm dần
    locations.sort((a, b) => b.count - a.count);

    // Trả về một mảng các đối tượng, mỗi đối tượng chứa tên thành phố và số lượng
    response.status(200).json({
      activeLocations: locations
    });

  } catch (error) {
    console.error('Lỗi khi gọi Google Analytics Realtime API:', error);
    response.status(500).json({ error: 'Không thể lấy dữ liệu thời gian thực.' });
  }
}