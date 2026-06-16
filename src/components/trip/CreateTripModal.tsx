import React, { useState, useEffect } from 'react';
import { X, Plane, Tent, Utensils, Users, Folder, Calendar, DollarSign, FileText } from 'lucide-react';
import api from '../../services/api';
import ImageUpload from '../common/ImageUpload';

interface TripData {
  id: number;
  name: string;
  description: string;
  totalBudget: number;
  startDate: string;
  endDate: string;
  categoryName: string;
  categoryIcon: string;
  coverUrl?: string;
}

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tripToEdit?: TripData | null;
}

const CATEGORIES = [
  { name: 'Du lịch', iconKey: 'plane', icon: Plane, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { name: 'Dã ngoại', iconKey: 'tent', icon: Tent, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { name: 'Ăn uống', iconKey: 'utensils', icon: Utensils, color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { name: 'Gặp mặt', iconKey: 'users', icon: Users, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  { name: 'Khác', iconKey: 'folder', icon: Folder, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
];

const CreateTripModal: React.FC<CreateTripModalProps> = ({ isOpen, onClose, onSuccess, tripToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (tripToEdit) {
        setName(tripToEdit.name || '');
        setDescription(tripToEdit.description || '');
        setTotalBudget(tripToEdit.totalBudget ? String(tripToEdit.totalBudget) : '');
        setStartDate(tripToEdit.startDate ? tripToEdit.startDate.split('T')[0] : '');
        setEndDate(tripToEdit.endDate ? tripToEdit.endDate.split('T')[0] : '');
        setCoverUrl(tripToEdit.coverUrl || '');
        const cat = CATEGORIES.find(c => c.name === tripToEdit.categoryName) || CATEGORIES[0];
        setSelectedCategory(cat);
      } else {
        setName('');
        setDescription('');
        setTotalBudget('');
        setStartDate('');
        setEndDate('');
        setCoverUrl('');
        setSelectedCategory(CATEGORIES[0]);
      }
      setError('');
    }
  }, [isOpen, tripToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên chuyến đi');
      return;
    }
    if (!startDate || !endDate) {
      setError('Vui lòng nhập ngày bắt đầu và ngày kết thúc');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        name,
        description,
        totalBudget: totalBudget ? parseFloat(totalBudget) : 0,
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.iconKey,
        coverUrl: tripToEdit?.coverUrl || ''
      };

      if (tripToEdit) {
        // Edit mode
        await api.put(`/api/trips/${tripToEdit.id}`, payload);
      } else {
        // Create mode
        await api.post('/api/trips', payload);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý thông tin');
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!tripToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              {isEditMode ? 'Chỉnh sửa chuyến đi' : 'Tạo chuyến đi mới'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? 'Cập nhật lại các thông tin của chuyến đi' : 'Lên kế hoạch và chia sẻ chi phí cùng nhóm'}
            </p>
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

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tên chuyến đi *</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="VD: Du lịch Phú Quốc 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Mô tả chuyến đi</label>
            <textarea
              placeholder="Ghi chú về lịch trình hoặc các lưu ý..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-slate-900 dark:text-white h-20 resize-none"
            />
          </div>

          {/* Total Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ngân sách dự kiến (VND)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="number"
                placeholder="Để trống nếu không giới hạn"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ngày đi *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ngày về *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Danh mục chuyến đi</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory.name === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected 
                        ? `${cat.color} ring-2 ring-primary border-transparent scale-105 shadow-sm` 
                        : 'border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <IconComponent size={20} className="mb-1" />
                    <span className="text-[10px] font-bold tracking-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
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
              className="flex-1 py-3 bg-primary hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition-colors text-sm font-bold rounded-xl text-white cursor-pointer shadow-md shadow-emerald-500/15"
            >
              {loading ? 'Đang xử lý...' : isEditMode ? 'Lưu thay đổi' : 'Tạo chuyến đi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
