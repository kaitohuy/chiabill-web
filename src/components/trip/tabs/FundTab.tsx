import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, CheckCircle, Clock, AlertCircle, Crown } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface FundTabProps {
  tripId: string;
  isOwner: boolean;
  members: { userId: number; name: string; isActive: boolean }[];
}

interface FundInfo {
  id: number;
  tripId: number;
  balance: number;
  currency: string;
  alertThreshold: number;
  treasurer: { id: number; name: string; avatarUrl?: string } | null;
}

interface Contribution {
  id: number;
  memberId: number;
  memberName: string;
  type: 'REQUIRED' | 'VOLUNTARY';
  amount: number;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
}

const FundTab: React.FC<FundTabProps> = ({ tripId, isOwner }) => {
  const { user } = useAuth();
  const [fund, setFund] = useState<FundInfo | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contribution form
  const [showContribForm, setShowContribForm] = useState(false);
  const [contribAmount, setContribAmount] = useState('');
  const [contribLoading, setContribLoading] = useState(false);

  // Activate fund form (for owners without fund)
  const [showActivateForm, setShowActivateForm] = useState(false);
  const [activateThreshold, setActivateThreshold] = useState('');

  const formatCurrency = (val: number, cur = 'VND') =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: cur === 'VND' ? 'VND' : 'VND' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fetchFund = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [fundRes, contribRes] = await Promise.all([
        api.get(`/api/trips/${tripId}/fund`),
        api.get(`/api/trips/${tripId}/fund/contributions`),
      ]);
      if (fundRes.data?.success) setFund(fundRes.data.data);
      if (contribRes.data?.success) setContributions(contribRes.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setFund(null); // Fund not activated yet
      } else {
        setError(err.response?.data?.message || 'Không thể tải thông tin quỹ');
      }
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchFund();
  }, [fetchFund]);

  const handleActivateFund = async () => {
    try {
      setContribLoading(true);
      await api.post(`/api/trips/${tripId}/fund/activate`, {
        alertThreshold: activateThreshold ? parseFloat(activateThreshold) : 0,
        treasurerId: user?.id,
      });
      setShowActivateForm(false);
      fetchFund();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi kích hoạt quỹ');
    } finally {
      setContribLoading(false);
    }
  };

  const handleVoluntaryContrib = async () => {
    if (!contribAmount || parseFloat(contribAmount) <= 0) return;
    try {
      setContribLoading(true);
      await api.post(`/api/trips/${tripId}/fund/contributions/voluntary`, {
        amount: parseFloat(contribAmount),
        note: 'Đóng quỹ tự nguyện',
      });
      setContribAmount('');
      setShowContribForm(false);
      fetchFund();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi đóng quỹ');
    } finally {
      setContribLoading(false);
    }
  };

  const handleConfirmContrib = async (contribId: number) => {
    try {
      await api.post(`/api/trips/${tripId}/fund/contributions/${contribId}/confirm`);
      fetchFund();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi xác nhận');
    }
  };

  if (loading) return <div className="py-16 text-center text-slate-400 text-sm">Đang tải thông tin quỹ...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Fund not activated */}
      {!fund && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
          <Wallet className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={52} />
          <p className="font-bold text-slate-700 dark:text-slate-300">Quỹ nhóm chưa được kích hoạt</p>
          <p className="text-sm text-slate-400 mt-1.5 mb-5">Quỹ nhóm cho phép thành viên đóng góp vào một quỹ chung để chi tiêu.</p>
          {isOwner && !showActivateForm && (
            <button
              onClick={() => setShowActivateForm(true)}
              className="px-5 py-2.5 bg-primary hover:bg-emerald-600 text-white text-sm font-bold rounded-xl cursor-pointer shadow-md shadow-emerald-500/20 transition-colors"
            >
              Kích hoạt quỹ nhóm
            </button>
          )}
          {isOwner && showActivateForm && (
            <div className="max-w-sm mx-auto space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Ngưỡng cảnh báo quỹ thấp (VND)</label>
                <input
                  type="number"
                  placeholder="VD: 500000"
                  value={activateThreshold}
                  onChange={e => setActivateThreshold(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowActivateForm(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Hủy</button>
                <button onClick={handleActivateFund} disabled={contribLoading} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50">
                  {contribLoading ? 'Đang kích hoạt...' : 'Kích hoạt'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fund activated */}
      {fund && (
        <>
          {/* Fund Balance Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider">Số dư quỹ nhóm</p>
                <p className="text-3xl font-black mt-1">{formatCurrency(fund.balance)}</p>
                {fund.alertThreshold > 0 && (
                  <p className="text-white/60 text-xs mt-1">
                    ⚠️ Cảnh báo khi dưới {formatCurrency(fund.alertThreshold)}
                  </p>
                )}
              </div>
              <Wallet className="text-white/30" size={40} />
            </div>
            {fund.treasurer && (
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                <Crown size={13} className="text-white/60" />
                <p className="text-white/70 text-xs">
                  Thủ quỹ: <span className="text-white font-bold">{fund.treasurer.name}</span>
                  {fund.treasurer.id === user?.id && ' (Bạn)'}
                </p>
              </div>
            )}
          </div>

          {/* Voluntary Contribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Đóng quỹ tự nguyện</p>
              {!showContribForm && (
                <button
                  onClick={() => setShowContribForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  <Plus size={13} />
                  Đóng quỹ
                </button>
              )}
            </div>
            {showContribForm && (
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Nhập số tiền đóng quỹ (VND)"
                  value={contribAmount}
                  onChange={e => setContribAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowContribForm(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Hủy</button>
                  <button onClick={handleVoluntaryContrib} disabled={contribLoading} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50">
                    {contribLoading ? 'Đang xử lý...' : 'Xác nhận đóng quỹ'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contributions List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Lịch sử đóng quỹ ({contributions.length})</p>
            </div>
            {contributions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Chưa có lịch sử đóng quỹ</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {contributions.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        c.status === 'CONFIRMED' ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-amber-100 dark:bg-amber-950/30'
                      }`}>
                        {c.status === 'CONFIRMED'
                          ? <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                          : <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{c.memberName}</p>
                        <p className="text-xs text-slate-400">{formatDate(c.createdAt)} · {c.type === 'VOLUNTARY' ? 'Tự nguyện' : 'Bắt buộc'}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(c.amount)}</p>
                      {c.status === 'PENDING' && (isOwner || fund.treasurer?.id === user?.id) && (
                        <button
                          onClick={() => handleConfirmContrib(c.id)}
                          className="text-[10px] px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Xác nhận
                        </button>
                      )}
                      {c.status === 'PENDING' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          Chờ duyệt
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FundTab;
