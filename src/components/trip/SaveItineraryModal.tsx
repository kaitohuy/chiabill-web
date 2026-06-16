import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface ItineraryItem {
  id: number;
  dayNumber: number;
  timeRange?: string;
  activity: string;
  location?: string;
  note?: string;
  estimatedCost?: number;
}

interface SaveItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tripId: string;
  defaultDay: number;
  maxDays: number;
  itemToEdit?: ItineraryItem | null;
}

const SaveItineraryModal: React.FC<SaveItineraryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tripId,
  defaultDay,
  maxDays,
  itemToEdit,
}) => {
  const [dayNumber, setDayNumber] = useState(1);
  const [timeRange, setTimeRange] = useState('');
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!itemToEdit;

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (itemToEdit) {
        setDayNumber(itemToEdit.dayNumber);
        setTimeRange(itemToEdit.timeRange || '');
        setActivity(itemToEdit.activity || '');
        setLocation(itemToEdit.location || '');
        setNote(itemToEdit.note || '');
        setEstimatedCost(itemToEdit.estimatedCost ? String(itemToEdit.estimatedCost) : '');
      } else {
        setDayNumber(defaultDay);
        setTimeRange('');
        setActivity('');
        setLocation('');
        setNote('');
        setEstimatedCost('');
      }
    }
  }, [isOpen, defaultDay, itemToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) {
      return setError('Vui lòng nhập tên hoạt động');
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        id: itemToEdit?.id || null,
        dayNumber,
        timeRange,
        activity,
        location,
        note,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      };

      await api.post(`/api/trips/${tripId}/itinerary/item`, payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể lưu hoạt động lịch trình');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              {isEditMode ? 'Sửa hoạt động' : 'Thêm hoạt động'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Lên kế hoạch chi tiết cho chuyến đi</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Day Number */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chọn ngày *</label>
            <select
              value={dayNumber}
              onChange={(e) => setDayNumber(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white font-semibold"
            >
              {Array.from({ length: maxDays }, (_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Ngày {idx + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thời gian</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="VD: 08:00 - 10:00, Sáng..."
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên hoạt động *</label>
            <input
              type="text"
              placeholder="VD: Đi tham quan Ngũ Hành Sơn"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white font-semibold"
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Địa điểm</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="VD: Ngũ Hành Sơn, Đà Nẵng"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chi phí dự kiến (VND)</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="number"
                placeholder="VD: 100000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ghi chú</label>
            <textarea
              placeholder="Ghi chú chi tiết hoạt động..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-500/20"
            >
              {loading ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Thêm hoạt động'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveItineraryModal;
