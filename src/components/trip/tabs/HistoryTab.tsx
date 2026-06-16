import React, { useState, useEffect, useCallback } from 'react';
import { History, ChevronDown, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

interface HistoryEntry {
  id: number;
  tripId: number;
  actorId: number;
  actorName: string;
  action: string;
  content: string;
  createdAt: string;
}

interface HistoryTabProps {
  tripId: string;
}

const ACTION_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  ADD_EXPENSE:    { icon: '➕', label: 'Thêm chi tiêu',    color: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' },
  UPDATE_EXPENSE: { icon: '✏️', label: 'Sửa chi tiêu',     color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' },
  DELETE_EXPENSE: { icon: '🗑️', label: 'Xóa chi tiêu',     color: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' },
  JOIN_TRIP:      { icon: '👋', label: 'Tham gia',          color: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300' },
  LEAVE_TRIP:     { icon: '🚪', label: 'Rời nhóm',          color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  ADD_MEMBER:     { icon: '👤', label: 'Thêm thành viên',   color: 'bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' },
  REMOVE_MEMBER:  { icon: '❌', label: 'Xóa thành viên',    color: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' },
  FUND_CONTRIB:   { icon: '💰', label: 'Đóng quỹ',          color: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' },
  UPDATE_TRIP:    { icon: '📝', label: 'Sửa chuyến đi',     color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
};

const HistoryTab: React.FC<HistoryTabProps> = ({ tripId }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);
      setError('');

      const res = await api.get(`/api/trips/${tripId}/history`, {
        params: { page: pageNum, size: PAGE_SIZE }
      });

      if (res.data?.success) {
        const pageData = res.data.data;
        const newItems: HistoryEntry[] = pageData.content || [];
        if (append) {
          setHistory(prev => [...prev, ...newItems]);
        } else {
          setHistory(newItems);
        }
        setHasMore(!pageData.last);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải lịch sử hoạt động');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchHistory(0);
  }, [fetchHistory]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getActionInfo = (action: string) => {
    return ACTION_ICONS[action] || { icon: '📌', label: action, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Lịch sử hoạt động</h4>
          <p className="text-xs text-slate-400 mt-0.5">Mọi thay đổi trong chuyến đi được ghi lại tại đây</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Đang tải lịch sử...</div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <History className="mx-auto text-slate-200 dark:text-slate-800 mb-3" size={48} />
          <p className="font-semibold text-slate-600 dark:text-slate-400">Chưa có hoạt động nào</p>
          <p className="text-xs text-slate-400 mt-1">Mọi thao tác thêm/sửa/xóa sẽ xuất hiện ở đây</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {history.map((entry, index) => {
              const actionInfo = getActionInfo(entry.action);
              const isNewDay = index === 0 ||
                new Date(history[index - 1].createdAt).toDateString() !== new Date(entry.createdAt).toDateString();

              return (
                <React.Fragment key={entry.id}>
                  {/* Day separator */}
                  {isNewDay && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                      </span>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                  )}

                  <div className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Action Icon Badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${actionInfo.color}`}>
                      {actionInfo.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{entry.actorName}</span>
                          <span className="text-xs text-slate-400 ml-1.5">{actionInfo.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                          {formatTime(entry.createdAt)}
                        </span>
                      </div>
                      {entry.content && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {entry.content}
                        </p>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ChevronDown size={14} />
              {loadingMore ? 'Đang tải...' : 'Tải thêm lịch sử'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryTab;
