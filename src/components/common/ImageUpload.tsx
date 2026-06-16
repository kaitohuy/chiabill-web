import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  placeholder = 'Kéo thả ảnh vào đây hoặc click để chọn file',
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận tệp hình ảnh.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh tối đa là 5MB.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success && res.data?.data) {
        onChange(res.data.data);
      } else {
        setError('Tải ảnh lên thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative w-full ${className}`}>
      {value ? (
        // Preview State
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video flex items-center justify-center transition-all shadow-sm">
          <img
            src={value}
            alt="Uploaded Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold shadow hover:bg-slate-50 transition-all cursor-pointer"
            >
              Thay đổi
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold shadow hover:bg-rose-600 transition-all cursor-pointer"
            >
              Xóa
            </button>
          </div>
        </div>
      ) : (
        // Dropzone State
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
            dragActive
              ? 'border-primary bg-primary/5 dark:bg-primary/5'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/25 hover:border-primary/50'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Đang tải ảnh lên...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-550 shadow-sm">
                <Upload size={18} />
              </div>
              <div>
                <span className="text-xs text-slate-650 dark:text-slate-400 font-bold block">{placeholder}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Hỗ trợ JPG, PNG, WEBP tối đa 5MB</span>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[10px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
