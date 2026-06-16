import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, CheckCircle, Clock, XCircle, DollarSign,
  AlertCircle, ArrowRight, Eye, ShieldCheck, ShieldAlert
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import PaySettlementModal from '../PaySettlementModal';

interface Settlement {
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
  originalAmount: number;
  paidAmount: number;
  fromUserActive: boolean;
  toUserActive: boolean;
}

interface PaymentTransaction {
  id: number;
  tripId: number;
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
  proofUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface SettlementTabProps {
  tripId: string;
  isOwner: boolean;
}

const SettlementTab: React.FC<SettlementTabProps> = ({ tripId, isOwner }) => {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pay modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCreditor, setSelectedCreditor] = useState<{ id: number; name: string; amount: number } | null>(null);

  const fetchSettlementsAndTx = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [settlementsRes, txRes] = await Promise.all([
        api.get(`/api/settlements/trip/${tripId}`),
        api.get(`/api/trip/${tripId}`),
      ]);

      if (settlementsRes.data?.success) {
        setSettlements(settlementsRes.data.data || []);
      }
      if (txRes.data?.success) {
        setTransactions(txRes.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin quyết toán');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchSettlementsAndTx();
  }, [fetchSettlementsAndTx]);

  const handleApprove = async (txId: number) => {
    try {
      await api.put(`/api/payments/${txId}/approve`);
      fetchSettlementsAndTx();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể duyệt thanh toán');
    }
  };

  const handleReject = async (txId: number) => {
    try {
      await api.put(`/api/payments/${txId}/reject`);
      fetchSettlementsAndTx();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể từ chối thanh toán');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
            <CheckCircle size={10} /> Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400">
            <XCircle size={10} /> Từ chối
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse">
            <Clock size={10} /> Chờ duyệt
          </span>
        );
    }
  };

  if (loading) return <div className="py-16 text-center text-slate-400 text-sm">Đang tính toán quyết toán...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Suggested Settlements Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 px-1 flex items-center gap-2">
          <RefreshCw size={16} className="text-primary" />
          Gợi ý thanh toán tối ưu
        </h3>

        {settlements.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
            <CheckCircle className="mx-auto text-emerald-500 mb-3" size={40} />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Đã quyết toán xong!</p>
            <p className="text-xs text-slate-400 mt-1">Tất cả thành viên đã hòa hóa đơn hoặc không có nợ.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {settlements.map((s, idx) => {
              const isDebtor = s.fromUserId === user?.id;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {s.fromUserName}
                          {s.fromUserId === user?.id && <span className="text-[10px] text-primary ml-1">(Bạn)</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">Người trả nợ</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {s.toUserName}
                          {s.toUserId === user?.id && <span className="text-[10px] text-primary ml-1">(Bạn)</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">Người nhận tiền</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-rose-500">{formatCurrency(s.amount)}</p>
                      <p className="text-[9px] text-slate-400">Nợ cần trả</p>
                    </div>
                  </div>

                  {isDebtor && (
                    <button
                      onClick={() => {
                        setSelectedCreditor({ id: s.toUserId, name: s.toUserName, amount: s.amount });
                        setIsPayModalOpen(true);
                      }}
                      className="w-full py-2 bg-primary hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 transition-all active:scale-98"
                    >
                      <DollarSign size={13} />
                      <span>Thanh toán ngay</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actual Transaction History Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 px-1">
          Lịch sử giao dịch thanh toán
        </h3>

        {transactions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            Chưa có giao dịch thanh toán nào được gửi đi
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {transactions.map((tx) => {
              const canApprove = tx.status === 'PENDING' && (isOwner || tx.toUserId === user?.id);
              return (
                <div key={tx.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-base">
                      💸
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {tx.fromUserName} → {tx.toUserName}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Gửi lúc: {formatDate(tx.createdAt)}
                      </p>

                      {tx.proofUrl && (
                        <a
                          href={tx.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-bold"
                        >
                          <Eye size={10} />
                          Xem ảnh bằng chứng
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      {formatCurrency(tx.amount)}
                    </p>

                    {canApprove && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => handleReject(tx.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer border border-rose-100 dark:border-rose-900/30 flex items-center justify-center"
                          title="Từ chối"
                        >
                          <ShieldAlert size={14} />
                        </button>
                        <button
                          onClick={() => handleApprove(tx.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center"
                          title="Duyệt"
                        >
                          <ShieldCheck size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCreditor && (
        <PaySettlementModal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setSelectedCreditor(null);
          }}
          onSuccess={fetchSettlementsAndTx}
          tripId={tripId}
          creditorId={selectedCreditor.id}
          creditorName={selectedCreditor.name}
          defaultAmount={selectedCreditor.amount}
        />
      )}
    </div>
  );
};

export default SettlementTab;
