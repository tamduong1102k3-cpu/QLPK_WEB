import React, { useState, useEffect } from 'react';
import { getByPhieuKhamApi } from '../../api/chiSoKhamTongHopApi';
import { useNotification } from '../../components/NotificationContext';
import AssistantLayout from '../../components/AssistantLayout';
import TabKhamNhi from '../doctor/components/TabKhamNhi';

const TroLyNhiForm = ({ selectedPatient, user, onSaved, initialTab = 'vitals', onBack }) => {
  const { showError } = useNotification();
  const [vitals, setVitals] = useState({
    nhietDo: '', nhipTim: '', huyetApThu: '', huyetApTruong: '',
    nhipTho: '', canNang: '', chieuCao: '', spo2: '', vongDau: '', ghiChu: ''
  });

  const [examData, setExamData] = useState({
    tinhTrangDinhDuong: '', tamLyHanhVi: '', khamTaiMuiHongNhi: '',
    khamHoHapNhi: '', khamDaNiemMacNhi: '', khamDuNiemMacNhi: '',
    coQuanKhacNhi: '', ghiChu: ''
  });

  useEffect(() => {
    if (selectedPatient?.maPhieuKham) {
      getByPhieuKhamApi(selectedPatient.maPhieuKham).then(data => {
        if (data) {
          setVitals({
            nhietDo: data.nhietDo ?? '', nhipTim: data.nhipTim ?? '',
            huyetApThu: data.huyetApTamThu ?? '', huyetApTruong: data.huyetApTamTruong ?? '',
            nhipTho: data.nhipTho ?? '', canNang: data.canNang ?? '',
            chieuCao: data.chieuCao ?? '', spo2: data.spo2 ?? '',
            vongDau: data.vongDau ?? '', ghiChu: data.ghiChu ?? selectedPatient?.ghiChu ?? ''
          });
          setExamData({
            tinhTrangDinhDuong: data.tinhTrangDinhDuong ?? '', tamLyHanhVi: data.tamLyHanhVi ?? '',
            khamTaiMuiHongNhi: data.khamTaiMuiHongNhi ?? '', khamHoHapNhi: data.khamHoHapNhi ?? '',
            khamDaNiemMacNhi: data.khamDaNiemMacNhi ?? '', khamDuNiemMacNhi: data.khamDuNiemMacNhi ?? '',
            coQuanKhacNhi: data.coQuanKhacNhi ?? '', ghiChu: data.ghiChu ?? ''
          });
        }
      }).catch(e => console.error("Lỗi load Nhi:", e));
    }
  }, [selectedPatient?.maPhieuKham, selectedPatient?.ghiChu]);

  // Validate Nhi exam data: bắt buộc nhập tình trạng dinh dưỡng và tâm lý hành vi
  const validateNhiExam = (data) => {
    const errors = [];
    if (!data.tinhTrangDinhDuong || !data.tinhTrangDinhDuong.toString().trim()) {
      errors.push('Vui lòng nhập tình trạng dinh dưỡng');
    }
    if (!data.tamLyHanhVi || !data.tamLyHanhVi.toString().trim()) {
      errors.push('Vui lòng nhập tâm lý hành vi');
    }
    return errors.length > 0 ? errors : null;
  };

  return (
    <AssistantLayout
      selectedPatient={selectedPatient}
      user={user}
      onSaved={onSaved}
      onBack={onBack}
      initialTab={initialTab}
      specialtyLabel="Khám Nhi Khoa"
      vitalsFields={vitals}
      setVitalsFields={setVitals}
      examData={examData}
      setExamData={setExamData}
      validateExamData={validateNhiExam}
      confirmMessage="Xác nhận hoàn tất quy trình trợ lý và chuyển hồ sơ cho Bác sĩ Nhi khoa?"
        specialtyForm={
          <TabKhamNhi maPhieuKham={selectedPatient.maPhieuKham} examData={examData} setExamData={setExamData} isAssistant={true} user={user} />
        }
    />
  );
};

export default TroLyNhiForm;