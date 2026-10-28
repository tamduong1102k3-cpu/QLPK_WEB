import React, { useState, useEffect } from 'react';
import { getByPhieuKhamApi } from '../../api/chiSoKhamTongHopApi';
import AssistantLayout from '../../components/AssistantLayout';
import TabKhamTimMach from '../doctor/components/TabKhamTimMach';

const TroLyTimMachForm = ({ selectedPatient, user, onSaved, initialTab = 'vitals', onBack }) => {
  const [vitals, setVitals] = useState({
    nhietDo: '', nhipTim: '', huyetApThu: '', huyetApTruong: '',
    nhipTho: '', canNang: '', chieuCao: '', spo2: '', ghiChu: ''
  });

  const [examData, setExamData] = useState({
    cholesterol: '', hdlCholesterol: '', ldlCholesterol: '',
    triglyceride: '', duongHuyet: '', ecgKetQua: '', sieuAmTim: ''
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
            ghiChu: data.ghiChu ?? selectedPatient?.ghiChu ?? ''
          });
          setExamData({
            cholesterol: data.cholesterol ?? '', hdlCholesterol: data.hdlCholesterol ?? '',
            ldlCholesterol: data.ldlCholesterol ?? '', triglyceride: data.triglyceride ?? '',
            duongHuyet: data.duongHuyet ?? '', ecgKetQua: data.ecgKetQua ?? '',
            sieuAmTim: data.sieuAmTim ?? ''
          });
        }
      }).catch(e => console.error("Lỗi load:", e));
    }
  }, [selectedPatient?.maPhieuKham, selectedPatient?.ghiChu]);

  // Validate Tim Mach exam data: tất cả các field chuyên khoa không được để trống
  const validateTimMachExam = (data) => {
    const errors = [];
    const fieldLabels = {
      cholesterol: 'Cholesterol',
      hdlCholesterol: 'HDL-Cholesterol',
      ldlCholesterol: 'LDL-Cholesterol',
      triglyceride: 'Triglyceride',
      duongHuyet: 'Đường huyết',
      ecgKetQua: 'Điện tâm đồ (ECG)',
      sieuAmTim: 'Siêu âm tim'
    };
    Object.entries(fieldLabels).forEach(([field, label]) => {
      if (!data[field] || !data[field].toString().trim()) {
        errors.push(label + ' không được để trống');
      }
    });
    return errors.length > 0 ? errors : null;
  };

  return (
    <AssistantLayout
      selectedPatient={selectedPatient}
      user={user}
      onSaved={onSaved}
      onBack={onBack}
      initialTab={initialTab}
      specialtyLabel="Khám Tim Mạch"
      vitalsFields={vitals}
      setVitalsFields={setVitals}
      examData={examData}
      setExamData={setExamData}
      validateExamData={validateTimMachExam}
      payloadExtras={() => {
        const p = {};
        if (examData.cholesterol !== '') p.cholesterol = parseFloat(examData.cholesterol) || null;
        if (examData.hdlCholesterol !== '') p.hdlCholesterol = parseFloat(examData.hdlCholesterol) || null;
        if (examData.ldlCholesterol !== '') p.ldlCholesterol = parseFloat(examData.ldlCholesterol) || null;
        if (examData.triglyceride !== '') p.triglyceride = parseFloat(examData.triglyceride) || null;
        if (examData.duongHuyet !== '') p.duongHuyet = parseFloat(examData.duongHuyet) || null;
        return p;
      }}
        specialtyForm={
          <TabKhamTimMach maPhieuKham={selectedPatient.maPhieuKham} examData={examData} setExamData={setExamData} isAssistant={true} user={user} />
        }
    />
  );
};
export default TroLyTimMachForm;