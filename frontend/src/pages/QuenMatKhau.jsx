import React, { useState } from 'react';
import { sendOtpApi, verifyOtpApi, resetPasswordApi } from '../api/accountApi';

const QuenMatKhau = ({ onBackToLogin }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Step 1: Handle Send Email
    const handleSendEmail = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        
        if (!email.includes('@') || !email.includes('.')) {
            setMessage({ type: 'error', text: 'Vui lòng nhập email hợp lệ!' });
            return;
        }

        setLoading(true);

        try {
            // Gọi API lên Backend
            await sendOtpApi(email);

            setMessage({ type: 'success', text: `Đã gửi mã xác nhận đến: ${email}` });
            setStep(2);

        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi gửi mail: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle Verify OTP (gọi API backend xác thực)
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!otpInput || otpInput.length !== 6) {
            setMessage({ type: 'error', text: 'Vui lòng nhập mã OTP 6 số!' });
            return;
        }

        try {
            setLoading(true);
            // Gọi API backend xác thực OTP
            await verifyOtpApi({ email, otp: otpInput });
            setStep(3);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Handle Reset Password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu phải từ 6 ký tự trở lên!' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
            return;
        }

        setLoading(true);
        try {
            // Gọi API đổi mật khẩu
            await resetPasswordApi({ email, newPassword });

            setMessage({ type: 'success', text: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });
            
            setTimeout(() => {
                if (onBackToLogin) {
                    onBackToLogin();
                }
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi hệ thống hoặc Email không tồn tại!' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#eff6ff] p-4">
            <div className="bg-white rounded-[20px] shadow-lg w-full max-w-[500px] overflow-hidden relative">
                
                {/* Header with Close Button (if needed, otherwise handled by routing) */}
                <div className="absolute top-4 right-4">
                    <button 
                        onClick={onBackToLogin}
                        className="text-gray-400 hover:text-gray-600 font-bold text-xl cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-10">
                    {/* Message Display */}
                    {message.text && (
                        <div className={`mb-4 p-3 rounded-md text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-[26px] font-bold text-[#1e3a8a] mb-2">Quên Mật Khẩu?</h2>
                            <p className="text-gray-500 text-sm mb-6">Nhập email đã đăng ký để nhận mã xác thực.</p>
                            
                            <form onSubmit={handleSendEmail} className="space-y-6">
                                <div>
                                    <label className="block text-[#1e3a8a] font-bold text-sm mb-2">Địa chỉ Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
                                        placeholder="ví dụ: dvmtam1102003@gmail.com"
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full transition-colors flex justify-center items-center h-[45px]"
                                >
                                    {loading ? 'Đang gửi...' : 'Gửi Mã Xác Nhận'}
                                </button>
                                
                                <div className="text-center mt-4">
                                    <button 
                                        type="button"
                                        onClick={onBackToLogin} 
                                        className="text-gray-500 hover:text-[#3b82f6] text-sm transition-colors"
                                    >
                                        Quay lại Đăng nhập
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 2: OTP Input */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-[26px] font-bold text-[#1e3a8a] mb-2">Xác Thực OTP</h2>
                            <p className="text-gray-500 text-sm mb-6">Nhập mã 6 số chúng tôi vừa gửi cho bạn.</p>
                            
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div>
                                    <label className="block text-[#1e3a8a] font-bold text-sm mb-2">Mã OTP</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-md text-center text-2xl font-bold text-[#3b82f6] tracking-widest focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                                        placeholder="------"
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-full transition-colors h-[45px]"
                                >
                                    {loading ? 'Đang xác thực...' : 'Xác Nhận'}
                                </button>
                                
                                <div className="text-center mt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)} 
                                        className="text-gray-500 hover:text-[#3b82f6] text-sm transition-colors"
                                    >
                                        Quay lại nhập Email
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 3: New Password Input */}
                    {step === 3 && (
                        <div className="animate-fade-in">
                            <h2 className="text-[26px] font-bold text-[#1e3a8a] mb-8">Đặt Lại Mật Khẩu</h2>
                            
                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div>
                                    <label className="block text-[#1e3a8a] font-bold text-sm mb-2">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
                                        required
                                        minLength="6"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[#1e3a8a] font-bold text-sm mb-2">Nhập lại mật khẩu</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors"
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full transition-colors mt-4 h-[45px]"
                                >
                                    {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuenMatKhau;