import React, { useState } from 'react';
import { loginApi } from '../api/accountApi';
import { useGlobalLoading } from '../components/LoadingContext';

const DangNhap = ({ onForgotPassword, onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { withLoading } = useGlobalLoading();

  const handleLogin = withLoading(async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identity.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginApi({ identity, password });
      if (data.token) {
        if (onLoginSuccess) onLoginSuccess({ ...data, vaiTro: data.role });
      }
    } catch (error) {
      setErrorMessage(error.message || 'Đăng nhập thất bại.');
    } finally {
      setIsLoading(false);
    }
  }, 'Đang đăng nhập...');

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#f0f4f9]">
      {/* Hiệu ứng nền loang màu lớn */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[70%] rounded-full bg-blue-200/40 blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[70%] rounded-full bg-indigo-200/40 blur-[140px]" />
      </div>

      <div className="w-full max-w-[850px] z-10 px-6 animate-fade-in">
        {/* Card thiết kế Rộng & Thấp (Side-by-side) */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[45px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-white overflow-hidden flex flex-col xl:flex-row min-h-[460px]">
          
          {/* CỘT TRÁI: Thương hiệu (Cực kỳ tối giản) */}
          <div className="xl:w-5/12 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 p-12 flex flex-col justify-center items-center text-white relative">
            {/* Họa tiết chìm */}
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-40 h-40 rounded-full border-[15px] border-white" />
              <div className="absolute bottom-[-10%] right-[-10%] w-60 h-60 rounded-full border-[20px] border-white" />
            </div>
            
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[30px] flex items-center justify-center mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                medical_services
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase">MedCore</h2>
          </div>

          {/* CỘT PHẢI: Form đăng nhập */}
          <div className="xl:w-7/12 p-12 flex flex-col justify-center bg-white">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Đăng nhập hệ thống</h1>
              <div className="h-1.5 w-16 bg-blue-500 rounded-full mt-3"></div>
            </div>

            {errorMessage && (
              <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-red-500 text-[24px]">error</span>
                <p className="text-[14px] font-bold text-red-700">{errorMessage}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-5">
                {/* Tài khoản */}
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[26px]">person</span>
                  </span>
                  <input 
                    className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-bold transition-all focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-400" 
                    placeholder="Email hoặc Số điện thoại" 
                    type="text"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                  />
                </div>

                {/* Mật khẩu */}
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <span className="material-symbols-outlined text-[26px]">lock</span>
                  </span>
                  <input 
                    className="w-full pl-14 pr-14 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[16px] font-bold transition-all focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-400" 
                    placeholder="Mật khẩu" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[24px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={onForgotPassword} 
                  className="text-[14px] font-black text-blue-600 hover:text-blue-800 tracking-wide"
                >
                  QUÊN MẬT KHẨU?
                </button>
              </div>

              <button 
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-[18px] rounded-[22px] shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 group" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    ĐANG XÁC THỰC...
                  </span>
                ) : (
                  <>
                    <span>ĐĂNG NHẬP NGAY</span>
                    <span className="material-symbols-outlined text-[24px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center mt-8 text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          Secure Access Protocol v2.0
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .py-4\\.5 { padding-top: 1.15rem; padding-bottom: 1.15rem; }
      `}} />
    </main>
  );
};

export default DangNhap;