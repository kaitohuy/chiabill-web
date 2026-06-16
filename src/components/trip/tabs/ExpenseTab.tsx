import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Edit, DollarSign, Calendar, Tag, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import AddExpenseModal from './AddExpenseModal';

interface SplitItem {
  userId: number;
  userName: string;
  amount: number;
  splitValue: number;
}

interface Expense {
  id: number;
  tripId: number;
  totalAmount: number;
  description: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  currency: string;
  exchangeRate: number;
  expenseDate: string;
  payer: { id: number; name: string; avatarUrl?: string };
  isFromFund: boolean;
  splitType: string;
  splits: SplitItem[];
}

interface ExpenseTabProps {
  tripId: string;
  members: { userId: number; name: string; isGhost: boolean; isActive: boolean }[];
  isOwner: boolean;
}

const ExpenseTab: React.FC<ExpenseTabProps> = ({ tripId, members, isOwner }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Summary stats
  const totalAmount = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const myPaid = expenses.filter(e => e.payer?.id === user?.id).reduce((sum, e) => sum + e.totalAmount, 0);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/expenses/trip/${tripId}`);
      if (res.data?.success) {
        setExpenses(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải khoản chi');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (expenseId: number) => {
    if (!window.confirm('Xóa khoản chi này?')) return;
    try {
      await api.delete(`/api/expenses/${expenseId}`);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa khoản chi');
    }
  };

  const formatCurrency = (val: number, currency = 'VND') => {
    if (currency === 'VND' || !currency) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    }
    return `${val.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filtered = expenses.filter(e =>
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.payer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tổng chi tiêu</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{expenses.length} khoản chi</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tôi đã trả</p>
          <p className="text-lg font-black text-primary mt-1">{formatCurrency(myPaid)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{expenses.filter(e => e.payer?.id === user?.id).length} khoản</p>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
          <button
            onClick={() => { setExpenseToEdit(null); setIsAddModalOpen(true); }}
            className="w-full sm:w-auto px-5 py-3 bg-primary hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>Thêm khoản chi</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Tìm khoản chi theo tên, danh mục, người trả..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white shadow-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Đang tải khoản chi...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <DollarSign className="mx-auto text-slate-200 dark:text-slate-800 mb-3" size={48} />
          <p className="font-semibold text-slate-600 dark:text-slate-400">
            {searchQuery ? 'Không tìm thấy khoản chi phù hợp' : 'Chưa có khoản chi nào'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              + Thêm khoản chi đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((expense) => {
            const isMyExpense = expense.payer?.id === user?.id;
            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Category Icon */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-lg">
                      {expense.categoryIcon || '💰'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[180px]">
                          {expense.description || '(Không có mô tả)'}
                        </p>
                        {expense.isFromFund && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            Từ quỹ
                          </span>
                        )}
                        {expense.splitType === 'EQUAL' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Chia đều
                          </span>
                        )}
                        {expense.splitType === 'CUSTOM' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                            Chia tùy chỉnh
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Tag size={11} />
                          {expense.categoryName || 'Chưa phân loại'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(expense.expenseDate)}
                        </span>
                        <span>
                          👤 {expense.payer?.name}
                          {isMyExpense && <span className="text-primary ml-1 font-semibold">(bạn)</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-base font-black text-slate-800 dark:text-white">
                        {formatCurrency(expense.totalAmount, expense.currency)}
                      </p>
                      {expense.currency && expense.currency !== 'VND' && expense.exchangeRate > 0 && (
                        <p className="text-[10px] text-slate-400">
                          ≈ {formatCurrency(expense.totalAmount * expense.exchangeRate)}
                        </p>
                      )}
                    </div>

                    {/* Actions (only payer or owner can edit/delete) */}
                    {(isMyExpense || isOwner) && (
                      <div className="flex items-center gap-1 pt-0.5">
                        <button
                          onClick={() => { setExpenseToEdit(expense); setIsAddModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Splits preview */}
                {expense.splits && expense.splits.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chia cho:</span>
                    {expense.splits.slice(0, 4).map((split, idx) => (
                      <span key={idx} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg font-medium">
                        {split.userName} {formatCurrency(split.amount)}
                      </span>
                    ))}
                    {expense.splits.length > 4 && (
                      <span className="text-[11px] text-slate-400">+{expense.splits.length - 4} người khác</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setExpenseToEdit(null); }}
        onSuccess={fetchExpenses}
        tripId={tripId}
        members={members}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};

export default ExpenseTab;
