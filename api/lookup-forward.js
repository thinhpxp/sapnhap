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
      .from('merger_data')
      .select(`
        old_ward_code,
        old_district_code,
        old_province_code,
        new_ward_name,
        new_ward_code,
        new_province_name,
        new_province_code
      `)
      .eq('old_ward_code', oldWardCode)
      .maybeSingle();

    if (error) throw error;

    if (!record) {
      return response.status(200).json({ changed: false });
    }

    // Trả về đầy đủ dữ liệu, bao gồm cả các mã code cũ
    response.status(200).json({
      changed: true,
      old_ward_code: record.old_ward_code,
      old_district_code: record.old_district_code,
      old_province_code: record.old_province_code,
      new_ward_name: record.new_ward_name,
      new_ward_code: record.new_ward_code,
      new_province_name: record.new_province_name,
      new_province_code: record.new_province_code,
    });

  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}