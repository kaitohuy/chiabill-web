import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, MapPin, ShieldAlert, Heart, MessageSquare, CornerDownRight,
  X, Compass, Navigation, Info, Clock, AlertTriangle, DollarSign
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Place {
  id: number;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  city?: string;
  summary?: string;
  ticketPrices?: string;
  openingHours?: string;
  images?: { id: number; imageUrl: string }[];
  isUserGenerated?: boolean;
}

interface Comment {
  id: number;
  placeId: number;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  parentId?: number | null;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  replies?: Comment[];
}

// Leaflet custom marker icon using inline SVG for high premium styling
const customIcon = L.divIcon({
  html: `<div class="bg-primary text-white p-2.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center w-9 h-9 transform -translate-y-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  className: 'custom-pin-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Helper component to pan/zoom map
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.75 });
  }, [center, zoom, map]);
  return null;
};

// Map click listener component
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const Explore: React.FC = () => {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([16.0544, 108.2022]); // Da Nang default
  const [mapZoom, setMapZoom] = useState(13);

  // Selected Place details state
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newPlace, setNewPlace] = useState({
    name: '',
    category: 'Địa danh',
    city: 'Đà Nẵng',
    summary: '',
    ticketPrices: '',
    openingHours: '',
    imageUrl: '',
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Load places
  const fetchPlaces = async (searchWord = '', category = '') => {
    try {
      setLoading(true);
      let res;
      if (searchWord) {
        res = await api.get(`/api/v1/places/search?keyword=${encodeURIComponent(searchWord)}&page=0&size=50`);
      } else {
        res = await api.get(`/api/v1/places?category=${encodeURIComponent(category)}&page=0&size=50`);
      }
      if (res.data?.success) {
        const list = res.data.data?.content || [];
        setPlaces(list);
        if (list.length > 0 && !searchWord && !category) {
          // Centered on first item
          setMapCenter([list[0].latitude, list[0].longitude]);
        }
      }
    } catch (err) {
      console.error('Failed to load places:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces('', selectedCategory);
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlaces(keyword, selectedCategory);
  };

  // Load place comments
  const loadComments = async (placeId: number) => {
    try {
      setCommentsLoading(true);
      const res = await api.get(`/api/v1/places/${placeId}/comments?page=0&size=50`);
      if (res.data?.success) {
        setComments(res.data.data?.content || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const selectPlace = (place: Place) => {
    setSelectedPlace(place);
    setMapCenter([place.latitude, place.longitude]);
    setMapZoom(15);
    loadComments(place.id);
  };

  // Post comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace || !commentText.trim()) return;

    try {
      const res = await api.post(`/api/v1/places/${selectedPlace.id}/comments`, {
        content: commentText,
      });
      if (res.data?.success) {
        setCommentText('');
        loadComments(selectedPlace.id);
      }
    } catch (err) {
      alert('Không thể đăng bình luận');
    }
  };

  // Reply comment
  const handlePostReply = async (commentId: number) => {
    if (!selectedPlace || !replyText.trim()) return;

    try {
      const res = await api.post(`/api/v1/places/comments/${commentId}/reply`, {
        content: replyText,
      });
      if (res.data?.success) {
        setReplyText('');
        setReplyToId(null);
        loadComments(selectedPlace.id);
      }
    } catch (err) {
      alert('Không thể trả lời bình luận');
    }
  };

  // Like comment
  const handleLikeComment = async (commentId: number) => {
    try {
      await api.post(`/api/v1/places/comments/${commentId}/like`);
      if (selectedPlace) {
        loadComments(selectedPlace.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    try {
      await api.delete(`/api/v1/places/comments/${commentId}`);
      if (selectedPlace) {
        loadComments(selectedPlace.id);
      }
    } catch (err) {
      alert('Không thể xóa bình luận');
    }
  };

  // Report place
  const handleReportPlace = async () => {
    if (!selectedPlace || !reportReason.trim()) return;
    try {
      await api.post(`/api/v1/places/${selectedPlace.id}/report`, {
        reason: reportReason,
      });
      setIsReportModalOpen(false);
      setReportReason('');
      alert('Đã gửi báo cáo địa điểm thành công!');
    } catch (err) {
      alert('Không thể báo cáo địa điểm');
    }
  };

  // Create Place
  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clickCoords) return;

    try {
      const payload = {
        name: newPlace.name,
        category: newPlace.category,
        latitude: clickCoords.lat,
        longitude: clickCoords.lng,
        city: newPlace.city,
        summary: newPlace.summary,
        ticketPrices: newPlace.ticketPrices,
        openingHours: newPlace.openingHours,
        imageUrls: newPlace.imageUrl ? [newPlace.imageUrl] : [],
      };

      const res = await api.post('/api/v1/places', payload);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        setNewPlace({
          name: '',
          category: 'Địa danh',
          city: 'Đà Nẵng',
          summary: '',
          ticketPrices: '',
          openingHours: '',
          imageUrl: '',
        });
        fetchPlaces('', selectedCategory);
        if (res.data.data) {
          selectPlace(res.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo địa điểm mới');
    }
  };

  const categories = ['Địa danh', 'Ăn uống', 'Khách sạn', 'Giải trí', 'Mua sắm'];

  return (
    <div className="flex h-[calc(100vh-140px)] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 transition-theme shadow-sm relative">
      {/* Left Explore Panel */}
      <div className="w-full md:w-[420px] flex-shrink-0 flex flex-col h-full border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-theme z-20">
        
        {/* Search & Categories Bar */}
        <div className="p-4.5 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm địa điểm du lịch..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-slate-900 dark:text-white"
            />
          </form>

          {/* Categories Horizontal */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
                selectedCategory === ''
                  ? 'bg-primary text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Detail Overlay or Listings List */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {selectedPlace ? (
            // DETAILED DRAWER PANEL
            <div className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col">
              {/* Back Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  &larr; Trở lại
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors cursor-pointer border border-rose-100 dark:border-rose-900/30"
                  title="Báo cáo địa điểm"
                >
                  <ShieldAlert size={15} />
                </button>
              </div>

              {/* Detail Info Content */}
              <div className="flex-1 overflow-y-auto p-4.5 space-y-4">
                {/* Place Image */}
                {selectedPlace.images && selectedPlace.images.length > 0 ? (
                  <img
                    src={selectedPlace.images[0].imageUrl}
                    alt={selectedPlace.name}
                    className="w-full h-48 object-cover rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80"
                  />
                ) : (
                  <div className="w-full h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-semibold">
                    Không có ảnh
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-black text-[9px]">
                      {selectedPlace.category}
                    </span>
                    {selectedPlace.city && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <MapPin size={10} />
                        {selectedPlace.city}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                    {selectedPlace.name}
                  </h3>

                  {selectedPlace.summary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {selectedPlace.summary}
                    </p>
                  )}
                </div>

                {/* Additional metadata info panel */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800/50 rounded-2xl space-y-2.5">
                  {selectedPlace.openingHours && (
                    <p className="text-xs text-slate-600 dark:text-slate-350 flex items-start gap-2">
                      <Clock size={13} className="text-slate-400 mt-0.5" />
                      <span><strong>Giờ mở cửa:</strong> {selectedPlace.openingHours}</span>
                    </p>
                  )}
                  {selectedPlace.ticketPrices && (
                    <p className="text-xs text-slate-600 dark:text-slate-350 flex items-start gap-2">
                      <DollarSign size={13} className="text-slate-400 mt-0.5" />
                      <span><strong>Vé vào cửa:</strong> {selectedPlace.ticketPrices}</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-350 flex items-start gap-2">
                    <Navigation size={13} className="text-slate-400 mt-0.5" />
                    <span><strong>Tọa độ:</strong> {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}</span>
                  </p>
                </div>

                {/* Comments Section */}
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-primary" />
                    Bình luận ({comments.length})
                  </h4>

                  {/* Comment Input */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Viết đánh giá của bạn..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-primary hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Gửi
                    </button>
                  </form>

                  {/* Comments thread */}
                  {commentsLoading ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">Đang tải bình luận...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-4">Chưa có bình luận nào. Hãy bình luận đầu tiên!</p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          {/* Parent comment */}
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {comment.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                                  {comment.user.name}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">
                                {comment.content}
                              </p>

                              {/* Comment Actions */}
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => handleLikeComment(comment.id)}
                                  className={`flex items-center gap-1 text-[9px] font-bold transition-colors ${
                                    comment.isLikedByCurrentUser ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                                  }`}
                                >
                                  <Heart size={10} fill={comment.isLikedByCurrentUser ? 'currentColor' : 'none'} />
                                  <span>{comment.likeCount}</span>
                                </button>
                                <button
                                  onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                                  className="text-[9px] text-slate-400 hover:text-primary font-bold"
                                >
                                  Trả lời
                                </button>
                                {comment.user.id === user?.id && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-[9px] text-slate-400 hover:text-rose-500 font-bold ml-auto"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reply Input Box */}
                          {replyToId === comment.id && (
                            <div className="pl-6 flex gap-2">
                              <input
                                type="text"
                                placeholder={`Trả lời ${comment.user.name}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                              />
                              <button
                                onClick={() => handlePostReply(comment.id)}
                                className="px-2.5 py-1.5 bg-primary text-white font-bold text-[10px] rounded-xl cursor-pointer"
                              >
                                Gửi
                              </button>
                            </div>
                          )}

                          {/* Nested Replies */}
                          {comment.replies && comment.replies.map((reply) => (
                            <div key={reply.id} className="pl-6 flex gap-2">
                              <CornerDownRight size={14} className="text-slate-300 mt-2 flex-shrink-0" />
                              <div className="flex-1 bg-slate-50/60 dark:bg-slate-900/20 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                                  {reply.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                                      {reply.user.name}
                                    </span>
                                    <span className="text-[8px] text-slate-400">
                                      {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-350 mt-0.5 leading-relaxed">
                                    {reply.content}
                                  </p>

                                  <div className="flex items-center gap-3 mt-1.5">
                                    <button
                                      onClick={() => handleLikeComment(reply.id)}
                                      className={`flex items-center gap-1 text-[8px] font-bold ${
                                        reply.isLikedByCurrentUser ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                                      }`}
                                    >
                                      <Heart size={9} fill={reply.isLikedByCurrentUser ? 'currentColor' : 'none'} />
                                      <span>{reply.likeCount}</span>
                                    </button>
                                    {reply.user.id === user?.id && (
                                      <button
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="text-[8px] text-slate-400 hover:text-rose-500 font-bold ml-auto"
                                      >
                                        Xóa
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // LISTINGS GRID LIST
            <div className="p-4.5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-0.5">Địa điểm lân cận</h3>
              
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Đang tìm địa điểm du lịch...</div>
              ) : places.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Compass className="mx-auto text-slate-300 dark:text-slate-800 mb-2" size={36} />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Không tìm thấy địa điểm nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {places.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => selectPlace(place)}
                      className="p-3 bg-slate-50 hover:bg-slate-100/60 dark:bg-slate-900/40 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800/80 rounded-2xl transition-all cursor-pointer flex gap-3 group"
                    >
                      {place.images && place.images.length > 0 ? (
                        <img
                          src={place.images[0].imageUrl}
                          alt={place.name}
                          className="w-18 h-18 object-cover rounded-xl shadow-inner flex-shrink-0"
                        />
                      ) : (
                        <div className="w-18 h-18 rounded-xl bg-slate-200 dark:bg-slate-850 text-slate-450 dark:text-slate-650 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          No Pic
                        </div>
                      )}

                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black uppercase text-primary tracking-wider bg-primary/10 px-1 py-0.2 rounded">
                              {place.category}
                            </span>
                            {place.city && (
                              <span className="text-[9px] text-slate-400 flex items-center gap-0.5 truncate">
                                <MapPin size={8} />
                                {place.city}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-850 dark:text-white text-xs truncate group-hover:text-primary transition-colors">
                            {place.name}
                          </h4>
                          {place.summary && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                              {place.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Leaflet Map Section */}
      <div className="flex-1 h-full relative z-10">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController center={mapCenter} zoom={mapZoom} />

          <MapClickHandler
            onMapClick={(lat, lng) => {
              setClickCoords({ lat, lng });
              setIsAddModalOpen(true);
            }}
          />

          {/* Place Markers */}
          {places.map((place) => (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  selectPlace(place);
                },
              }}
            >
              <Popup>
                <div className="text-center p-1 space-y-1">
                  <p className="font-black text-xs text-slate-800 m-0">{place.name}</p>
                  <p className="text-[10px] text-slate-450 m-0">{place.category}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Small floating helper instructions */}
        <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-lg z-30 pointer-events-none max-w-xs transition-theme">
          <p className="text-[9px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Info size={11} className="text-primary" />
            <span>Click chuột vào bất kỳ vị trí nào trên bản đồ để thêm địa điểm du lịch mới</span>
          </p>
        </div>
      </div>

      {/* Add Place Modal */}
      {isAddModalOpen && clickCoords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/60">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Thêm địa điểm du lịch</h3>
                <p className="text-[10px] text-slate-450">Tạo địa điểm tại tọa độ {clickCoords.lat.toFixed(5)}, {clickCoords.lng.toFixed(5)}</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePlace} className="p-5 space-y-3.5 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tên địa điểm *</label>
                <input
                  type="text"
                  required
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                  placeholder="VD: Cầu Rồng Đà Nẵng"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Danh mục *</label>
                  <select
                    value={newPlace.category}
                    onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-905 dark:text-white font-semibold focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Thành phố</label>
                  <input
                    type="text"
                    value={newPlace.city}
                    onChange={(e) => setNewPlace({ ...newPlace, city: e.target.value })}
                    placeholder="VD: Đà Nẵng"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Giờ mở cửa</label>
                  <input
                    type="text"
                    value={newPlace.openingHours}
                    onChange={(e) => setNewPlace({ ...newPlace, openingHours: e.target.value })}
                    placeholder="VD: 07:30 - 21:00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Giá vé vào cửa</label>
                  <input
                    type="text"
                    value={newPlace.ticketPrices}
                    onChange={(e) => setNewPlace({ ...newPlace, ticketPrices: e.target.value })}
                    placeholder="VD: Miễn phí"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">URL Hình ảnh</label>
                <input
                  type="url"
                  value={newPlace.imageUrl}
                  onChange={(e) => setNewPlace({ ...newPlace, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Mô tả ngắn gọn</label>
                <textarea
                  value={newPlace.summary}
                  onChange={(e) => setNewPlace({ ...newPlace, summary: e.target.value })}
                  placeholder="Giới thiệu về địa điểm này..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tạo địa điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="text-amber-500" size={16} />
                Báo cáo địa điểm xấu
              </h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Báo cáo địa điểm "{selectedPlace.name}" lên hệ thống phê duyệt của Admin.</p>
            </div>

            <textarea
              required
              placeholder="Vui lòng nêu rõ lý do báo cáo (VD: địa điểm đã đóng cửa, sai tọa độ, hình ảnh không đúng...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none text-slate-900 dark:text-white"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleReportPlace}
                disabled={!reportReason.trim()}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
