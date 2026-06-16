import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface TrashTrip {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  categoryName: string;
  categoryIcon: string;
}

const Trash: React.FC = () => {
  const [deletedTrips, setDeletedTrips] = useState<TrashTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // For force-delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/trips/trash');
      if (response.data?.success) {
        setDeletedTrips(response.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách thùng rác');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (tripId: number) => {
    try {
      setActionLoading(tripId);
      setError('');
      setSuccessMsg('');
      const response = await api.put(`/api/trips/${tripId}/restore`);
      if (response.data?.success) {
        setSuccessMsg(response.data.message || 'Đã phục hồi chuyến đi');
        setDeletedTrips(prev => prev.filter(t => t.id !== tripId));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phục hồi chuyến đi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceDelete = async (tripId: number) => {
    try {
      setActionLoading(tripId);
      setError('');
      setSuccessMsg('');
      const response = await api.delete(`/api/trips/${tripId}/force`);
      if (response.data?.success) {
        setSuccessMsg(response.data.message || 'Đã xóa vĩnh viễn chuyến đi');
        setDeletedTrips(prev => prev.filter(t => t.id !== tripId));
        setConfirmDeleteId(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa vĩnh viễn');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.location.href = '/'}
          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer text-slate-700 dark:text-slate-350"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Trash2 size={22} className="text-rose-500" />
            <span>Thùng rác chuyến đi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Nơi lưu trữ và quản lý các chuyến đi đã xóa tạm thời</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Đang tải thùng rác...</div>
      ) : deletedTrips.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <Trash2 className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={56} />
          <p className="font-semibold text-slate-750 dark:text-slate-300">Thùng rác trống</p>
          <p className="text-xs text-slate-400 mt-1.5">Không có chuyến đi nào được xóa tạm thời gần đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deletedTrips.map((trip) => (
            <div 
              key={trip.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {trip.categoryName || 'Chuyến đi'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">
                  {trip.name}
                </h4>
                {trip.description && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{trip.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-500">
                  <Calendar size={14} />
                  <span>{formatDate(trip.startDate)} đến {formatDate(trip.endDate)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/60">
                {confirmDeleteId === trip.id ? (
                  <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 p-1.5 rounded-xl border border-rose-100 dark:border-rose-900/60">
                    <span className="text-[11px] font-bold text-rose-650 dark:text-rose-400 px-2 flex items-center gap-1">
                      <AlertTriangle size={13} />
                      Xác nhận xóa vĩnh viễn?
                    </span>
                    <button
                      onClick={() => handleForceDelete(trip.id)}
                      disabled={actionLoading !== null}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Có
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400 text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Không
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleRestore(trip.id)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-primary dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={14} />
                      <span>{actionLoading === trip.id ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(trip.id)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-850 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Xóa vĩnh viễn</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;
