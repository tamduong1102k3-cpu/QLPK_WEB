import React, { useState, useEffect, useCallback } from 'react';
import TheThongKe from './TheThongKe';
import { getTodayApi as getTodayDangKyApi } from '../../../api/dangKyKhamBenhApi';
import { getTodayResultsApi as getTodayResultsXetNghiemApi } from '../../../api/ketQuaXetNghiemApi';
import { getTodayResultsApi as getTodayResultsCdhaApi } from '../../../api/ketQuaCdhaApi';
import { getCurrentRoomApi } from '../../../api/shiftApi';
import { getAllApi as getAllAppointmentsApi } from '../../../api/appointmentApi';
import { getTodayApi as getTodayPhieuKhamApi } from '../../../api/phieuKhamApi';

const NhomOSoLieu = ({ user }) => {
  const [stats, setStats] = useState({
    waitingToday: 0,
    processedToday: 0,
    absentToday: 0,
    appointmentsToday: 0,
  });
  const [currentRoom, setCurrentRoom] = useState('Đang tải...');

  const vaiTro = user?.vaiTro || '';
  const isLeTan = vaiTro === 'LE_TAN';
  const isTroLy = vaiTro.startsWith('TRO_LY_') || vaiTro === 'TRO_LY_BAC_SI';
  const isBacSi = vaiTro.startsWith('BAC_SI_') || vaiTro === 'BAC_SI';

  // Mã chuyên khoa: 1: Nội, 3: Nhi, 4: TMH, 5: RHM, 7: XN, 11: Tim mạch, 12: CĐHA
  const isXetNghiemDoc = Number(user?.maChuyenKhoa) === 7;
  const isCdhaDoc = Number(user?.maChuyenKhoa) === 12;
  const isRhmDoc = Number(user?.maChuyenKhoa) === 5;

  const fetchData = useCallback(async () => {
    try {
      if (isLeTan) {
        const appointments = await getAllAppointmentsApi();
        const todayApp = appointments.filter(a => {
          const d = new Date(a.ngayTaiKham);
          const today = new Date();
          return d.getDate() === today.getDate() && 
                 d.getMonth() === today.getMonth() && 
                 d.getFullYear() === today.getFullYear();
        }).length;

        const registrations = await getTodayDangKyApi();
        const waitingRegs = registrations.filter(r => r.trangThai === 'CHO_KHAM').length;

        const pks = await getTodayPhieuKhamApi();
        const completed = pks.filter(p => p.trangThai === 'HOAN_THANH').length;

        setStats({
          appointmentsToday: todayApp,
          waitingToday: waitingRegs,
          processedToday: completed,
          absentToday: 0
        });

      } else if (isTroLy) {
        const data = await getTodayDangKyApi();
        if (data) {
          let filteredData = data;
          if (user?.maChuyenKhoa) {
            filteredData = data.filter(r => Number(r.maChuyenKhoa) === Number(user.maChuyenKhoa));
          }
          const waiting = filteredData.filter(r => r.trangThai === 'CHO_KHAM' || r.trangThai === 'DANG_KHAM').length;
          const absent = filteredData.filter(r => r.trangThai === 'VANG_MAT').length;
          const processed = filteredData.filter(r => r.trangThai === 'CHO_BAC_SI' || r.trangThai === 'HOAN_THANH').length;

          setStats({
            waitingToday: waiting,
            absentToday: absent,
            processedToday: processed,
            appointmentsToday: 0
          });
        }

      } else {
        let data = null;
        if (isXetNghiemDoc) {
          data = await getTodayResultsXetNghiemApi();
        } else if (isCdhaDoc) {
          data = await getTodayResultsCdhaApi();
        } else {
          data = await getTodayDangKyApi();
        }

        if (data) {
          let waiting = [];
          let completed = [];
          if (isXetNghiemDoc || isCdhaDoc) {
            waiting = data.filter(r => r.trangThai === 'CHO_DUYET');
            completed = data.filter(r => r.trangThai === 'DA_DUYET' || r.trangThai === 'HOAN_THANH' || r.trangThai === 'CHO_BAC_SI');
          } else {
            if (user?.maChuyenKhoa) {
              data = data.filter(r => Number(r.maChuyenKhoa) === Number(user.maChuyenKhoa));
            }
            waiting = data.filter(r => r.trangThai === 'CHO_BAC_SI' || r.trangThai === 'DA_KHAM_LAM_SANG' || (isRhmDoc && r.trangThai === 'DANG_KHAM'));
            completed = data.filter(r => r.trangThai === 'HOAN_THANH');
          }
          setStats({
            waitingToday: waiting.length,
            processedToday: completed.length,
            absentToday: 0,
            appointmentsToday: 0
          });
        }
      }

      if (user?.maNhanVien) {
        const roomData = await getCurrentRoomApi(user.maNhanVien);
        setCurrentRoom(roomData?.tenPhong || 'Chưa có lịch trực');
      } else {
        setCurrentRoom(isLeTan ? 'Quầy tiếp đón' : 'Chưa xác định');
      }
    } catch (error) {
      console.error("Error fetching stats in NhomOSoLieu:", error);
    }
  }, [user, isLeTan, isTroLy, isBacSi, isXetNghiemDoc, isCdhaDoc, isRhmDoc]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLeTan) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 animate-fade-in">
        <TheThongKe title="Hẹn Hôm Nay" value={stats.appointmentsToday} icon="event" color="bg-blue-500" />
        <TheThongKe title="Đang Chờ Khám" value={stats.waitingToday} icon="hourglass_empty" color="bg-orange-500" />
        <TheThongKe title="Đã Hoàn Thành" value={stats.processedToday} icon="check_circle" color="bg-emerald-500" />
        <TheThongKe title="Phòng Đang Trực" value={currentRoom} icon="door_front" color="bg-indigo-500" />
      </div>
    );
  }

  if (isTroLy) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 animate-fade-in">
        <TheThongKe title="Chờ Trợ Lý" value={stats.waitingToday} icon="hourglass_top" color="bg-orange-500" />
        <TheThongKe title="Vắng Mặt" value={stats.absentToday} icon="person_off" color="bg-red-500" />
        <TheThongKe title="Đã Chuyển BS" value={stats.processedToday} icon="task_alt" color="bg-green-500" />
        <TheThongKe title="Phòng Đang Trực" value={currentRoom} icon="door_front" color="bg-indigo-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 animate-fade-in">
      <TheThongKe 
        title="Đang Chờ Khám" 
        value={stats.waitingToday} 
        icon="hourglass_empty" 
        color="bg-amber-500" 
      />
      <TheThongKe 
        title="Đã Hoàn Thành" 
        value={stats.processedToday} 
        icon="check_circle" 
        color="bg-emerald-500" 
      />
      <TheThongKe 
        title="Phòng Đang Trực" 
        value={currentRoom} 
        icon="door_front" 
        color="bg-indigo-500" 
      />
    </div>
  );
};

export default NhomOSoLieu;
