import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import api from '../../../services/api';

interface TripStatsTabProps {
  tripId: string;
}

interface CategoryStat {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  totalAmount: number;
}

interface Expense {
  id: number;
  totalAmount: number;
  description: string;
  expenseDate: string;
  payer: { id: number; name: string };
  splits: { userId: number; userName: string; amount: number }[];
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#a855f7'
];

const TripStatsTab: React.FC<TripStatsTabProps> = ({ tripId }) => {
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // 1. Fetch category stats
        const catRes = await api.get(`/api/expenses/trip/${tripId}/stats`);
        const catData = catRes.data?.data || [];
        setCategoryStats(catData);

        // 2. Fetch full expenses to compute member & daily stats
        const expRes = await api.get(`/api/expenses/trip/${tripId}`);
        const expData = expRes.data?.data || [];
        setExpenses(expData);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, [tripId]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Đang tổng hợp dữ liệu thống kê...</p>
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

  // 1. General Metrics
  const totalSpend = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalCount = expenses.length;
  const avgSpend = totalCount > 0 ? totalSpend / totalCount : 0;

  // 2. Calculate Member Paid vs Spent
  const memberMap: { [name: string]: { paid: number; spent: number } } = {};
  
  expenses.forEach(e => {
    // Paid by payer
    if (e.payer) {
      const payerName = e.payer.name;
      if (!memberMap[payerName]) memberMap[payerName] = { paid: 0, spent: 0 };
      memberMap[payerName].paid += e.totalAmount;
    }
    // Spent by split users
    if (e.splits) {
      e.splits.forEach(s => {
        const userName = s.userName;
        if (!memberMap[userName]) memberMap[userName] = { paid: 0, spent: 0 };
        memberMap[userName].spent += s.amount;
      });
    }
  });

  const memberData = Object.keys(memberMap).map(name => ({
    name,
    'Đã trả (Paid)': memberMap[name].paid,
    'Chi tiêu (Spent)': memberMap[name].spent
  }));

  // 3. Daily Spending Trend
  const dailyMap: { [date: string]: number } = {};
  expenses.forEach(e => {
    if (e.expenseDate) {
      const dateStr = e.expenseDate.split('T')[0];
      const d = new Date(dateStr);
      const formattedDate = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      dailyMap[formattedDate] = (dailyMap[formattedDate] || 0) + e.totalAmount;
    }
  });

  // Sort daily data chronologically
  const dailyData = Object.keys(dailyMap)
    .map(date => ({ date, 'Chi tiêu': dailyMap[date] }))
    .reverse(); // Standard reverse to keep chronological order if fetched DESC

  // Custom tooltips
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

  const MultiTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-white mb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="font-semibold" style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Visual Quick Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Tổng chuyến đi</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(totalSpend)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Số khoản chi tiêu</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{totalCount} khoản</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-theme flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Chi tiêu trung bình</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(avgSpend)}</span>
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm">
          Chưa có chi tiêu để hiển thị biểu đồ thống kê.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Category breakdown (Pie Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon size={18} className="text-primary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Phân bố chi tiêu theo danh mục</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="totalAmount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ payload, percent }) => `${payload?.categoryName || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CurrencyTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member balance comparison (Bar Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-primary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Thống kê trả tiền vs Chi tiêu</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<MultiTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Đã trả (Paid)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chi tiêu (Spent)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily spending trend (Area Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-primary" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Xu hướng chi tiêu theo thời gian</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Area type="monotone" dataKey="Chi tiêu" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripStatsTab;
