import React, { useState, useEffect } from 'react';
import { 
  Bell, Mail, AlertCircle, DollarSign, ArrowLeftRight, 
  CheckCircle2, UserMinus, Calendar, TrendingUp, Inbox, CheckSquare
} from 'lucide-react';
import api from '../../services/api';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'EXPENSE_CREATED' | 'PAYMENT_REQUESTED' | 'PAYMENT_APPROVED' | 'TRIP_INVITE' | 'MEMBER_KICKED' | 'SYSTEM' | 'SETTLEMENT_CREATED' | 'ITINERARY';
  referenceId: number;
  isRead: boolean;
  createdAt: string;
}

const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/notifications');
      if (response.data && response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi đánh dấu đã đọc');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi đánh dấu tất cả');
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'EXPENSE_CREATED':
        return (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <DollarSign size={18} />
          </div>
        );
      case 'PAYMENT_REQUESTED':
        return (
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <ArrowLeftRight size={18} />
          </div>
        );
      case 'PAYMENT_APPROVED':
        return (
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
            <CheckCircle2 size={18} />
          </div>
        );
      case 'TRIP_INVITE':
        return (
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Mail size={18} />
          </div>
        );
      case 'MEMBER_KICKED':
        return (
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <UserMinus size={18} />
          </div>
        );
      case 'SETTLEMENT_CREATED':
        return (
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
            <TrendingUp size={18} />
          </div>
        );
      case 'ITINERARY':
        return (
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Calendar size={18} />
          </div>
        );
      default:
        return (
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <AlertCircle size={18} />
          </div>
        );
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <span>Thông báo & Hoạt động</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                {unreadCount} mới
              </span>
            )}
          </h3>

          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-semibold cursor-pointer"
            >
              <CheckSquare size={14} />
              <span>Đọc tất cả</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Đang tải thông báo...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-rose-500 text-sm font-semibold">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <Inbox className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" size={38} />
            <span>Bạn không có thông báo nào</span>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div 
                key={item.id}
                onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer group ${
                  item.isRead 
                    ? 'border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-850/30' 
                    : 'border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-50/10 dark:bg-emerald-500/5 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/10'
                }`}
              >
                {getNotificationIcon(item.type)}
                
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold leading-snug truncate ${
                      item.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white font-extrabold'
                    }`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
