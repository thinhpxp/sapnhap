// /api/get-new-provinces.js
import { createClient } from '@supabase/supabase-js';

// 1. Kết nối tới Supabase bằng các biến môi trường an toàn
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 2. Hàm xử lý chính mà Vercel sẽ gọi
export default async function handler(request, response) {
  try {
    // 3. Gọi hàm SQL đã tạo trên Supabase bằng phương thức .rpc()
    //    .rpc() là viết tắt của "Remote Procedure Call", dùng để gọi các function trong CSDL
    const { data, error } = await supabase.rpc('get_unique_new_provinces');

    // 4. Kiểm tra lỗi trả về từ Supabase
    if (error) {
      throw error; // Ném lỗi để khối catch ở dưới bắt được
    }

    // 5. Nếu thành công, trả về dữ liệu dưới dạng JSON
    response.status(200).json(data);

  } catch (error) {
    // 6. Bắt bất kỳ lỗi nào xảy ra và ghi log, trả về lỗi 500
    console.error('Lỗi API get-new-provinces:', error);
    response.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tỉnh.' });
  }
}