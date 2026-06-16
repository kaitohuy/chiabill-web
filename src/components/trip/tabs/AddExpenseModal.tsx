import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Users, SplitSquareVertical, Wallet, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface Member {
  userId: number;
  name: string;
  isGhost: boolean;
  isActive: boolean;
}

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface SplitRow {
  userId: number;
  name: string;
  amount: string;
  include: boolean;
}

interface ExpenseToEdit {
  id: number;
  description: string;
  totalAmount: number;
  categoryId: number;
  currency: string;
  expenseDate: string;
  payer: { id: number; name: string };
  splitType: string;
  splits: { userId: number; userName: string; amount: number; splitValue: number }[];
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tripId: string;
  members: Member[];
  expenseToEdit?: ExpenseToEdit | null;
}

const SPLIT_TYPES = [
  { key: 'EQUAL', label: 'Chia đều', icon: Users },
  { key: 'CUSTOM', label: 'Tùy chỉnh', icon: SplitSquareVertical },
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen, onClose, onSuccess, tripId, members, expenseToEdit
}) => {
  const { user } = useAuth();

  // Form state
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState<number>(user?.id || 0);
  const [splitType, setSplitType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [isFromFund, setIsFromFund] = useState(false);

  // Custom split rows
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!expenseToEdit;

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      initForm();
    }
  }, [isOpen, expenseToEdit]);

  // Rebuild split rows whenever members or splitType changes
  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && expenseToEdit?.splits && splitType === 'CUSTOM') {
      // Use existing split data
      const rows: SplitRow[] = members.map(m => {
        const existing = expenseToEdit.splits.find(s => s.userId === m.userId);
        return {
          userId: m.userId,
          name: m.name,
          amount: existing ? String(existing.amount) : '0',
          include: !!existing,
        };
      });
      setSplitRows(rows);
    } else {
      // Default: include all active members
      setSplitRows(
        members.map(m => ({
          userId: m.userId,
          name: m.name,
          amount: '',
          include: m.isActive,
        }))
      );
    }
  }, [isOpen, members, splitType]);

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/api/categories/trip/${tripId}`);
      if (res.data?.success) {
        setCategories(res.data.data || []);
        if (!categoryId && res.data.data?.length > 0 && !expenseToEdit) {
          setCategoryId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Cannot load categories:', err);
    }
  };

  const initForm = () => {
    setError('');
    if (expenseToEdit) {
      setDescription(expenseToEdit.description || '');
      setTotalAmount(String(expenseToEdit.totalAmount || ''));
      setCurrency(expenseToEdit.currency || 'VND');
      setCategoryId(expenseToEdit.categoryId || null);
      setExpenseDate(expenseToEdit.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setPayerId(expenseToEdit.payer?.id || user?.id || 0);
      setSplitType((expenseToEdit.splitType as 'EQUAL' | 'CUSTOM') || 'EQUAL');
    } else {
      setDescription('');
      setTotalAmount('');
      setCurrency('VND');
      setCategoryId(null);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setPayerId(user?.id || 0);
      setSplitType('EQUAL');
      setIsFromFund(false);
    }
  };

  if (!isOpen) return null;

  const getEqualAmount = () => {
    const includedCount = splitRows.filter(r => r.include).length;
    if (!includedCount || !totalAmount) return 0;
    return parseFloat(totalAmount) / includedCount;
  };

  const buildSplits = () => {
    if (splitType === 'EQUAL') {
      const equalAmt = getEqualAmount();
      return splitRows
        .filter(r => r.include)
        .map(r => ({
          userId: r.userId,
          amount: equalAmt,
          splitValue: equalAmt,
        }));
    } else {
      return splitRows
        .filter(r => r.include && parseFloat(r.amount) > 0)
        .map(r => ({
          userId: r.userId,
          amount: parseFloat(r.amount),
          splitValue: parseFloat(r.amount),
        }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return setError('Vui lòng nhập mô tả khoản chi');
    if (!totalAmount || parseFloat(totalAmount) <= 0) return setError('Số tiền phải lớn hơn 0');
    if (!payerId) return setError('Vui lòng chọn người trả');

    const splits = buildSplits();
    if (splitType === 'CUSTOM') {
      const splitTotal = splits.reduce((s, r) => s + r.amount, 0);
      if (Math.abs(splitTotal - parseFloat(totalAmount)) > 1) {
        return setError(`Tổng chia (${splitTotal.toLocaleString()}) ≠ tổng chi tiêu (${parseFloat(totalAmount).toLocaleString()})`);
      }
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        tripId: parseInt(tripId),
        payerId,
        totalAmount: parseFloat(totalAmount),
        description,
        categoryId,
        expenseDate: `${expenseDate}T12:00:00`,
        currency,
        exchangeRate: 1,
        isFromFund,
        splitType,
        splits,
        clientUuid: `web-${Date.now()}`,
      };

      if (isEditMode) {
        await api.put(`/api/expenses/${expenseToEdit!.id}`, payload);
      } else {
        await api.post('/api/expenses', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu khoản chi');
    } finally {
      setLoading(false);
    }
  };

  const toggleSplitRow = (userId: number) => {
    setSplitRows(prev => prev.map(r => r.userId === userId ? { ...r, include: !r.include } : r));
  };

  const updateSplitAmount = (userId: number, val: string) => {
    setSplitRows(prev => prev.map(r => r.userId === userId ? { ...r, amount: val } : r));
  };

  const activeMembers = members.filter(m => m.isActive);
  const includedCount = splitRows.filter(r => r.include).length;
  const equalAmount = getEqualAmount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 flex-shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              {isEditMode ? 'Sửa khoản chi' : 'Thêm khoản chi'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? 'Cập nhật thông tin khoản chi' : 'Ghi nhận chi tiêu chuyến đi'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 cursor-pointer transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mô tả *</label>
            <input
              type="text"
              placeholder="VD: Ăn tối tại nhà hàng Mười"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Số tiền *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="number"
                  placeholder="0"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiền tệ</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="THB">THB</option>
              </select>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Danh mục</label>
              <select
                value={categoryId || ''}
                onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- Chọn --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày chi</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Payer */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Người trả *</label>
            <select
              value={payerId}
              onChange={e => setPayerId(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
            >
              {activeMembers.map(m => (
                <option key={m.userId} value={m.userId}>
                  {m.name}{m.userId === user?.id ? ' (Bạn)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* From Fund toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
            <div
              onClick={() => setIsFromFund(prev => !prev)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${isFromFund ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isFromFund ? 'translate-x-4.5' : 'translate-x-0'}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Wallet size={12} />
                Chi từ quỹ nhóm
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500">Khoản này được chi từ quỹ chung của nhóm</p>
            </div>
          </label>

          {/* Split Type */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cách chia tiền</label>
            <div className="flex gap-2">
              {SPLIT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setSplitType(type.key as 'EQUAL' | 'CUSTOM')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      splitType === type.key
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary'
                    }`}
                  >
                    <Icon size={14} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Chia cho ({includedCount}/{splitRows.length} người)
              </label>
              {splitType === 'EQUAL' && totalAmount && (
                <span className="text-[11px] text-primary font-bold">
                  {new Intl.NumberFormat('vi-VN').format(equalAmount)}/người
                </span>
              )}
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {splitRows.map(row => (
                <div key={row.userId} className="flex items-center gap-3 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={() => toggleSplitRow(row.userId)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {row.name}
                    {row.userId === user?.id && <span className="text-[10px] text-primary ml-1">(Bạn)</span>}
                  </span>
                  {splitType === 'EQUAL' ? (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-24 text-right">
                      {row.include && totalAmount
                        ? new Intl.NumberFormat('vi-VN').format(equalAmount)
                        : '—'}
                    </span>
                  ) : (
                    <input
                      type="number"
                      placeholder="0"
                      value={row.amount}
                      disabled={!row.include}
                      onChange={e => updateSplitAmount(row.userId, e.target.value)}
                      className="w-28 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                    />
                  )}
                </div>
              ))}
            </div>
            {splitType === 'CUSTOM' && totalAmount && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Tổng đã chia:</span>
                <span className={`font-bold ${
                  Math.abs(splitRows.filter(r => r.include).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0) - parseFloat(totalAmount)) < 1
                    ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {new Intl.NumberFormat('vi-VN').format(
                    splitRows.filter(r => r.include).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
                  )} / {new Intl.NumberFormat('vi-VN').format(parseFloat(totalAmount) || 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-primary hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-500/20"
          >
            {loading ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Thêm khoản chi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
