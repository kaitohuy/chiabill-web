import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Plus, Edit, Trash2,
  Download, Copy, Settings, AlertCircle, Volume2, X
} from 'lucide-react';
import api from '../../../services/api';
import SaveItineraryModal from '../SaveItineraryModal';

interface ItineraryItem {
  id: number;
  dayNumber: number;
  timeRange?: string;
  activity: string;
  location?: string;
  note?: string;
  estimatedCost?: number;
}

interface ItineraryTabProps {
  tripId: string;
  startDate?: string;
  endDate?: string;
}

const ItineraryTab: React.FC<ItineraryTabProps> = ({ tripId, startDate, endDate }) => {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);

  // Modals state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ItineraryItem | null>(null);

  // Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmValue, setAlarmValue] = useState(15);
  const [alarmUnit, setAlarmUnit] = useState<'MINUTE' | 'HOUR' | 'DAY'>('MINUTE');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Clone/Import state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [otherTrips, setOtherTrips] = useState<{ id: number; name: string }[]>([]);
  const [selectedSourceTripId, setSelectedSourceTripId] = useState<number | null>(null);
  const [cloneLoading, setCloneLoading] = useState(false);

  // Calculate total days
  const maxDays = React.useMemo(() => {
    if (!startDate || !endDate) return 3; // default fallback
    const start = new Date(startDate.split('T')[0]);
    const end = new Date(endDate.split('T')[0]);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 3;
  }, [startDate, endDate]);

  const fetchItinerary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/trips/${tripId}/itinerary`);
      if (res.data?.success) {
        setItems(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải lịch trình chuyến đi');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const handleDelete = async (itemId: number) => {
    if (!window.confirm('Xóa hoạt động này khỏi lịch trình?')) return;
    try {
      await api.delete(`/api/trips/${tripId}/itinerary/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa hoạt động');
    }
  };

  const handleExportExcel = () => {
    window.open(`${api.defaults.baseURL}/api/trips/${tripId}/itinerary/export/excel`, '_blank');
  };

  // Fetch alarm settings
  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await api.get(`/api/trips/${tripId}/itinerary/settings`);
      if (res.data?.success && res.data.data) {
        setAlarmEnabled(res.data.data.alarmEnabled);
        setAlarmValue(res.data.data.alarmValue);
        setAlarmUnit(res.data.data.alarmUnit);
      }
    } catch (err) {
      console.error('Cannot load alarm settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSettingsLoading(true);
      await api.put(`/api/trips/${tripId}/itinerary/settings`, {
        alarmEnabled,
        alarmValue,
        alarmUnit,
      });
      setShowSettingsModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu cài đặt báo thức');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch other trips for clone
  const loadOtherTrips = async () => {
    try {
      setCloneLoading(true);
      const res = await api.get('/api/trips');
      if (res.data?.success) {
        const list = (res.data.data || []).filter((t: any) => String(t.id) !== String(tripId));
        setOtherTrips(list);
        if (list.length > 0) {
          setSelectedSourceTripId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Cannot load other trips:', err);
    } finally {
      setCloneLoading(false);
    }
  };

  const handleClone = async () => {
    if (!selectedSourceTripId) return;
    try {
      setCloneLoading(true);
      const res = await api.post(`/api/trips/${tripId}/itinerary/import-from/${selectedSourceTripId}`);
      if (res.data?.success) {
        setShowCloneModal(false);
        fetchItinerary();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể sao chép lịch trình');
    } finally {
      setCloneLoading(false);
    }
  };

  // Filter items for selected day
  const dailyItems = items
    .filter(item => item.dayNumber === selectedDay)
    .sort((a, b) => (a.timeRange || '').localeCompare(b.timeRange || ''));

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-5">
      {/* Action Buttons Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => { setItemToEdit(null); setIsSaveModalOpen(true); }}
            className="px-4 py-2 bg-primary hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <Plus size={14} /> Thêm hoạt động
          </button>
          <button
            onClick={() => { setShowSettingsModal(true); fetchSettings(); }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings size={14} /> Cài đặt báo thức
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setShowCloneModal(true); loadOtherTrips(); }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Copy size={14} /> Sao chép
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={14} /> Xuất Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Day Selector Slides/Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {Array.from({ length: maxDays }, (_, idx) => {
          const day = idx + 1;
          const isActive = selectedDay === day;
          const count = items.filter(i => i.dayNumber === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/15'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <span>Ngày {day}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Đang tải lịch trình...</div>
      ) : dailyItems.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Calendar className="mx-auto text-slate-200 dark:text-slate-800 mb-3" size={48} />
          <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Chưa có hoạt động nào trong Ngày {selectedDay}</p>
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="mt-3 text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            + Thêm hoạt động đầu tiên
          </button>
        </div>
      ) : (
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3.5 pl-6 space-y-6">
          {dailyItems.map((item) => (
            <div key={item.id} className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-3 border-primary flex-shrink-0" />

              {/* Activity Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.timeRange && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 dark:bg-primary/5 px-2 py-0.5 rounded-md">
                          <Clock size={11} />
                          {item.timeRange}
                        </span>
                      )}
                      {item.estimatedCost && item.estimatedCost > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                          {formatCurrency(item.estimatedCost)}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                      {item.activity}
                    </h4>

                    {item.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {item.location}
                      </p>
                    )}

                    {item.note && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 mt-2">
                        💡 {item.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setItemToEdit(item); setIsSaveModalOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Activity Modal */}
      <SaveItineraryModal
        isOpen={isSaveModalOpen}
        onClose={() => { setIsSaveModalOpen(false); setItemToEdit(null); }}
        onSuccess={fetchItinerary}
        tripId={tripId}
        defaultDay={selectedDay}
        maxDays={maxDays}
        itemToEdit={itemToEdit}
      />

      {/* Alarm Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Volume2 size={18} className="text-primary animate-bounce" />
                Cài đặt báo thức
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <input
                  type="checkbox"
                  checked={alarmEnabled}
                  onChange={(e) => setAlarmEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-white">Bật thông báo báo thức</p>
                  <p className="text-[10px] text-slate-400">Nhắc nhở trước khi hoạt động diễn ra</p>
                </div>
              </label>

              {alarmEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Thời gian báo trước</label>
                    <input
                      type="number"
                      value={alarmValue}
                      onChange={(e) => setAlarmValue(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Đơn vị</label>
                    <select
                      value={alarmUnit}
                      onChange={(e) => setAlarmUnit(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none font-semibold"
                    >
                      <option value="MINUTE">Phút</option>
                      <option value="HOUR">Giờ</option>
                      <option value="DAY">Ngày</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={saveSettings}
                disabled={settingsLoading}
                className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {settingsLoading ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Itinerary Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Sao chép lịch trình</h3>
              <button onClick={() => setShowCloneModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {cloneLoading && otherTrips.length === 0 ? (
              <p className="text-xs text-slate-400">Đang tải danh sách chuyến đi...</p>
            ) : otherTrips.length === 0 ? (
              <p className="text-xs text-slate-400">Không tìm thấy chuyến đi nào khác để sao chép.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Chọn chuyến đi nguồn</label>
                  <select
                    value={selectedSourceTripId || ''}
                    onChange={(e) => setSelectedSourceTripId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    {otherTrips.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  ⚠️ Lưu ý: Sao chép lịch trình sẽ ghi đè hoặc bổ sung hoạt động từ chuyến đi nguồn.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCloneModal(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleClone}
                disabled={cloneLoading || !selectedSourceTripId}
                className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {cloneLoading ? 'Đang sao chép...' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryTab;
