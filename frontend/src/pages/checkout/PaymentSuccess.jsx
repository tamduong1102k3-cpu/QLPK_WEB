import React, { useEffect, useState } from 'react';

const PaymentSuccess = () => {
  const [params, setParams] = useState({
    maHoaDon: '',
    transactionNo: '',
    payDate: '',
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      maHoaDon: searchParams.get('maHoaDon') || '',
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-b-full" />
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[48px] text-green-500 font-black">check_circle</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-500 mb-6">
          Cảm ơn bạn đã sử dụng dịch vụ. Hóa đơn của bạn đã được thanh toán qua VNPay.
        </p>
        {(params.maHoaDon || params.transactionNo || params.payDate) && (
          <div className="w-full bg-slate-50/80 rounded-2xl p-5 border border-slate-100 flex flex-col gap-3.5 text-left mb-6">
            {params.maHoaDon && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Mã hóa đơn</span>
                <span className="font-extrabold text-slate-800 bg-white border border-slate-100 px-3 py-1 rounded-lg">
                  #{params.maHoaDon.padStart(4, '0')}
                </span>
              </div>
            )}
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
                <span className="font-extrabold text-slate-800">{formatPayDate(params.payDate)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Trạng thái</span>
              <span className="font-black text-emerald-600">Đã ghi nhận thanh toán</span>
            </div>
          </div>
        )}
        <button
          onClick={() => { window.location.href = '/'; }}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-bold text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
