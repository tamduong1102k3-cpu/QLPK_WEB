import React, { useEffect, useState } from 'react';

const PaymentResult = () => {
  const [params, setParams] = useState({
    status: '',
    maHoaDon: '',
    message: '',
    transactionNo: '',
    payDate: '',
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      status: searchParams.get('status') || '',
      maHoaDon: searchParams.get('maHoaDon') || '',
      message: searchParams.get('message') || '',
      transactionNo: searchParams.get('transactionNo') || '',
      payDate: searchParams.get('payDate') || '',
    });
  }, []);

  const formatPayDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 14) return dateStr || '—';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = parseInt(dateStr.substring(8, 10), 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    const period = hour >= 12 ? 'CH' : 'SA';
    const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${day}/${month}/${year} ${formattedHour}:${minute}:${second} ${period}`;
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  const isSuccess = params.status === 'success';
  const isFail = params.status !== 'success';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="bg-white rounded-[2rem] p-10 max-w-[480px] w-full shadow-2xl border border-slate-100 flex flex-col items-center gap-8 relative overflow-hidden animate-fade-in">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r ${
          isSuccess 
            ? 'from-emerald-400 to-teal-500' 
            : 'from-rose-400 to-amber-500'
        } rounded-b-full`} />

        {/* Status Icon */}
        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 ${
          isSuccess 
            ? 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10' 
            : 'bg-rose-50 text-rose-500 shadow-rose-500/10'
        }`}>
          <span className="material-symbols-outlined text-[64px] font-black">
            {isSuccess ? 'check_circle' : 'cancel'}
          </span>
        </div>

        {/* Status Text */}
        <div className="text-center px-4">
          <h2 className="font-black text-gray-800 text-2xl mb-2">
            {isSuccess 
              ? 'Thanh Toán Thành Công' 
              : 'Thanh Toán Thất Bại'}
          </h2>
          {params.message && (
            <p className="text-sm text-rose-500 font-semibold mb-3 max-w-[320px] mx-auto leading-relaxed">
              {params.message}
            </p>
          )}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Cổng Thanh Toán VNPay
          </p>
        </div>

        {/* Transaction Details */}
        <div className="w-full bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col gap-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Mã hóa đơn</span>
            <span className="font-extrabold text-slate-800 bg-white border border-slate-100 px-3 py-1 rounded-lg">
              #{params.maHoaDon ? params.maHoaDon.padStart(4, '0') : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Phương thức</span>
            <span className="font-black text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-blue-600">credit_card</span>
              VNPay
            </span>
          </div>

          {params.transactionNo && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Mã tra cứu</span>
              <span className="font-extrabold text-slate-800 bg-white border border-slate-100 px-3 py-1 rounded-lg">
                {params.transactionNo}
              </span>
            </div>
          )}

          {params.payDate && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Thời gian</span>
              <span className="font-extrabold text-slate-800">
                {formatPayDate(params.payDate)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start text-xs pt-3 border-t border-dashed border-slate-200">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Trạng thái</span>
            <span className={`font-black text-right ${
              isSuccess ? 'text-emerald-600' : 'text-rose-500'
            } max-w-[180px] break-words`}>
              {isSuccess 
                ? 'Đã ghi nhận thanh toán' 
                : params.message || 'Giao dịch không thành công'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleBack}
          className={`w-full py-4 font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] ${
            isSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20'
          }`}
        >
          {isSuccess ? 'Về trang Thu Ngân' : 'Quay lại Thử Lại'}
        </button>
      </div>
    </div>
  );
};

export default PaymentResult;