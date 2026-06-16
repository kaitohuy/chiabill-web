import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Users, Wallet, RefreshCw, BarChart, History,
  Calendar, Hash, Crown, UserX, Copy, Check, ExternalLink, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ExpenseTab from '../../components/trip/tabs/ExpenseTab';
import FundTab from '../../components/trip/tabs/FundTab';
import HistoryTab from '../../components/trip/tabs/HistoryTab';
import SettlementTab from '../../components/trip/tabs/SettlementTab';
import ItineraryTab from '../../components/trip/tabs/ItineraryTab';
import TripStatsTab from '../../components/trip/tabs/TripStatsTab';

type TripTab = 'expenses' | 'members' | 'fund' | 'settlements' | 'itinerary' | 'stats' | 'history';

interface TripMember {
  userId: number;
  name: string;
  avatarUrl?: string;
  role: 'OWNER' | 'MEMBER';
  isActive: boolean;
  isGhost: boolean;
  email?: string;
}

interface TripDetail {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  ownerId: number;
  totalBudget: number;
  categoryName: string;
  categoryIcon: string;
  coverUrl?: string;
  members: TripMember[];
}

interface ActiveInvite {
  inviteId: string;
  expiresAt?: string;
}

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TripTab>('expenses');

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeInvite, setActiveInvite] = useState<ActiveInvite | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'expenses',    label: 'Chi tiêu',    icon: DollarSign },
    { id: 'members',     label: 'Thành viên',  icon: Users },
    { id: 'fund',        label: 'Quỹ nhóm',    icon: Wallet },
    { id: 'settlements', label: 'Quyết toán',  icon: RefreshCw },
    { id: 'itinerary',   label: 'Lịch trình',  icon: Calendar },
    { id: 'stats',       label: 'Thống kê',    icon: BarChart },
    { id: 'history',     label: 'Lịch sử',     icon: History },
  ];

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/trips/${tripId}`);
      if (res.data?.success) setTrip(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin chuyến đi');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const fetchOrCreateInvite = async () => {
    if (!tripId) return;
    try {
      setInviteLoading(true);
      const res = await api.get(`/api/trips/${tripId}/invites/active`);
      if (res.data?.success && res.data.data) {
        const invite = res.data.data;
        setActiveInvite({
          ...invite,
          inviteId: invite.inviteCode || invite.inviteId
        });
      } else {
        const createRes = await api.post(`/api/trips/${tripId}/invites`, { maxUses: null });
        if (createRes.data?.success && createRes.data.data) {
          const invite = createRes.data.data;
          setActiveInvite({
            ...invite,
            inviteId: invite.inviteCode || invite.inviteId
          });
        }
      }
    } catch {
      try {
        const createRes = await api.post(`/api/trips/${tripId}/invites`, { maxUses: null });
        if (createRes.data?.success && createRes.data.data) {
          const invite = createRes.data.data;
          setActiveInvite({
            ...invite,
            inviteId: invite.inviteCode || invite.inviteId
          });
        }
      } catch (createErr) {
        console.error('Cannot create invite:', createErr);
      }
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  useEffect(() => {
    if (activeTab === 'members' && !activeInvite) fetchOrCreateInvite();
  }, [activeTab]);

  const copyInviteCode = () => {
    if (activeInvite?.inviteId) {
      navigator.clipboard.writeText(activeInvite.inviteId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDate = (dateStr: string) => (dateStr ? dateStr.split('T')[0] : '');

  const isOwner = trip?.ownerId === user?.id;

  // Flatten members for child tabs (only include active & ghost for split)
  const memberList = (trip?.members || []).map(m => ({
    userId: m.userId,
    name: m.name,
    isGhost: m.isGhost,
    isActive: m.isActive,
    email: m.email,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Đang tải thông tin chuyến đi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto text-rose-400" size={48} />
          <p className="font-bold text-slate-700 dark:text-slate-300">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold cursor-pointer">
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mt-1 flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-slate-800 dark:text-white truncate">{trip?.name || 'Chi tiết chuyến đi'}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(trip?.startDate || '')} – {formatDate(trip?.endDate || '')}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Hash size={12} />
              ID: {tripId}
            </span>
            {trip?.categoryName && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                {trip.categoryName}
              </span>
            )}
            {isOwner && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 flex items-center gap-1">
                <Crown size={10} />
                Trưởng nhóm
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Budget banner */}
      {trip?.totalBudget && trip.totalBudget > 0 && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl px-5 py-3">
          <Wallet className="text-emerald-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ngân sách dự kiến</p>
            <p className="text-base font-black text-emerald-800 dark:text-emerald-300">{formatCurrency(trip.totalBudget)}</p>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1 pt-1 -mx-1 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TripTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {/* ===== EXPENSES ===== */}
        {activeTab === 'expenses' && tripId && (
          <ExpenseTab tripId={tripId} members={memberList} isOwner={isOwner} />
        )}

        {/* ===== MEMBERS ===== */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {isOwner && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Mã mời tham gia nhóm</p>
                {inviteLoading ? (
                  <p className="text-sm text-slate-400">Đang tạo mã mời...</p>
                ) : activeInvite?.inviteId ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 font-mono text-sm font-bold text-slate-800 dark:text-white tracking-widest truncate">
                      {activeInvite.inviteId}
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                        copied
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                ) : (
                  <button onClick={fetchOrCreateInvite} className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <ExternalLink size={13} />
                    Tạo mã mời mới
                  </button>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Danh sách thành viên ({trip?.members?.length || 0})
                </p>
              </div>
              {!trip?.members || trip.members.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Chưa có thành viên</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {trip.members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {member.name}
                            {member.userId === user?.id && (
                              <span className="ml-2 text-[10px] font-semibold text-primary">(Bạn)</span>
                            )}
                          </p>
                          {member.email && <p className="text-xs text-slate-400">{member.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isGhost && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Ảo</span>
                        )}
                        {member.role === 'OWNER' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 flex items-center gap-1">
                            <Crown size={10} />Trưởng nhóm
                          </span>
                        ) : !member.isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 flex items-center gap-1">
                            <UserX size={10} />Bị khóa
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Thành viên</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== FUND ===== */}
        {activeTab === 'fund' && tripId && (
          <FundTab tripId={tripId} isOwner={isOwner} members={memberList} />
        )}

        {/* ===== SETTLEMENTS ===== */}
        {activeTab === 'settlements' && tripId && (
          <SettlementTab tripId={tripId} isOwner={isOwner} />
        )}

        {/* ===== ITINERARY ===== */}
        {activeTab === 'itinerary' && tripId && (
          <ItineraryTab tripId={tripId} startDate={trip?.startDate} endDate={trip?.endDate} />
        )}

        {/* ===== STATS ===== */}
        {activeTab === 'stats' && tripId && (
          <TripStatsTab tripId={tripId} />
        )}

        {/* ===== HISTORY ===== */}
        {activeTab === 'history' && tripId && (
          <HistoryTab tripId={tripId} />
        )}
      </div>
    </div>
  );
};

export default TripDetails;
