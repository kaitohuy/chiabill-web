import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, Upload } from 'lucide-react';
import api from '../../services/api';

interface PaySettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tripId: string;
  creditorId: number;
  creditorName: string;
  defaultAmount: number;
}

const PaySettlementModal: React.FC<PaySettlementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tripId,
  creditorId,
  creditorName,
  defaultAmount,
}) => {
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(String(defaultAmount));
      setProofFile(null);
      setPreviewUrl(null);
      setError('');
    }
  }, [isOpen, defaultAmount]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      return setError('Vui lòng nhập số tiền hợp lệ');
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('toUserId', String(creditorId));
      formData.append('amount', amount);
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      await api.post(`/api/trips/${tripId}/payments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể ghi nhận thanh toán');
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
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Thanh toán nợ</h3>
            <p className="text-xs text-slate-400 mt-0.5">Trả tiền cho {creditorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Creditor */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Người nhận</label>
            <input
              type="text"
              readOnly
              value={creditorName}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Số tiền (VND) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Proof Upload */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bằng chứng chuyển tiền</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/20 text-center relative group hover:border-primary transition-colors">
              {previewUrl ? (
                <div className="relative w-full max-h-40 overflow-hidden rounded-xl">
                  <img src={previewUrl} alt="Proof preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => { setProofFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-4">
                  <Upload className="text-slate-400 group-hover:text-primary mb-2 transition-colors" size={24} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Chọn ảnh từ máy tính</span>
                  <span className="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG, GIF</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
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
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaySettlementModal;
