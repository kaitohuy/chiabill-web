import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-theme">
      <div className="max-w-3xl mx-auto glass-panel rounded-2xl shadow-xl overflow-hidden p-8 sm:p-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          Chính Sách Bảo Mật (Privacy Policy)
        </h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-6">
          <p className="text-sm italic">Cập nhật lần cuối: 5 tháng 6, 2026</p>
          
          <p>
            Chào mừng bạn đến với <strong>ChiaBill</strong>. Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ thông tin cá nhân của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin của bạn khi bạn sử dụng ứng dụng di động và trang web của chúng tôi.
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">1. Thu thập thông tin</h2>
            <p>Chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để vận hành ứng dụng bao gồm:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Thông tin tài khoản: Tên hiển thị, email, ảnh đại diện khi đăng nhập bằng Google.</li>
              <li>Thông tin chuyến đi: Tên chuyến đi, danh sách thành viên (bao gồm cả thành viên ảo do bạn tự tạo) và các khoản chi tiêu mà bạn tự nguyện ghi nhận.</li>
              <li>Chúng tôi không tự động thu thập vị trí của bạn trừ khi bạn sử dụng tính năng tìm kiếm địa điểm trên bản đồ du lịch.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">2. Sử dụng thông tin</h2>
            <p>Thông tin thu thập được sử dụng để:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Đồng bộ hóa dữ liệu chuyến đi giữa các thiết bị của bạn và các thành viên khác trong nhóm.</li>
              <li>Tính toán phân chia chi phí, thống kê chi tiêu và đề xuất quyết toán nợ tối ưu nhất.</li>
              <li>Gửi thông báo liên quan đến lời mời tham gia nhóm hoặc biến động quỹ nhóm.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">3. Chia sẻ thông tin</h2>
            <p>
              Chúng tôi không bán, giao dịch hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba. Dữ liệu chuyến đi và chi tiêu chỉ hiển thị đối với những người được bạn hoặc trưởng nhóm mời tham gia vào chuyến đi đó.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">4. Bảo mật dữ liệu</h2>
            <p>
              Chúng tôi sử dụng các biện pháp bảo mật mã hóa đường truyền SSL/TLS và lưu trữ thông tin an toàn trên cơ sở dữ liệu để ngăn chặn việc truy cập trái phép.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-6 mb-2">5. Quyền của người dùng</h2>
            <p>
              Bạn có toàn quyền chỉnh sửa thông tin cá nhân, xóa các khoản chi tiêu hoặc yêu cầu xóa hoàn toàn tài khoản của mình khỏi hệ thống thông qua phần Cài đặt tài khoản trong ứng dụng hoặc gửi yêu cầu xóa tài khoản trên trang web này.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <a 
              href="/" 
              className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg focus:outline-none"
            >
              Quay lại Trang chủ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
