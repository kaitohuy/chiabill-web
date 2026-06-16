import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Calendar, Users, ArrowRight, Trash2, MoreVertical, Edit, LogOut, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreateTripModal from '../../components/trip/CreateTripModal';
import JoinTripModal from '../../components/trip/JoinTripModal';
import api from '../../services/api';

interface Trip {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  ownerId: number;
  totalBudget: number;
  memberCount: number;
  categoryName: string;
  categoryIcon: string;
  coverUrl: string;
  totalExpenses: number;
  myBalance: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<any>(null);

  // Dropdown menus state
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');

      // 1. Get active trips
      const tripsRes = await api.get('/api/trips');
      const activeTrips = tripsRes.data?.data || [];

      // 2. Get overall stats (trip expenses)
      let stats: any[] = [];
      try {
        const statsRes = await api.get('/api/expenses/overall-stats');
        stats = statsRes.data?.data || [];
      } catch (err) {
        console.error('Failed to load overall stats:', err);
      }

      // 3. For each trip, get user's balance
      const balancePromises = activeTrips.map(async (trip: any) => {
        try {
          const balRes = await api.get(`/api/settlements/trip/${trip.id}/balance/${user.id}`);
          return {
            tripId: trip.id,
            netBalance: balRes.data?.data?.netBalance || 0
          };
        } catch (e) {
          console.error(`Error fetching balance for trip ${trip.id}:`, e);
          return { tripId: trip.id, netBalance: 0 };
        }
      });
      const balances = await Promise.all(balancePromises);

      // Combine data
      const combined = activeTrips.map((trip: any) => {
        const tripStat = stats.find((s: any) => s.tripId === trip.id);
        const tripBal = balances.find((b: any) => b.tripId === trip.id);
        return {
          ...trip,
          totalExpenses: tripStat ? tripStat.totalAmount : 0,
          myBalance: tripBal ? tripBal.netBalance : 0,
        };
      });

      setTrips(combined);
    } catch (err: any) {
      console.error(err);
      setError('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSoftDelete = async (tripId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn chuyển chuyến đi này vào thùng rác?')) return;
    try {
      const response = await api.delete(`/api/trips/${tripId}`);
      if (response.data?.success) {
        setTrips(prev => prev.filter(t => t.id !== tripId));
        setActiveMenuId(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa chuyến đi');
    }
  };

  const handleLeaveTrip = async (tripId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi chuyến đi này?')) return;
    try {
      const response = await api.post(`/api/trips/${tripId}/leave`);
      if (response.data?.success) {
        setTrips(prev => prev.filter(t => t.id !== tripId));
        setActiveMenuId(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi rời nhóm');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const filteredTrips = trips.filter(trip => 
    trip.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner / Header actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary to-emerald-600 p-6 sm:p-8 rounded-3xl text-white shadow-lg shadow-emerald-500/10">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Chào mừng, {user?.name || 'Bạn'}!</h2>
          <p className="text-white/80 text-sm">Hôm nay bạn muốn ghi nhận khoản chi tiêu nào cho chuyến đi?</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="px-4.5 py-2.5 bg-white text-primary font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Tạo chuyến đi</span>
          </button>
          <button 
            onClick={() => setIsJoinOpen(true)}
            className="px-4.5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Users size={15} />
            <span>Tham gia nhóm</span>
          </button>
          <button 
            onClick={() => window.location.href = '/trash'}
            className="px-4.5 py-2.5 bg-rose-600/35 hover:bg-rose-600/50 text-white font-bold text-xs rounded-xl transition-colors border border-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Thùng rác</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm transition-theme">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm chuyến đi theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-theme text-slate-900 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Error statement */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-450 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Trips list */}
      <div>
        <h3 className="text-base font-bold text-slate-855 dark:text-slate-200 mb-4 px-1">Chuyến đi của bạn</h3>
        
        {loading ? (
          <div className="text-center py-20 text-slate-400">Đang tải danh sách chuyến đi...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <Users className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <p className="font-semibold text-slate-750 dark:text-slate-300">Không tìm thấy chuyến đi nào</p>
            <p className="text-xs text-slate-400 mt-1">Hãy tạo chuyến đi mới hoặc tham gia bằng mã mời từ bạn bè.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => {
              const isOwner = trip.ownerId === user?.id;
              
              return (
                <div 
                  key={trip.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between gap-5 shadow-sm group relative"
                >
                  <div className="space-y-3">
                    {/* Status, Category & More Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                        {trip.categoryName || 'Chuyến đi'}
                      </span>
                      
                      <div className="flex items-center gap-1.5 relative">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{trip.memberCount} thành viên</span>
                        
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === trip.id ? null : trip.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === trip.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-7 z-20 w-44 bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-800 rounded-xl shadow-xl p-1.5 animate-scale-up"
                          >
                            <button
                              onClick={() => {
                                window.location.href = `/trip/${trip.id}`;
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={14} />
                              <span>Xem chi tiết</span>
                            </button>
                            
                            {isOwner ? (
                              <>
                                <button
                                  onClick={() => {
                                    setTripToEdit(trip);
                                    setIsCreateOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit size={14} />
                                  <span>Sửa thông tin</span>
                                </button>
                                <button
                                  onClick={() => handleSoftDelete(trip.id)}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800/60 mt-1"
                                >
                                  <Trash2 size={14} />
                                  <span>Xóa chuyến đi</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleLeaveTrip(trip.id)}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800/60 mt-1"
                              >
                                <LogOut size={14} />
                                <span>Rời nhóm</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-base group-hover:text-primary transition-colors line-clamp-1 pr-4">
                      {trip.name}
                    </h4>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      <Calendar size={14} />
                      <span>{formatDate(trip.startDate)} đến {formatDate(trip.endDate)}</span>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Tổng chi tiêu</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-300">
                        {formatCurrency(trip.totalExpenses)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">Số dư của tôi</span>
                      <span className={`text-sm font-black ${
                        trip.myBalance > 0 
                          ? 'text-emerald-500' 
                          : trip.myBalance < 0 
                            ? 'text-rose-500' 
                            : 'text-slate-550 dark:text-slate-400'
                      }`}>
                        {trip.myBalance > 0 ? '+' : ''}{formatCurrency(trip.myBalance)}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.location.href = `/trip/${trip.id}`}
                    className="w-full py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 border border-slate-100 dark:border-slate-850 hover:border-transparent cursor-pointer shadow-sm"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <CreateTripModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setTripToEdit(null);
        }}
        onSuccess={fetchDashboardData}
        tripToEdit={tripToEdit}
      />

      {/* Join Modal */}
      <JoinTripModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
