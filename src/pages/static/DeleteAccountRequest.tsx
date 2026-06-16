import React, { useState } from 'react';
import api from '../../services/api';

const DeleteAccountRequest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setMessage('Vui lòng nhập ít nhất Email hoặc Số điện thoại của tài khoản cần xóa.');
      setStatus('error');
      return;
    }

    try {
      setStatus('submitting');
      const response = await api.post('/delete-account-request', {
        email,
        phone,
        reason,
      });

      if (response.data && response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'Yêu cầu của bạn đã được tiếp nhận và xử lý thành công.');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Không thể gửi yêu cầu xóa tài khoản. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error: any) {
      console.error('Request account deletion error:', error);
      setStatus('error');
      setMessage(
        error.response?.data?.message || 'Có lỗi xảy ra trong quá trình gửi yêu cầu. Vui lòng thử lại sau.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-theme">
      <div className="max-w-md w-full glass-panel rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Yêu Cầu Xóa Tài Khoản
        </h1>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-8">
          Chúng tôi rất tiếc khi bạn quyết định dừng đồng hành cùng ChiaBill.
        </p>

        {status === 'success' ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-center">
            <svg className="w-12 h-12 mx-auto text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-semibold text-lg mb-2">Gửi Yêu Cầu Thành Công</p>
            <p className="text-sm">{message}</p>
            <div className="mt-6">
              <a href="/" className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                Quay lại Trang chủ
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === 'error' && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-sm rounded-xl border border-rose-200 dark:border-rose-900/40">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email đăng ký tài khoản
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-theme text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại đăng ký tài khoản
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-theme text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Lý do xóa tài khoản (tùy chọn)
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vui lòng cho biết lý do để giúp chúng tôi cải thiện sản phẩm..."
                className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-theme text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs leading-relaxed">
              <strong>Lưu ý:</strong> Hành động này sẽ xóa hoàn toàn thông tin tài khoản của bạn. Mọi dữ liệu chuyến đi, quỹ nhóm và lịch sử phân chia chi phí liên quan đến tài khoản này cũng sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg focus:outline-none cursor-pointer flex justify-center items-center"
            >
              {status === 'submitting' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang gửi yêu cầu...
                </>
              ) : (
                'Xác nhận xóa tài khoản'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountRequest;
