import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Map, 
  BarChart2, 
  Bell, 
  User,
  ShieldAlert
} from 'lucide-react';

const BottomNav: React.FC = () => {
  const { user } = useAuth();
  
  const menuItems = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/explore', label: 'Khám phá', icon: Map },
    { to: '/stats', label: 'Thống kê', icon: BarChart2 },
    { to: '/notifications', label: 'Thông báo', icon: Bell },
    { to: '/profile', label: 'Cá nhân', icon: User },
  ];

  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-around items-center z-50 md:hidden pb-safe">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon size={20} className="transition-transform duration-200" />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        );
      })}
      
      {isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors ${
              isActive 
                ? 'text-indigo-600' 
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <ShieldAlert size={20} />
          <span className="text-[10px] mt-1 font-medium">Admin</span>
        </NavLink>
      )}
    </nav>
  );
};

export default BottomNav;
