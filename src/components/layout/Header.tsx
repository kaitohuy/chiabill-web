import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Bell, Sun, Moon, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useAppTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamically determine page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Bảng điều khiển';
    if (path.startsWith('/trip/')) return 'Chi tiết chuyến đi';
    if (path === '/explore') return 'Khám phá địa điểm';
    if (path === '/stats') return 'Thống kê cá nhân';
    if (path === '/notifications') return 'Trung tâm thông báo';
    if (path === '/profile') return 'Thông tin cá nhân';
    if (path.startsWith('/admin')) return 'Hệ thống Quản trị';
    if (path === '/privacy-policy') return 'Chính sách bảo mật';
    if (path === '/delete-account-request') return 'Yêu cầu xóa dữ liệu';
    return 'ChiaBill';
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between transition-theme">
      {/* Dynamic Title */}
      <h1 className="text-lg font-bold text-slate-800 dark:text-white m-0 tracking-tight">
        {getPageTitle()}
      </h1>

      {/* Action Utilities */}
      <div className="flex items-center gap-3">
        {/* Dark Mode toggle for Mobile Viewport */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden cursor-pointer"
          title="Chuyển chế độ tối/sáng"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
          title="Thông báo"
        >
          <Bell size={18} />
          {/* Notification Badge Placeholder */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 md:hidden"></div>

        {/* User Quick Info for Mobile viewport logout */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors md:hidden cursor-pointer"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>

        {/* User Info (Desktop only) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Xin chào, <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
