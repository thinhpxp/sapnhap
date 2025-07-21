// /api/lookup-forward.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  const { code } = request.query;
  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã cũ (code).' });
  }

  const oldWardCode = parseInt(code, 10);

  try {
    const { data: record, error } = await supabase
      .from('full_vietnam')
      .select(`
        old_ward_code,
        old_district_code,
        old_province_code,
        new_ward_name,
        new_ward_en_name, /* <-- THÊM MỚI */
        new_ward_code,
        new_province_name,
        new_province_en_name, /* <-- THÊM MỚI */
        new_province_code
      `)
      .eq('old_ward_code', oldWardCode)
      .limit(1);

    if (error) throw error;

    const result = data && data.length > 0 ? data[0] : null;

    if (!result) {
      return response.status(200).json({ changed: false });
    }

    // Trả về đầy đủ dữ liệu, bao gồm cả các phiên bản tên tiếng Anh
    response.status(200).json({
      changed: true,
      ...result // Sử dụng spread operator để trả về tất cả các cột đã select
    });

  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}