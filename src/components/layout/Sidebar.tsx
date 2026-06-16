import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme, THEME_PRESETS, type ThemePreset } from '../../context/ThemeContext';
import { 
  Home, 
  Map, 
  BarChart2, 
  Bell, 
  User, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon,
  Trash2
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activePreset, isDark, setThemePreset, toggleDarkMode } = useAppTheme();

  const menuItems = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/explore', label: 'Khám phá', icon: Map },
    { to: '/stats', label: 'Thống kê', icon: BarChart2 },
    { to: '/notifications', label: 'Thông báo', icon: Bell },
    { to: '/profile', label: 'Cá nhân', icon: User },
  ];

  const bottomItems = [
    { to: '/trash', label: 'Thùng rác', icon: Trash2 },
  ];

  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 transition-theme hidden md:flex">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-md transition-theme">
            CB
          </div>
          <span className="font-extrabold text-lg tracking-wider text-slate-800 dark:text-white">
            ChiaBill
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-theme ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Trash & Utility links */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-theme ${
                      isActive
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'text-slate-500 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Admin Navigation */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60">
              <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                Quản trị
              </p>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-theme ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`
                }
              >
                <ShieldAlert size={18} />
                <span>Admin Panel</span>
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Controls (Theme, Mode, Profile) */}
      <div className="space-y-5 pt-6 border-t border-slate-100 dark:border-slate-800/60">
        {/* Dynamic Color Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Hệ màu thương hiệu</span>
          <div className="flex gap-2">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((key) => (
              <button
                key={key}
                onClick={() => setThemePreset(key)}
                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                  activePreset === key 
                    ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: THEME_PRESETS[key].primary,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }}
                title={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer border border-slate-100 dark:border-slate-800 transition-theme"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Moon size={14} className="text-primary" /> : <Sun size={14} className="text-amber-500" />}
            <span>Chế độ {isDark ? 'tối' : 'sáng'}</span>
          </span>
          <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${isDark ? 'bg-primary' : 'bg-slate-300'}`}>
            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isDark ? 'translate-x-3' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Logged User Info / Logout */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'anonymous'}`}
              alt="Avatar"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize">
                {user?.isAnonymous ? 'Khách ẩn danh' : user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
