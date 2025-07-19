// /api/get-new-wards.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  // Lấy province_code từ tham số URL
  const { province_code } = request.query;

  if (!province_code) {
    return response.status(400).json({ error: 'Thiếu tham số province_code.' });
  }

  try {
    // === THAY ĐỔI CỐT LÕI: Gọi hàm SQL thay vì truy vấn trực tiếp ===
    // 'get_new_wards_by_province' là tên hàm đã tạo trên Supabase
    // { p_code: ... } là cách truyền tham số vào hàm đó
    const { data, error } = await supabase.rpc('get_new_wards_by_province', {
      p_code: parseInt(province_code, 10)
    });

    if (error) {
      throw error;
    }

    // Cấu trúc dữ liệu trả về vẫn y hệt, client không cần thay đổi gì
    response.status(200).json(data);

  } catch (error) {
    console.error('Lỗi API get-new-wards:', error);
    response.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách xã/phường.' });
  }
}