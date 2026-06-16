import React, { useState } from 'react';
import { X, Key, ArrowRight } from 'lucide-react';
import api from '../../services/api';

interface JoinTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JoinTripModal: React.FC<JoinTripModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim();
    if (!cleanCode) {
      setError('Vui lòng nhập mã mời');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Call join by invite endpoint
      await api.post(`/api/invites/${cleanCode}/join`);
      
      onSuccess();
      onClose();
      setInviteCode('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Không tìm thấy chuyến đi hoặc mã mời đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">Tham gia nhóm</h3>
            <p className="text-xs text-slate-400 mt-0.5">Nhập mã mời được bạn bè chia sẻ để tham gia</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          {/* Invite Code Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Mã mời nhóm</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Ví dụ: DAH2026 hoặc UUID..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold tracking-wider text-slate-900 dark:text-white placeholder:tracking-normal placeholder:font-normal"
                required
              />
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-sm font-bold rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition-colors text-sm font-bold rounded-xl text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/15"
            >
              {loading ? 'Đang kiểm tra...' : 'Tham gia'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinTripModal;
