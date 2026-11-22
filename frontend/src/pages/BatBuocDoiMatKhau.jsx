import React, { useState } from 'react';
import { firstTimeChangePasswordApi, validateSessionApi } from '../api/accountApi';
import { useNotification } from '../components/NotificationContext';

const BatBuocDoiMatKhau = ({ user, onPasswordChanged, onLogout }) => {
  const { showSuccess } = useNotification();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibleFields, setVisibleFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordVisibility = (field) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (newPassword.length < 5) {
      setError('Mật khẩu mới phải có ít nhất 5 ký tự!');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng mật khẩu hiện tại!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await firstTimeChangePasswordApi({ currentPassword, newPassword });
      const session = await validateSessionApi();
      if (session?.mustChangePassword !== false) {
        throw new Error('Chưa thể xác nhận trạng thái mật khẩu mới. Vui lòng thử lại.');
      }
      showSuccess('Đổi mật khẩu thành công!');
      onPasswordChanged(session);
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordFields = [
    {
      id: 'currentPassword',
      label: 'Mật khẩu hiện tại',
      placeholder: 'Nhập mật khẩu hiện tại',
      value: currentPassword,
      onChange: setCurrentPassword,
      autoComplete: 'current-password'
    },
    {
      id: 'newPassword',
      label: 'Mật khẩu mới',
      placeholder: 'Tạo mật khẩu mới',
      value: newPassword,
      onChange: setNewPassword,
      autoComplete: 'new-password',
      minLength: 5
    },
    {
      id: 'confirmPassword',
      label: 'Nhập lại mật khẩu',
      placeholder: 'Xác nhận mật khẩu mới',
      value: confirmPassword,
      onChange: setConfirmPassword,
      autoComplete: 'new-password',
      minLength: 5
    }
  ];

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f1f5fb] px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-36 -top-40 h-96 w-96 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9),transparent_55%)]" />
      </div>

      <div className="relative z-10 grid w-full max-w-[1024px] overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(27,55,96,0.16)] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-10 text-white lg:flex">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-8 -top-4 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/5" />
          </div>

          <div className="relative">
            <div className="mb-16 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">medical_services</span>
              </div>
              <span className="text-xl font-extrabold tracking-[0.12em]">MEDCORE</span>
            </div>

            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-50">
              <span className="material-symbols-outlined text-base" aria-hidden="true">shield_lock</span>
              Bảo mật tài khoản
            </span>
            <h2 className="max-w-[22rem] text-3xl font-bold leading-tight tracking-tight">
              Một bước nhỏ để bảo vệ tài khoản của bạn.
            </h2>
            <p className="mt-4 max-w-[22rem] text-sm leading-6 text-blue-100">
              Hãy thay mật khẩu mặc định bằng mật khẩu riêng trước khi tiếp tục sử dụng hệ thống.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-xl text-blue-100" aria-hidden="true">key</span>
              <div>
                <p className="text-sm font-semibold">Gợi ý bảo mật</p>
                <p className="mt-1 text-xs leading-5 text-blue-100">
                  Chọn mật khẩu riêng, tối thiểu 5 ký tự và không trùng mật khẩu hiện tại.
                </p>
              </div>
            </div>
            <p className="mt-5 border-t border-white/15 pt-4 text-[11px] font-medium tracking-wide text-blue-100/80">
              MEDCORE · HỆ THỐNG QUẢN LÝ PHÒNG KHÁM
            </p>
          </div>
        </aside>

        <section className="px-5 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-14">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">medical_services</span>
            </div>
            <span className="font-bold tracking-[0.12em] text-slate-800">MEDCORE</span>
          </div>

          <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Bước bảo mật bắt buộc
          </div>

          <div className="mb-8">
            <h1 className="font-headline-lg text-[28px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[32px]">
              Đổi mật khẩu lần đầu
            </h1>
            <p className="mt-3 max-w-[28rem] text-sm leading-6 text-slate-500">
              Vì lý do bảo mật, bạn cần tạo mật khẩu mới trước khi vào giao diện làm việc.
            </p>
            {user?.username && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200/80">
                <span className="material-symbols-outlined text-lg text-slate-400" aria-hidden="true">person</span>
                <span className="font-semibold text-slate-700">{user.username}</span>
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
              <span className="material-symbols-outlined mt-0.5 text-lg" aria-hidden="true">error</span>
              <p className="leading-5">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {passwordFields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="mb-2 block text-sm font-semibold text-slate-700">
                  {field.label}
                </label>
                <div className="group relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 transition-colors group-focus-within:text-blue-600" aria-hidden="true">
                    lock
                  </span>
                  <input
                    id={field.id}
                    type={visibleFields[field.id] ? 'text' : 'password'}
                    required
                    minLength={field.minLength}
                    autoComplete={field.autoComplete}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-12 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(field.id)}
                    aria-label={`${visibleFields[field.id] ? 'Ẩn' : 'Hiện'} ${field.label.toLowerCase()}`}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-blue-600"
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      {visibleFields[field.id] ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    Cập nhật mật khẩu
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
            Đăng xuất
          </button>
        </section>
      </div>
    </main>
  );
};

export default BatBuocDoiMatKhau;
