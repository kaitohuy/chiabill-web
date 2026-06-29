import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, AlertTriangle, MapPin, Trash2, Check, X, Plus, Edit3, 
  Search, ArrowLeft, ArrowRight, Megaphone, Copy, Power, Smartphone
} from 'lucide-react';
import api from '../../services/api';

type AdminTab = 'feedbacks' | 'place-reports' | 'places' | 'comments' | 'announcements';

interface AppAnnouncement {
  id: number;
  type: 'UPDATE' | 'ANNOUNCEMENT' | 'PAYMENT' | 'DONATE' | 'PROMOTION' | 'MAINTENANCE';
  title: string;
  content?: string;
  imageUrl?: string;
  actionType: 'NONE' | 'OPEN_URL' | 'OPEN_STORE' | 'OPEN_SCREEN' | 'DISMISS';
  actionUrl?: string;
  actionLabel?: string;
  actionLabelEn?: string;
  minVersion?: number;
  latestVersion?: number;
  isForceUpdate?: boolean;
  qrImageUrl?: string;
  bankInfo?: string;
  suggestedAmount?: number;
  platform: 'ALL' | 'ANDROID' | 'IOS';
  priority: number;
  isDismissible: boolean;
  displayMode: 'ONCE' | 'EVERY_LAUNCH' | 'DAILY' | 'ALWAYS';
  isActive: boolean;
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

interface Feedback {
  id: number;
  userEmail: string;
  content: string;
  createdAt: string;
}

interface PlaceReport {
  id: number;
  placeId: number;
  placeName: string;
  placeCategory: string;
  placeCity: string;
  userId: number;
  userName: string;
  reportType: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Place {
  id: number;
  name: string;
  nameEn?: string;
  category: string;
  latitude: number;
  longitude: number;
  city: string;
  cityEn?: string;
  summary?: string;
  summaryEn?: string;
  ticketPrices?: string;
  ticketPricesEn?: string;
  openingHours?: string;
  openingHoursEn?: string;
  imageUrls: string[];
}

interface Comment {
  id: number;
  placeId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('feedbacks');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [fbPage, setFbPage] = useState(0);
  const [fbTotalPages, setFbTotalPages] = useState(1);

  // Reports state
  const [reports, setReports] = useState<PlaceReport[]>([]);
  const [repPage, setRepPage] = useState(0);
  const [repTotalPages, setRepTotalPages] = useState(1);

  // Places state
  const [places, setPlaces] = useState<Place[]>([]);
  const [placePage, setPlacePage] = useState(0);
  const [placeTotalPages, setPlaceTotalPages] = useState(1);
  const [placeSearch, setPlaceSearch] = useState('');

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commPage, setCommPage] = useState(0);
  const [commTotalPages, setCommTotalPages] = useState(1);

  // Announcements state
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([]);
  const [annPage, setAnnPage] = useState(0);

  // Announcements Filters
  const [annSearch, setAnnSearch] = useState('');
  const [annTypeFilter, setAnnTypeFilter] = useState<string>('ALL');
  const [annPlatformFilter, setAnnPlatformFilter] = useState<string>('ALL');
  const [annStatusFilter, setAnnStatusFilter] = useState<string>('ALL');
  const [annStartDate, setAnnStartDate] = useState('');
  const [annEndDate, setAnnEndDate] = useState('');

  // Modal Announcement Form state
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<AppAnnouncement | null>(null);
  const [annForm, setAnnForm] = useState({
    type: 'ANNOUNCEMENT' as AppAnnouncement['type'],
    title: '',
    content: '',
    imageUrl: '',
    actionType: 'NONE' as AppAnnouncement['actionType'],
    actionUrl: '',
    actionLabel: '',
    actionLabelEn: '',
    minVersion: '' as string | number,
    latestVersion: '' as string | number,
    isForceUpdate: false,
    qrImageUrl: '',
    bankName: '',
    bankAccount: '',
    bankOwner: '',
    suggestedAmount: '' as string | number,
    platform: 'ALL' as AppAnnouncement['platform'],
    priority: 0,
    isDismissible: true,
    displayMode: 'ONCE' as AppAnnouncement['displayMode'],
    isActive: true,
    startAt: '',
    endAt: ''
  });

  // Modal Place forms
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [placeForm, setPlaceForm] = useState({
    name: '',
    nameEn: '',
    category: 'Địa danh',
    latitude: 16.047,
    longitude: 108.206,
    city: 'Đà Nẵng',
    cityEn: '',
    summary: '',
    summaryEn: '',
    ticketPrices: 'Miễn phí',
    ticketPricesEn: '',
    openingHours: 'Mở cửa cả ngày',
    openingHoursEn: '',
    imageUrls: ['']
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 1. Fetch Feedbacks
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/feedbacks?page=${fbPage}&size=10`);
      if (res.data?.success) {
        setFeedbacks(res.data.data?.content || []);
        setFbTotalPages(res.data.data?.totalPages || 1);
      }
    } catch {
      setError('Lỗi khi tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  }, [fbPage]);

  // 2. Fetch Reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/v1/places/reports?page=${repPage}&size=10`);
      if (res.data?.success) {
        setReports(res.data.data?.content || []);
        setRepTotalPages(res.data.data?.totalPages || 1);
      }
    } catch {
      setError('Lỗi khi tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, [repPage]);

  // 3. Fetch Places
  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let res;
      if (placeSearch) {
        res = await api.get(`/api/v1/places/search?keyword=${encodeURIComponent(placeSearch)}&page=${placePage}&size=10`);
      } else {
        res = await api.get(`/api/v1/places?page=${placePage}&size=10`);
      }
      if (res.data?.success) {
        setPlaces(res.data.data?.content || []);
        setPlaceTotalPages(res.data.data?.totalPages || 1);
      }
    } catch {
      setError('Lỗi khi tải danh sách địa điểm');
    } finally {
      setLoading(false);
    }
  }, [placePage, placeSearch]);

  // 4. Fetch Comments
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/v1/places/admin/comments?page=${commPage}&size=10`);
      if (res.data?.success) {
        setComments(res.data.data?.content || []);
        setCommTotalPages(res.data.data?.totalPages || 1);
      }
    } catch {
      setError('Lỗi khi tải danh sách bình luận');
    } finally {
      setLoading(false);
    }
  }, [commPage]);

  // 5. Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Load 100 recent announcements to allow for comprehensive client-side filtering, search, and custom pagination
      const res = await api.get(`/api/announcements?page=0&size=100`);
      if (res.data?.success) {
        setAnnouncements(res.data.data?.content || []);
      }
    } catch {
      setError('Lỗi khi tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  }, []);

  // Action: Toggle Announcement Active Status
  const handleToggleAnnouncementActive = async (id: number) => {
    try {
      const res = await api.patch(`/api/announcements/${id}/toggle`);
      if (res.data?.success) {
        showSuccess('Cập nhật trạng thái thông báo thành công');
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
      }
    } catch {
      setError('Lỗi khi cập nhật trạng thái thông báo');
    }
  };

  // Action: Delete Announcement
  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa thông báo này? Người dùng sẽ không thể nhìn thấy nữa.')) return;
    try {
      const res = await api.delete(`/api/announcements/${id}`);
      if (res.data?.success) {
        showSuccess('Xóa thông báo thành công');
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    } catch {
      setError('Lỗi khi xóa thông báo');
    }
  };

  // Announcement Modal Form Handlers
  const openAddAnnModal = () => {
    setEditingAnn(null);
    setAnnForm({
      type: 'ANNOUNCEMENT',
      title: '',
      content: '',
      imageUrl: '',
      actionType: 'NONE',
      actionUrl: '',
      actionLabel: '',
      actionLabelEn: '',
      minVersion: '',
      latestVersion: '',
      isForceUpdate: false,
      qrImageUrl: '',
      bankName: '',
      bankAccount: '',
      bankOwner: '',
      suggestedAmount: '',
      platform: 'ALL',
      priority: 0,
      isDismissible: true,
      displayMode: 'ONCE',
      isActive: true,
      startAt: '',
      endAt: ''
    });
    setIsAnnModalOpen(true);
  };

  const openEditAnnModal = (ann: AppAnnouncement) => {
    setEditingAnn(ann);
    let bankObj = { bank: '', account: '', name: '' };
    if (ann.bankInfo) {
      try {
        bankObj = JSON.parse(ann.bankInfo);
      } catch {
        // Ignore JSON parse errors
      }
    }
    setAnnForm({
      type: ann.type,
      title: ann.title,
      content: ann.content || '',
      imageUrl: ann.imageUrl || '',
      actionType: ann.actionType || 'NONE',
      actionUrl: ann.actionUrl || '',
      actionLabel: ann.actionLabel || '',
      actionLabelEn: ann.actionLabelEn || '',
      minVersion: ann.minVersion ?? '',
      latestVersion: ann.latestVersion ?? '',
      isForceUpdate: !!ann.isForceUpdate,
      qrImageUrl: ann.qrImageUrl || '',
      bankName: bankObj.bank || '',
      bankAccount: bankObj.account || '',
      bankOwner: bankObj.name || '',
      suggestedAmount: ann.suggestedAmount ?? '',
      platform: ann.platform || 'ALL',
      priority: ann.priority || 0,
      isDismissible: ann.isDismissible !== false,
      displayMode: ann.displayMode || 'ONCE',
      isActive: ann.isActive !== false,
      startAt: ann.startAt ? ann.startAt.substring(0, 16) : '',
      endAt: ann.endAt ? ann.endAt.substring(0, 16) : ''
    });
    setIsAnnModalOpen(true);
  };

  const openRepublishAnnouncement = (ann: AppAnnouncement) => {
    setEditingAnn(null);
    let bankObj = { bank: '', account: '', name: '' };
    if (ann.bankInfo) {
      try {
        bankObj = JSON.parse(ann.bankInfo);
      } catch {
        // Ignore JSON parse errors
      }
    }
    setAnnForm({
      type: ann.type,
      title: `${ann.title} (Bản sao)`,
      content: ann.content || '',
      imageUrl: ann.imageUrl || '',
      actionType: ann.actionType || 'NONE',
      actionUrl: ann.actionUrl || '',
      actionLabel: ann.actionLabel || '',
      actionLabelEn: ann.actionLabelEn || '',
      minVersion: ann.minVersion ?? '',
      latestVersion: ann.latestVersion ?? '',
      isForceUpdate: !!ann.isForceUpdate,
      qrImageUrl: ann.qrImageUrl || '',
      bankName: bankObj.bank || '',
      bankAccount: bankObj.account || '',
      bankOwner: bankObj.name || '',
      suggestedAmount: ann.suggestedAmount ?? '',
      platform: ann.platform || 'ALL',
      priority: ann.priority || 0,
      isDismissible: ann.isDismissible !== false,
      displayMode: ann.displayMode || 'ONCE',
      isActive: true,
      startAt: '',
      endAt: ''
    });
    setIsAnnModalOpen(true);
    showSuccess('Đã sao chép nội dung thông báo. Hãy chỉnh sửa thời gian và lưu lại.');
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      let bankInfoStr = '';
      if (annForm.type === 'PAYMENT' || annForm.type === 'DONATE') {
        if (annForm.bankName || annForm.bankAccount || annForm.bankOwner) {
          bankInfoStr = JSON.stringify({
            bank: annForm.bankName,
            account: annForm.bankAccount,
            name: annForm.bankOwner
          });
        }
      }

      const payload = {
        type: annForm.type,
        title: annForm.title,
        content: annForm.content || null,
        imageUrl: annForm.imageUrl || null,
        actionType: annForm.actionType,
        actionUrl: annForm.actionType !== 'NONE' && annForm.actionType !== 'DISMISS' ? annForm.actionUrl : null,
        actionLabel: annForm.actionType !== 'NONE' ? annForm.actionLabel : null,
        actionLabelEn: annForm.actionType !== 'NONE' ? annForm.actionLabelEn : null,
        minVersion: annForm.type === 'UPDATE' && annForm.minVersion !== '' ? Number(annForm.minVersion) : null,
        latestVersion: annForm.type === 'UPDATE' && annForm.latestVersion !== '' ? Number(annForm.latestVersion) : null,
        isForceUpdate: annForm.type === 'UPDATE' ? annForm.isForceUpdate : null,
        qrImageUrl: (annForm.type === 'PAYMENT' || annForm.type === 'DONATE') && annForm.qrImageUrl ? annForm.qrImageUrl : null,
        bankInfo: bankInfoStr || null,
        suggestedAmount: (annForm.type === 'PAYMENT' || annForm.type === 'DONATE') && annForm.suggestedAmount !== '' ? Number(annForm.suggestedAmount) : null,
        platform: annForm.platform,
        priority: Number(annForm.priority) || 0,
        isDismissible: annForm.isDismissible,
        displayMode: annForm.displayMode,
        isActive: annForm.isActive,
        startAt: annForm.startAt ? annForm.startAt + ':00' : null,
        endAt: annForm.endAt ? annForm.endAt + ':00' : null
      };

      if (editingAnn) {
        const res = await api.put(`/api/announcements/${editingAnn.id}`, payload);
        if (res.data?.success) {
          showSuccess('Cập nhật thông báo thành công');
          setIsAnnModalOpen(false);
          fetchAnnouncements();
        }
      } else {
        const res = await api.post('/api/announcements', payload);
        if (res.data?.success) {
          showSuccess('Tạo thông báo thành công');
          setIsAnnModalOpen(false);
          fetchAnnouncements();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông báo');
    } finally {
      setLoading(false);
    }
  };

  // Tab change handler
  useEffect(() => {
    if (activeTab === 'feedbacks') fetchFeedbacks();
    else if (activeTab === 'place-reports') fetchReports();
    else if (activeTab === 'places') fetchPlaces();
    else if (activeTab === 'comments') fetchComments();
    else if (activeTab === 'announcements') fetchAnnouncements();
  }, [activeTab, fetchFeedbacks, fetchReports, fetchPlaces, fetchComments, fetchAnnouncements]);

  // Action: Resolve Feedback
  const handleResolveFeedback = async (id: number) => {
    if (!window.confirm('Xác nhận đã giải quyết phản hồi này? Hệ thống sẽ ẩn phản hồi khỏi danh sách.')) return;
    try {
      const res = await api.delete(`/api/feedbacks/${id}`);
      if (res.data?.success) {
        showSuccess('Giải quyết phản hồi thành công');
        fetchFeedbacks();
      }
    } catch {
      setError('Lỗi khi xử lý phản hồi');
    }
  };

  // Action: Approve Report (soft-deletes the place)
  const handleApproveReport = async (id: number) => {
    if (!window.confirm('Chấp thuận báo cáo? Địa điểm bị báo cáo sẽ bị ẩn khỏi bản đồ.')) return;
    try {
      const res = await api.put(`/api/v1/places/reports/${id}/approve`);
      if (res.data?.success) {
        showSuccess('Đã duyệt báo cáo và ẩn địa điểm');
        fetchReports();
      }
    } catch {
      setError('Lỗi khi phê duyệt báo cáo');
    }
  };

  // Action: Reject Report
  const handleRejectReport = async (id: number) => {
    if (!window.confirm('Bác bỏ báo cáo này?')) return;
    try {
      const res = await api.put(`/api/v1/places/reports/${id}/reject`);
      if (res.data?.success) {
        showSuccess('Đã bác bỏ báo cáo');
        fetchReports();
      }
    } catch {
      setError('Lỗi khi bác bỏ báo cáo');
    }
  };

  // Action: Delete Place
  const handleDeletePlace = async (id: number) => {
    if (!window.confirm('Bạn chắc chắn muốn ẩn địa điểm này khỏi hệ thống?')) return;
    try {
      const res = await api.delete(`/api/v1/places/${id}`);
      if (res.data?.success) {
        showSuccess('Ẩn địa điểm thành công');
        fetchPlaces();
      }
    } catch {
      setError('Lỗi khi xóa địa điểm');
    }
  };

  // Action: Delete Comment
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Xóa bình luận vi phạm này?')) return;
    try {
      const res = await api.delete(`/api/v1/places/comments/${commentId}`);
      if (res.data?.success) {
        showSuccess('Xóa bình luận thành công');
        fetchComments();
      }
    } catch {
      setError('Lỗi khi xóa bình luận');
    }
  };

  // Place Modal Form Handlers
  const openAddPlaceModal = () => {
    setEditingPlace(null);
    setPlaceForm({
      name: '',
      nameEn: '',
      category: 'Địa danh',
      latitude: 16.047,
      longitude: 108.206,
      city: 'Đà Nẵng',
      cityEn: '',
      summary: '',
      summaryEn: '',
      ticketPrices: 'Miễn phí',
      ticketPricesEn: '',
      openingHours: 'Mở cửa cả ngày',
      openingHoursEn: '',
      imageUrls: ['']
    });
    setIsPlaceModalOpen(true);
  };

  const openEditPlaceModal = (place: Place) => {
    setEditingPlace(place);
    setPlaceForm({
      name: place.name,
      nameEn: place.nameEn || '',
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city,
      cityEn: place.cityEn || '',
      summary: place.summary || '',
      summaryEn: place.summaryEn || '',
      ticketPrices: place.ticketPrices || 'Miễn phí',
      ticketPricesEn: place.ticketPricesEn || '',
      openingHours: place.openingHours || 'Mở cửa cả ngày',
      openingHoursEn: place.openingHoursEn || '',
      imageUrls: place.imageUrls && place.imageUrls.length > 0 ? [...place.imageUrls] : ['']
    });
    setIsPlaceModalOpen(true);
  };

  const handlePlaceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      // Filter empty image urls
      const cleanedUrls = placeForm.imageUrls.filter(url => url.trim() !== '');

      const payload = {
        ...placeForm,
        imageUrls: cleanedUrls
      };

      if (editingPlace) {
        const res = await api.put(`/api/v1/places/${editingPlace.id}`, payload);
        if (res.data?.success) {
          showSuccess('Cập nhật địa điểm thành công');
          setIsPlaceModalOpen(false);
          fetchPlaces();
        }
      } else {
        const res = await api.post('/api/v1/places', payload);
        if (res.data?.success) {
          showSuccess('Thêm địa điểm thành công');
          setIsPlaceModalOpen(false);
          fetchPlaces();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu địa điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...placeForm.imageUrls];
    updated[index] = val;
    setPlaceForm(prev => ({ ...prev, imageUrls: updated }));
  };

  const addImageUrlField = () => {
    setPlaceForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  };

  const removeImageUrlField = (index: number) => {
    if (placeForm.imageUrls.length <= 1) return;
    const updated = placeForm.imageUrls.filter((_, idx) => idx !== index);
    setPlaceForm(prev => ({ ...prev, imageUrls: updated }));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Admin Control Center</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Kiểm duyệt phản hồi, quản lý báo cáo vi phạm địa điểm và kiểm soát nội dung hệ thống</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-455 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-55/10 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('feedbacks')}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
            activeTab === 'feedbacks'
              ? 'bg-white dark:bg-slate-900 text-slate-805 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare size={14} />
          <span>Phản hồi hệ thống</span>
        </button>

        <button
          onClick={() => setActiveTab('place-reports')}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
            activeTab === 'place-reports'
              ? 'bg-white dark:bg-slate-900 text-slate-805 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Báo cáo vi phạm</span>
        </button>

        <button
          onClick={() => setActiveTab('places')}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
            activeTab === 'places'
              ? 'bg-white dark:bg-slate-900 text-slate-805 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MapPin size={14} />
          <span>Kho địa điểm</span>
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
            activeTab === 'comments'
              ? 'bg-white dark:bg-slate-900 text-slate-805 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare size={14} />
          <span>Bình luận</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-white dark:bg-slate-900 text-slate-805 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Megaphone size={14} />
          <span>Thông báo In-App</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[400px] transition-theme">
        
        {/* ================= TAB FEEDBACKS ================= */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Ý kiến & phản hồi của người dùng</h3>
            {feedbacks.length === 0 ? (
              <p className="text-center py-16 text-slate-400 text-xs font-medium">Chưa nhận được phản hồi nào từ người dùng</p>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => (
                  <div 
                    key={fb.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-850/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-theme"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{fb.userEmail}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{fb.content}</p>
                      <span className="text-[10px] text-slate-400 block font-semibold">{formatDate(fb.createdAt)}</span>
                    </div>

                    <button 
                      onClick={() => handleResolveFeedback(fb.id)}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer self-start sm:self-center active:scale-95"
                    >
                      <Check size={12} />
                      <span>Đánh dấu xong</span>
                    </button>
                  </div>
                ))}

                {/* Pagination */}
                {fbTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setFbPage(prev => Math.max(prev - 1, 0))}
                      disabled={fbPage === 0}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Trang {fbPage + 1} / {fbTotalPages}</span>
                    <button
                      onClick={() => setFbPage(prev => Math.min(prev + 1, fbTotalPages - 1))}
                      disabled={fbPage === fbTotalPages - 1}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB REPORTS ================= */}
        {activeTab === 'place-reports' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Các báo cáo vi phạm về địa điểm du lịch</h3>
            {reports.length === 0 ? (
              <p className="text-center py-16 text-slate-400 text-xs font-medium">Không có báo cáo địa điểm nào cần duyệt</p>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div 
                    key={rep.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-850/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-theme"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{rep.placeName}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                          {rep.placeCategory} - {rep.placeCity}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          rep.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : rep.status === 'APPROVED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {rep.status === 'PENDING' ? 'Đang chờ' : rep.status === 'APPROVED' ? 'Đã duyệt ẩn' : 'Bác bỏ'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Báo cáo bởi: <span className="font-bold text-slate-700 dark:text-slate-350">{rep.userName}</span> (Lý do: <span className="text-rose-500 font-bold">{rep.reportType}</span>)
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">" {rep.description} "</p>
                      <span className="text-[10px] text-slate-400 block font-semibold">{formatDate(rep.createdAt)}</span>
                    </div>

                    {rep.status === 'PENDING' && (
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button 
                          onClick={() => handleApproveReport(rep.id)}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Check size={12} />
                          <span>Duyệt & Ẩn</span>
                        </button>
                        <button 
                          onClick={() => handleRejectReport(rep.id)}
                          className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
                        >
                          <X size={12} />
                          <span>Bác bỏ</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {repTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setRepPage(prev => Math.max(prev - 1, 0))}
                      disabled={repPage === 0}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Trang {repPage + 1} / {repTotalPages}</span>
                    <button
                      onClick={() => setRepPage(prev => Math.min(prev + 1, repTotalPages - 1))}
                      disabled={repPage === repTotalPages - 1}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB PLACES ================= */}
        {activeTab === 'places' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Danh sách địa điểm hệ thống</h3>
              
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm địa điểm..."
                    value={placeSearch}
                    onChange={e => { setPlaceSearch(e.target.value); setPlacePage(0); }}
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
                <button 
                  onClick={openAddPlaceModal}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer flex-shrink-0 active:scale-95"
                >
                  <Plus size={14} />
                  <span>Thêm mới</span>
                </button>
              </div>
            </div>

            {places.length === 0 ? (
              <p className="text-center py-16 text-slate-400 text-xs font-medium">Không tìm thấy địa điểm nào</p>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs transition-theme">
                <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-950 p-3 font-bold border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                  <div className="col-span-4">Tên địa điểm</div>
                  <div className="col-span-3">Thành phố</div>
                  <div className="col-span-3">Danh mục</div>
                  <div className="col-span-2 text-right">Thao tác</div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {places.map((place) => (
                    <div key={place.id} className="grid grid-cols-12 p-3 items-center text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                      <div className="col-span-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-0">
                        {place.imageUrls && place.imageUrls[0] ? (
                          <img src={place.imageUrls[0]} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] flex-shrink-0">📍</div>
                        )}
                        <span className="truncate">{place.name}</span>
                      </div>
                      <div className="col-span-3 font-medium">{place.city}</div>
                      <div className="col-span-3 font-medium">
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {place.category}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <button 
                          onClick={() => openEditPlaceModal(place)}
                          className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer" 
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeletePlace(place.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer" 
                          title="Xóa địa điểm"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {placeTotalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setPlacePage(prev => Math.max(prev - 1, 0))}
                  disabled={placePage === 0}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Trang {placePage + 1} / {placeTotalPages}</span>
                <button
                  onClick={() => setPlacePage(prev => Math.min(prev + 1, placeTotalPages - 1))}
                  disabled={placePage === placeTotalPages - 1}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB COMMENTS ================= */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Kiểm duyệt bình luận hệ thống</h3>
            {comments.length === 0 ? (
              <p className="text-center py-16 text-slate-400 text-xs font-medium">Chưa có bình luận nào trên hệ thống</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comm) => (
                  <div 
                    key={comm.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-850/5 flex items-start justify-between gap-4 transition-theme"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{comm.user?.name}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">{formatDate(comm.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">"{comm.content}"</p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                        📍 ID địa điểm: {comm.placeId}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeleteComment(comm.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-lg transition-colors cursor-pointer active:scale-95" 
                      title="Xóa bình luận vi phạm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {/* Pagination */}
                {commTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setCommPage(prev => Math.max(prev - 1, 0))}
                      disabled={commPage === 0}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Trang {commPage + 1} / {commTotalPages}</span>
                    <button
                      onClick={() => setCommPage(prev => Math.min(prev + 1, commTotalPages - 1))}
                      disabled={commPage === commTotalPages - 1}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB ANNOUNCEMENTS ================= */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Header & Create Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Quản lý thông báo In-App</h3>
                <p className="text-[11px] text-slate-400">Tạo, sửa đổi và lên lịch hiển thị các cập nhật, cảnh báo bảo trì, yêu cầu thanh toán trên ứng dụng</p>
              </div>
              
              <button 
                onClick={openAddAnnModal}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer flex-shrink-0 active:scale-95"
              >
                <Plus size={14} />
                <span>Tạo thông báo mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-2xl text-xs">
              {/* Search */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder="Tiêu đề thông báo..."
                    value={annSearch}
                    onChange={e => { setAnnSearch(e.target.value); setAnnPage(0); }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Trạng thái</label>
                <select
                  value={annStatusFilter}
                  onChange={e => { setAnnStatusFilter(e.target.value); setAnnPage(0); }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang chạy (Active)</option>
                  <option value="UPCOMING">Sắp diễn ra</option>
                  <option value="PAST">Đã dừng/Hết hạn</option>
                </select>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Loại thông báo</label>
                <select
                  value={annTypeFilter}
                  onChange={e => { setAnnTypeFilter(e.target.value); setAnnPage(0); }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                >
                  <option value="ALL">Tất cả loại</option>
                  <option value="UPDATE">UPDATE (Cập nhật)</option>
                  <option value="ANNOUNCEMENT">ANNOUNCEMENT (Chung)</option>
                  <option value="PAYMENT">PAYMENT (Thanh toán)</option>
                  <option value="DONATE">DONATE (Ủng hộ)</option>
                  <option value="PROMOTION">PROMOTION (Ưu đãi)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Bảo trì)</option>
                </select>
              </div>

              {/* Platform */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Nền tảng</label>
                <select
                  value={annPlatformFilter}
                  onChange={e => { setAnnPlatformFilter(e.target.value); setAnnPage(0); }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                >
                  <option value="ALL">Tất cả nền tảng</option>
                  <option value="ANDROID">ANDROID</option>
                  <option value="IOS">IOS</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Từ ngày</label>
                <input
                  type="date"
                  value={annStartDate}
                  onChange={e => { setAnnStartDate(e.target.value); setAnnPage(0); }}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Đến ngày</label>
                <input
                  type="date"
                  value={annEndDate}
                  onChange={e => { setAnnEndDate(e.target.value); setAnnPage(0); }}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* List Table */}
            {announcements.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Megaphone size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">Chưa có thông báo nào được tạo trên hệ thống</p>
              </div>
            ) : (() => {
              // Apply local filtering
              const now = new Date();
              const filtered = announcements.filter(ann => {
                if (annSearch && !ann.title.toLowerCase().includes(annSearch.toLowerCase())) return false;
                if (annTypeFilter !== 'ALL' && ann.type !== annTypeFilter) return false;
                if (annPlatformFilter !== 'ALL' && ann.platform !== annPlatformFilter) return false;
                if (annStatusFilter !== 'ALL') {
                  const start = ann.startAt ? new Date(ann.startAt) : null;
                  const end = ann.endAt ? new Date(ann.endAt) : null;
                  const isCurrentlyActive = (start === null || start <= now) && (end === null || end >= now) && ann.isActive;
                  const isUpcoming = start !== null && start > now && ann.isActive;
                  const isPast = (end !== null && end < now) || !ann.isActive;
                  if (annStatusFilter === 'ACTIVE' && !isCurrentlyActive) return false;
                  if (annStatusFilter === 'UPCOMING' && !isUpcoming) return false;
                  if (annStatusFilter === 'PAST' && !isPast) return false;
                }
                const compareDate = ann.startAt ? new Date(ann.startAt) : new Date(ann.createdAt);
                if (annStartDate) {
                  const startLimit = new Date(annStartDate + 'T00:00:00');
                  if (compareDate < startLimit) return false;
                }
                if (annEndDate) {
                  const endLimit = new Date(annEndDate + 'T23:59:59');
                  if (compareDate > endLimit) return false;
                }
                return true;
              });

              // Apply pagination
              const itemsPerPage = 8;
              const totalFilteredPages = Math.ceil(filtered.length / itemsPerPage) || 1;
              const currentAnnPage = Math.min(annPage, totalFilteredPages - 1);
              const paginated = filtered.slice(currentAnnPage * itemsPerPage, (currentAnnPage + 1) * itemsPerPage);

              if (filtered.length === 0) {
                return (
                  <p className="text-center py-16 text-slate-400 text-xs font-medium">Không tìm thấy thông báo nào khớp với bộ lọc</p>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-[11px] transition-theme">
                    <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-950 p-3 font-bold border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                      <div className="col-span-4">Tiêu đề / Loại</div>
                      <div className="col-span-2">Nền tảng / Trình chiếu</div>
                      <div className="col-span-1 text-center">Độ ưu tiên</div>
                      <div className="col-span-3">Thời gian hiển thị</div>
                      <div className="col-span-1 text-center">Bật/Tắt</div>
                      <div className="col-span-1 text-right">Thao tác</div>
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginated.map((ann) => {
                        const start = ann.startAt ? new Date(ann.startAt) : null;
                        const end = ann.endAt ? new Date(ann.endAt) : null;
                        const isCurrentlyActive = (start === null || start <= now) && (end === null || end >= now) && ann.isActive;
                        const isUpcoming = start !== null && start > now && ann.isActive;
                        const isPast = (end !== null && end < now) || !ann.isActive;

                        // Type config mapping
                        let typeBadgeClass = 'bg-slate-100 text-slate-650';
                        if (ann.type === 'UPDATE') typeBadgeClass = 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400';
                        else if (ann.type === 'ANNOUNCEMENT') typeBadgeClass = 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400';
                        else if (ann.type === 'PAYMENT') typeBadgeClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500';
                        else if (ann.type === 'DONATE') typeBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
                        else if (ann.type === 'PROMOTION') typeBadgeClass = 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400';
                        else if (ann.type === 'MAINTENANCE') typeBadgeClass = 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400';

                        return (
                          <div 
                            key={ann.id} 
                            className="grid grid-cols-12 p-3 items-center text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors"
                          >
                            {/* Title & Type */}
                            <div className="col-span-4 pr-3 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] flex-shrink-0 ${typeBadgeClass}`}>
                                  {ann.type}
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={ann.title}>
                                  {ann.title}
                                </span>
                              </div>
                              {ann.content && (
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5" title={ann.content}>
                                  {ann.content}
                                </p>
                              )}
                            </div>

                            {/* Platform & Display Mode */}
                            <div className="col-span-2">
                              <div className="flex items-center gap-1">
                                <Smartphone size={10} className="text-slate-400" />
                                <span className="font-bold text-slate-700 dark:text-slate-300">{ann.platform}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">{ann.displayMode}</span>
                            </div>

                            {/* Priority */}
                            <div className="col-span-1 text-center font-bold text-slate-700 dark:text-slate-300">
                              {ann.priority}
                            </div>

                            {/* Time Status / Schedule */}
                            <div className="col-span-3 pr-2 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                {isCurrentlyActive && (
                                  <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Đang hoạt động
                                  </span>
                                )}
                                {isUpcoming && (
                                  <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Sắp chạy
                                  </span>
                                )}
                                {isPast && (
                                  <span className="flex items-center gap-1 font-bold text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
                                    Đã dừng / Hết hạn
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {ann.startAt ? formatDate(ann.startAt) : 'Vô hạn'} ➔ {ann.endAt ? formatDate(ann.endAt) : 'Vô hạn'}
                              </p>
                            </div>

                            {/* Switch active state */}
                            <div className="col-span-1 flex justify-center">
                              <button
                                onClick={() => handleToggleAnnouncementActive(ann.id)}
                                className={`p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                                  ann.isActive ? 'text-emerald-555' : 'text-slate-350 dark:text-slate-600'
                                }`}
                                title={ann.isActive ? 'Nhấp để tạm tắt' : 'Nhấp để kích hoạt'}
                              >
                                <Power size={14} className="stroke-[2.5]" />
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="col-span-1 flex justify-end gap-0.5">
                              <button 
                                onClick={() => openEditAnnModal(ann)}
                                className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850" 
                                title="Chỉnh sửa thông báo"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button 
                                onClick={() => openRepublishAnnouncement(ann)}
                                className="p-1.5 text-slate-400 hover:text-indigo-550 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850" 
                                title="Sao chép & Đăng lại (Duplicate)"
                              >
                                <Copy size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850" 
                                title="Xóa thông báo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pagination Footer */}
                  {totalFilteredPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setAnnPage(prev => Math.max(prev - 1, 0))}
                        disabled={currentAnnPage === 0}
                        className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg disabled:opacity-40 cursor-pointer text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Trang {currentAnnPage + 1} / {totalFilteredPages}</span>
                      <button
                        onClick={() => setAnnPage(prev => Math.min(prev + 1, totalFilteredPages - 1))}
                        disabled={currentAnnPage === totalFilteredPages - 1}
                        className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg disabled:opacity-40 cursor-pointer text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* ================= MODAL PLACE (ADD / EDIT) ================= */}
      {isPlaceModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {editingPlace ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm du lịch'}
              </h3>
              <button 
                onClick={() => setIsPlaceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePlaceFormSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-400 font-bold mb-1">Tên địa điểm (VI) *</label>
                  <input
                    type="text"
                    required
                    value={placeForm.name}
                    onChange={e => setPlaceForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-slate-400 font-bold mb-1">Tên địa điểm (EN)</label>
                  <input
                    type="text"
                    value={placeForm.nameEn}
                    onChange={e => setPlaceForm(prev => ({ ...prev, nameEn: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Danh mục *</label>
                  <select
                    value={placeForm.category}
                    onChange={e => setPlaceForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  >
                    <option value="Địa danh">Địa danh</option>
                    <option value="Ăn uống">Ăn uống</option>
                    <option value="Giải trí">Giải trí</option>
                    <option value="Khách sạn">Khách sạn</option>
                    <option value="Cửa hàng">Cửa hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Thành phố/Tỉnh (VI) *</label>
                  <input
                    type="text"
                    required
                    value={placeForm.city}
                    onChange={e => setPlaceForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Thành phố/Tỉnh (EN)</label>
                  <input
                    type="text"
                    value={placeForm.cityEn}
                    onChange={e => setPlaceForm(prev => ({ ...prev, cityEn: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Vĩ độ (Latitude) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={placeForm.latitude}
                    onChange={e => setPlaceForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kinh độ (Longitude) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={placeForm.longitude}
                    onChange={e => setPlaceForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Giá vé (VI)</label>
                  <input
                    type="text"
                    value={placeForm.ticketPrices}
                    onChange={e => setPlaceForm(prev => ({ ...prev, ticketPrices: e.target.value }))}
                    placeholder="Miễn phí hoặc 50.000đ..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Giá vé (EN)</label>
                  <input
                    type="text"
                    value={placeForm.ticketPricesEn}
                    onChange={e => setPlaceForm(prev => ({ ...prev, ticketPricesEn: e.target.value }))}
                    placeholder="Free or 50,000 VND..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Giờ mở cửa (VI)</label>
                  <input
                    type="text"
                    value={placeForm.openingHours}
                    onChange={e => setPlaceForm(prev => ({ ...prev, openingHours: e.target.value }))}
                    placeholder="08:00 - 18:00..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Giờ mở cửa (EN)</label>
                  <input
                    type="text"
                    value={placeForm.openingHoursEn}
                    onChange={e => setPlaceForm(prev => ({ ...prev, openingHoursEn: e.target.value }))}
                    placeholder="08:00 - 18:00..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tóm tắt mô tả (VI)</label>
                  <textarea
                    value={placeForm.summary}
                    onChange={e => setPlaceForm(prev => ({ ...prev, summary: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tóm tắt mô tả (EN)</label>
                  <textarea
                    value={placeForm.summaryEn}
                    onChange={e => setPlaceForm(prev => ({ ...prev, summaryEn: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Image Urls Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-400 font-bold">Hình ảnh địa điểm (URLs)</label>
                  <button
                    type="button"
                    onClick={addImageUrlField}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    + Thêm URL
                  </button>
                </div>
                {placeForm.imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={url}
                      onChange={e => handleImageUrlChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageUrlField(idx)}
                      disabled={placeForm.imageUrls.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-40 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlaceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-emerald-600 text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ANNOUNCEMENT (ADD / EDIT) ================= */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                {editingAnn ? 'Chỉnh sửa thông báo' : 'Tạo thông báo In-App mới'}
              </h3>
              <button 
                onClick={() => setIsAnnModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAnnouncementSubmit} className="space-y-4 text-xs">
              
              {/* Group 1: General Info */}
              <div className="p-4 bg-slate-55/5 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">1. Nội dung thông báo</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Loại thông báo *</label>
                    <select
                      value={annForm.type}
                      onChange={e => setAnnForm(prev => ({ ...prev, type: e.target.value as AppAnnouncement['type'] }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white font-semibold"
                    >
                      <option value="ANNOUNCEMENT">ANNOUNCEMENT (Chung)</option>
                      <option value="UPDATE">UPDATE (Cập nhật phiên bản)</option>
                      <option value="PAYMENT">PAYMENT (Đòi tiền/Thanh toán)</option>
                      <option value="DONATE">DONATE (Ủng hộ duy trì)</option>
                      <option value="PROMOTION">PROMOTION (Ưu đãi/Quảng cáo)</option>
                      <option value="MAINTENANCE">MAINTENANCE (Bảo trì hệ thống)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Tiêu đề thông báo *</label>
                    <input
                      type="text"
                      required
                      value={annForm.title}
                      onChange={e => setAnnForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tiêu đề hiển thị..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nội dung chi tiết</label>
                  <textarea
                    value={annForm.content}
                    onChange={e => setAnnForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Mô tả chi tiết nội dung thông báo..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Hình ảnh mô tả (URL)</label>
                  <input
                    type="url"
                    value={annForm.imageUrl}
                    onChange={e => setAnnForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/banner.png"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Group 2: Type Specific Configurations */}
              {annForm.type === 'UPDATE' && (
                <div className="p-4 bg-blue-50/10 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-3 animate-fade-in">
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 text-xs">2. Cấu hình Cập nhật (UPDATE)</h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-450 font-bold mb-1">Mã Build tối thiểu (Min Version Code) *</label>
                      <input
                        type="number"
                        required
                        value={annForm.minVersion}
                        onChange={e => setAnnForm(prev => ({ ...prev, minVersion: e.target.value === '' ? '' : Number(e.target.value) }))}
                        placeholder="Ví dụ: 10"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-450 font-bold mb-1">Mã Build mới nhất (Latest Version Code) *</label>
                      <input
                        type="number"
                        required
                        value={annForm.latestVersion}
                        onChange={e => setAnnForm(prev => ({ ...prev, latestVersion: e.target.value === '' ? '' : Number(e.target.value) }))}
                        placeholder="Ví dụ: 12"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-350 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={annForm.isForceUpdate}
                          onChange={e => setAnnForm(prev => ({ ...prev, isForceUpdate: e.target.checked }))}
                          className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:bg-slate-950 dark:border-slate-800"
                        />
                        <span>Bắt buộc cập nhật (Force Update)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {(annForm.type === 'PAYMENT' || annForm.type === 'DONATE') && (
                <div className="p-4 bg-amber-50/10 dark:bg-amber-950/5 border border-amber-100 dark:border-amber-900/40 rounded-xl space-y-3 animate-fade-in">
                  <h4 className="font-bold text-amber-600 dark:text-amber-550 text-xs">2. Cấu hình Thanh toán / Quyên góp</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-450 font-bold mb-1">Ảnh QR Tài khoản (URL)</label>
                      <input
                        type="url"
                        value={annForm.qrImageUrl}
                        onChange={e => setAnnForm(prev => ({ ...prev, qrImageUrl: e.target.value }))}
                        placeholder="https://example.com/qr.png (Hoặc VietQR)"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-455 font-bold mb-1">Số tiền gợi ý (VNĐ)</label>
                      <input
                        type="number"
                        value={annForm.suggestedAmount}
                        onChange={e => setAnnForm(prev => ({ ...prev, suggestedAmount: e.target.value === '' ? '' : Number(e.target.value) }))}
                        placeholder="Ví dụ: 50000"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Bank Info Fields */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-450 font-bold mb-1">Ngân hàng (Tên rút gọn) *</label>
                      <input
                        type="text"
                        required
                        value={annForm.bankName}
                        onChange={e => setAnnForm(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="Ví dụ: MB, VCB, BIDV..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-805 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-450 font-bold mb-1">Số tài khoản *</label>
                      <input
                        type="text"
                        required
                        value={annForm.bankAccount}
                        onChange={e => setAnnForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                        placeholder="Nhập số tài khoản..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-805 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-450 font-bold mb-1">Họ tên chủ tài khoản *</label>
                      <input
                        type="text"
                        required
                        value={annForm.bankOwner}
                        onChange={e => setAnnForm(prev => ({ ...prev, bankOwner: e.target.value.toUpperCase() }))}
                        placeholder="VIET A NGUYEN..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-805 dark:text-white uppercase font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Group 3: Action Config */}
              <div className="p-4 bg-slate-55/5 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">3. Nút hành động tương tác (Call to Action)</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Loại hành động</label>
                    <select
                      value={annForm.actionType}
                      onChange={e => setAnnForm(prev => ({ ...prev, actionType: e.target.value as AppAnnouncement['actionType'] }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                    >
                      <option value="NONE">NONE (Không làm gì)</option>
                      <option value="OPEN_URL">OPEN_URL (Mở liên kết web)</option>
                      <option value="OPEN_STORE">OPEN_STORE (Mở App Store / Play Store)</option>
                      <option value="OPEN_SCREEN">OPEN_SCREEN (Mở màn hình app)</option>
                      <option value="DISMISS">DISMISS (Tắt hộp thoại)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">URL / Tên màn hình đích</label>
                    <input
                      type="text"
                      disabled={annForm.actionType !== 'OPEN_URL' && annForm.actionType !== 'OPEN_SCREEN'}
                      value={annForm.actionUrl}
                      onChange={e => setAnnForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                      placeholder={
                        annForm.actionType === 'OPEN_URL' 
                          ? 'https://example.com' 
                          : annForm.actionType === 'OPEN_SCREEN' 
                            ? 'screen_trip_details' 
                            : 'Không khả dụng'
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Nhãn nút hành động (VI)</label>
                    <input
                      type="text"
                      disabled={annForm.actionType === 'NONE'}
                      value={annForm.actionLabel}
                      onChange={e => setAnnForm(prev => ({ ...prev, actionLabel: e.target.value }))}
                      placeholder={annForm.actionType === 'NONE' ? 'Không có nút' : 'Ví dụ: Xem ngay, Cập nhật...'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Nhãn nút hành động (EN)</label>
                    <input
                      type="text"
                      disabled={annForm.actionType === 'NONE'}
                      value={annForm.actionLabelEn}
                      onChange={e => setAnnForm(prev => ({ ...prev, actionLabelEn: e.target.value }))}
                      placeholder={annForm.actionType === 'NONE' ? 'Không có nút' : 'Ví dụ: View details, Update...'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Target, Lifespan, Limits */}
              <div className="p-4 bg-slate-55/5 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">4. Cài đặt hiển thị & Thời gian lên lịch</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">HĐH Hướng tới</label>
                    <select
                      value={annForm.platform}
                      onChange={e => setAnnForm(prev => ({ ...prev, platform: e.target.value as AppAnnouncement['platform'] }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                    >
                      <option value="ALL">Tất cả nền tảng (ALL)</option>
                      <option value="ANDROID">ANDROID</option>
                      <option value="IOS">IOS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Chế độ hiển thị</label>
                    <select
                      value={annForm.displayMode}
                      onChange={e => setAnnForm(prev => ({ ...prev, displayMode: e.target.value as AppAnnouncement['displayMode'] }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                    >
                      <option value="ONCE">ONCE (Chỉ hiện 1 lần duy nhất)</option>
                      <option value="EVERY_LAUNCH">EVERY_LAUNCH (Hiện mỗi khi mở app)</option>
                      <option value="DAILY">DAILY (Hiện tối đa 1 lần / ngày)</option>
                      <option value="ALWAYS">ALWAYS (Luôn hiển thị hộp thoại)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Mức ưu tiên (Priority)</label>
                    <input
                      type="number"
                      value={annForm.priority}
                      onChange={e => setAnnForm(prev => ({ ...prev, priority: Number(e.target.value) || 0 }))}
                      placeholder="Mức ưu tiên (Lớn hơn hiện trước)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col justify-end gap-1 pb-1">
                    <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-350 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={annForm.isDismissible}
                        onChange={e => setAnnForm(prev => ({ ...prev, isDismissible: e.target.checked }))}
                        className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:bg-slate-950 dark:border-slate-800"
                      />
                      <span>Cho phép tắt (Dismissible)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-350 cursor-pointer mt-1.5">
                      <input
                        type="checkbox"
                        checked={annForm.isActive}
                        onChange={e => setAnnForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary dark:bg-slate-950 dark:border-slate-800"
                      />
                      <span>Kích hoạt ngay (Active)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Thời gian bắt đầu lên lịch</label>
                    <input
                      type="datetime-local"
                      value={annForm.startAt}
                      onChange={e => setAnnForm(prev => ({ ...prev, startAt: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">Để trống nếu muốn có hiệu lực ngay lập tức.</span>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Thời gian kết thúc lên lịch</label>
                    <input
                      type="datetime-local"
                      value={annForm.endAt}
                      onChange={e => setAnnForm(prev => ({ ...prev, endAt: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-white"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">Để trống nếu không giới hạn thời gian chạy (Vô hạn).</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Đang lưu...' : (editingAnn ? 'Lưu cập nhật' : 'Đăng thông báo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
