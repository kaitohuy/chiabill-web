import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, QrCode, CreditCard, Link2, LogOut, Camera, Trash2 } from 'lucide-react';
import api from '../../services/api';

const ProfileSettings: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bankId, setBankId] = useState(user?.bankId || '');
  const [accountNo, setAccountNo] = useState(user?.accountNo || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Tên hiển thị không được để trống.');
      return;
    }

    try {
      setIsUpdating(true);
      const res = await api.put('/api/users/me', {
        name: name.trim(),
        bankId: bankId.trim() || null,
        accountNo: accountNo.trim() || null
      });
      if (res.data && res.data.success) {
        updateProfile(res.data.data);
        alert('Cập nhật thông tin cá nhân thành công!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUpdating(true);
      const res = await api.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.success) {
        updateProfile({ avatarUrl: res.data.data });
        alert('Cập nhật ảnh đại diện thành công!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tải lên ảnh đại diện.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUpdating(true);
      const res = await api.post('/api/users/bank-qr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.success) {
        updateProfile({ bankQrUrl: res.data.data });
        alert('Tải ảnh QR nhận tiền thành công!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tải lên mã QR.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveQr = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã QR hiện tại?')) return;
    try {
      setIsUpdating(true);
      const res = await api.put('/api/users/me', {
        name: user?.name,
        bankId: user?.bankId,
        accountNo: user?.accountNo,
        bankQrUrl: '' // Empty string triggers deletion on backend
      });
      if (res.data && res.data.success) {
        updateProfile(res.data.data);
        alert('Xóa ảnh QR thành công!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa mã QR.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Card: Avatar & Quick Actions */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme flex flex-col items-center justify-between text-center gap-6">
          <div className="space-y-3 w-full">
            <div className="relative w-24 h-24 mx-auto group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img 
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'anonymous'}`} 
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full border-4 border-primary/20 bg-slate-100 dark:bg-slate-800 object-cover mx-auto transition-opacity group-hover:opacity-75"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
              <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{user?.name}</h3>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {user?.isAnonymous ? 'Tài khoản ẩn danh' : 'Thành viên liên kết'}
              </p>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            {user?.isAnonymous && (
              <button className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
                <Link2 size={14} />
                <span>Liên kết Google</span>
              </button>
            )}
            
            <button 
              onClick={logout}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-colors border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Right Form: User & Bank Details */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-theme">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* General Settings */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <User size={16} className="text-primary" />
                <span>Thông tin tài khoản</span>
              </h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Tên hiển thị
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Bank Settings */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                <span>Cấu hình nhận tiền quyết toán</span>
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Tên ngân hàng
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Vietcombank, MB Bank..."
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Số tài khoản
                  </label>
                  <input 
                    type="text" 
                    placeholder="Nhập số tài khoản ngân hàng..."
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* QR Upload Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Ảnh mã QR nhận tiền
                </label>
                
                {user?.bankQrUrl ? (
                  <div className="relative max-w-xs mx-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-850 flex flex-col items-center gap-3">
                    <img 
                      src={user.bankQrUrl} 
                      alt="VietQR Code" 
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                    <button 
                      type="button"
                      onClick={handleRemoveQr}
                      className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Xóa ảnh QR</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => qrInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-slate-50/50 dark:bg-slate-850/20"
                  >
                    <QrCode className="mx-auto text-slate-400 mb-2" size={28} />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Tải ảnh QR lên (VietQR)</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Định dạng JPG, PNG tối đa 5MB</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={qrInputRef} 
                  onChange={handleQrUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <button 
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-primary/60 text-white text-sm font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
