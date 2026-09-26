import { getAllApi as _getAllAppointments } from '../../../api/appointmentApi';
import React, { useState, useEffect } from 'react';


const LichHenHomNay = ({ onCheckIn }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async ()=>({ ok: true, json: async ()=>await _getAllAppointments() }))()
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const today = new Date();
        const filtered = data.filter(a => {
          const d = new Date(a.ngayTaiKham);
          return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        });
        setAppointments(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-4 text-gray-400 italic text-sm">Đang tải...</div>;
  if (appointments.length === 0) return <div className="text-center py-8 text-gray-400 text-sm">Không có lịch hẹn hôm nay</div>;

  return appointments.map((a) => (
    <div key={a.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
          <span className="material-symbols-outlined text-xl">schedule</span>
        </div>
        <div>
          <p className="font-bold text-sm text-gray-800">{a.tenBenhNhan}</p>
          <p className="text-[11px] text-gray-500">Bác sĩ: {a.tenNhanVien}</p>
          <p className="text-[11px] text-gray-500">Ca: {a.tenCa || 'Chưa cập nhật'}{a.tenCa ? ` (${a.gioBatDau || ''} - ${a.gioKetThuc || ''})` : ''}</p>
        </div>
      </div>
      <button 
        onClick={onCheckIn}
        className="text-[11px] font-bold bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 shadow-sm shadow-green-500/20 transition-all"
      >
        Check-in
      </button>
    </div>
  ));
};

export default LichHenHomNay;

