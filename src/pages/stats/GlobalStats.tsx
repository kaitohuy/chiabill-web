import React, { useState, useEffect } from 'react';
import { BarChart2, PieChart as PieIcon, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TripSpend {
  tripId: number;
  tripName: string;
  totalAmount: number;
  categoryIcon: string;
}

interface MonthlyData {
  label: string;
  'Chi tiêu': number;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#6366f1', '#a855f7', '#f43f5e'
];

const GlobalStats: React.FC = () => {
  const { user } = useAuth();
  const [tripSpends, setTripSpends] = useState<TripSpend[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([]);
  const [totalRefund, setTotalRefund] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGlobalData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError('');

        // 1. Fetch active trips
        const tripsRes = await api.get('/api/trips');
        const activeTrips = tripsRes.data?.data || [];
        setTripCount(activeTrips.length);

        // 2. Fetch overall spending per trip (without date filters)
        const statsRes = await api.get('/api/expenses/overall-stats');
        const statsData = statsRes.data?.data || [];
        setTripSpends(statsData);

        // 3. Fetch balances for each trip in parallel to calculate total refund and total to pay
        const balancePromises = activeTrips.map(async (trip: any) => {
          try {
            const balRes = await api.get(`/api/settlements/trip/${trip.id}/balance/${user.id}`);
            return balRes.data?.data?.netBalance || 0;
          } catch {
            return 0;
          }
        });
        const balances = await Promise.all(balancePromises);
        
        let refundSum = 0;
        let paySum = 0;
        balances.forEach(bal => {
          if (bal > 0) refundSum += bal;
          else if (bal < 0) paySum += Math.abs(bal);
        });
        setTotalRefund(refundSum);
        setTotalToPay(paySum);

        // 4. Fetch last 6 months trend in parallel
        const now = new Date();
        const monthsToFetch = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthsToFetch.push({
            month: d.getMonth() + 1,
            year: d.getFullYear(),
            label: `${d.getMonth() + 1}/${d.getFullYear().toString().substring(2)}`
          });
        }

        const trendPromises = monthsToFetch.map(async (m) => {
          try {
            const res = await api.get(`/api/expenses/overall-stats?month=${m.month}&year=${m.year}`);
            const data: TripSpend[] = res.data?.data || [];
            const total = data.reduce((sum, item) => sum + item.totalAmount, 0);
            return {
              label: m.label,
              'Chi tiêu': total
            };
          } catch {
            return { label: m.label, 'Chi tiêu': 0 };
          }
        });
        const trendData = await Promise.all(trendPromises);
        setMonthlyTrend(trendData);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải thống kê cá nhân');
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalData();
  }, [user]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Đang tổng hợp thống kê cá nhân...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-rose-500 text-sm font-semibold">
        {error}
      </div>
    );
  }

  const totalSpent = tripSpends.reduce((sum, item) => sum + item.totalAmount, 0);

  const CurrencyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs">
          <p className="font-bold text-slate-800 dark:text-white mb-1">{payload[0].name}</p>
          <p className="font-extrabold text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Cá nhân chi tiêu</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(totalSpent)}</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Được hoàn lại</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(totalRefund)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <TrendingUp size={20} className="rotate-180" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Cần thanh toán</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(totalToPay)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Số chuyến đi</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{tripCount} chuyến</span>
          </div>
        </div>
      </div>

      {tripSpends.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm">
          Chưa có hoạt động chi tiêu nào được ghi nhận. Hãy tham gia chuyến đi để theo dõi thống kê!
        </div>
      ) : (
        /* Visual Charts */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Spend by Trip (Pie Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme">
            <div className="flex items-center gap-2 mb-6">
              <PieIcon size={18} className="text-primary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Phân bố chi tiêu theo chuyến đi</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tripSpends}
                    dataKey="totalAmount"
                    nameKey="tripName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ payload, percent }) => `${payload?.tripName || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {tripSpends.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CurrencyTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly trend (Bar Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 size={18} className="text-primary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Xu hướng chi tiêu theo tháng</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="Chi tiêu" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalStats;
