import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, HelpCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { loginGoogle, loginAnonymous, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleCallback = async (response: any) => {
    try {
      setIsAuthLoading(true);
      setError(null);
      await loginGoogle(response.credential);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Google login failed:', err);
      setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    // Initialise Google GIS button when DOM is loaded and google script is ready
    const initGoogleBtn = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: '939309138457-cs2v2gjin0td8maiqcuudq78kcr64p9p.apps.googleusercontent.com',
          callback: handleGoogleCallback,
          auto_select: false,
        });

        const btnElement = document.getElementById('google-btn');
        if (btnElement) {
          google.accounts.id.renderButton(btnElement, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: btnElement.clientWidth || 340,
          });
        }
      } else {
        // Retry in 500ms if script not fully parsed
        setTimeout(initGoogleBtn, 500);
      }
    };

    initGoogleBtn();
  }, []);

  const handleAnonymousLogin = async () => {
    try {
      setIsAuthLoading(true);
      setError(null);
      await loginAnonymous();
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Anonymous login failed:', err);
      setError(err.message || 'Đăng nhập ẩn danh thất bại. Vui lòng thử lại.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500/10 via-slate-900 to-indigo-950/20 px-4 transition-theme relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl flex rounded-3xl shadow-2xl overflow-hidden glass-panel max-md:flex-col relative z-10">
        {/* Left Side: Branding / Intro */}
        <div className="flex-1 bg-gradient-to-br from-primary to-emerald-700 p-10 text-white flex flex-col justify-between max-md:p-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl shadow-inner">
                CB
              </div>
              <span className="font-extrabold text-xl tracking-wider">ChiaBill</span>
            </div>
            
            <h2 className="text-3xl font-extrabold leading-tight mb-4 max-md:text-2xl">
              Phân Chia Chi Phí Chuyến Đi Chưa Bao Giờ Dễ Đến Thế
            </h2>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Đồng hành cùng nhóm của bạn, lập kế hoạch chi tiết, nạp quỹ nhóm, tính toán nợ và tự động đề xuất quyết toán nợ tối ưu nhất chỉ với vài chạm.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white/10 rounded-lg text-emerald-300">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="font-semibold text-sm">Thuật toán tối ưu</p>
                <p className="text-white/70 text-xs">Tự động tính toán phương án xóa nợ có số lượng giao dịch chuyển khoản ít nhất.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="flex-1 bg-white dark:bg-slate-900 p-10 flex flex-col justify-center max-md:p-8 transition-theme">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đăng Nhập Hệ Thống</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chọn phương thức để bắt đầu quản lý chi tiêu nhóm
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-sm rounded-xl border border-rose-200 dark:border-rose-900/40 text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Google Identity Button */}
            <div className="flex flex-col items-center">
              <div id="google-btn" className="w-full flex justify-center h-[44px]"></div>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-2 text-center">
                Đăng nhập bằng Google để đồng bộ dữ liệu vĩnh viễn trên nhiều thiết bị
              </p>
            </div>

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
              <span className="px-3 text-xs text-slate-400 dark:text-slate-600 font-medium">HOẶC</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Anonymous Login Button */}
            <button
              onClick={handleAnonymousLogin}
              disabled={isAuthLoading}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 border border-slate-200 dark:border-slate-700/50 shadow-sm"
            >
              {isAuthLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></div>
              ) : (
                <>
                  <HelpCircle size={18} />
                  <span>Tiếp tục ẩn danh (Guest)</span>
                </>
              )}
            </button>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] text-center">
              *Tài khoản ẩn danh có thể bị mất dữ liệu nếu bạn xóa cookie trình duyệt. Bạn có thể liên kết với Google sau này trong trang Cá nhân.
            </p>
          </div>

          <div className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <a href="/privacy-policy" className="text-primary hover:underline font-medium">
              Chính sách bảo mật
            </a>{' '}
            của ChiaBill.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
