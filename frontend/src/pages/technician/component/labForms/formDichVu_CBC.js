// Form cấu hình riêng cho dịch vụ: Tổng phân tích tế bào máu (CBC) - mã 7
export default {
  maDichVu: 7,
  tenDichVu: 'Tổng phân tích tế bào máu (CBC)',
  fields: [
    { key: 'hct', maChiSo: 13, label: 'Hồng cầu (RBC)', type: 'number', donVi: 'T/L', giaTriBinhThuong: 'Nam: 4.2-5.8; Nữ: 3.8-5.2' },
    { key: 'hgb', maChiSo: 14, label: 'Hemoglobin (HGB)', type: 'number', donVi: 'g/L', giaTriBinhThuong: 'Nam: 130-170; Nữ: 120-150' },
    { key: 'hct_pct', maChiSo: 15, label: 'Hematocrit (HCT)', type: 'number', donVi: '%', giaTriBinhThuong: 'Nam: 40-50; Nữ: 35-47' },
    { key: 'wbc', maChiSo: 16, label: 'Bạch cầu (WBC)', type: 'number', donVi: 'G/L', giaTriBinhThuong: '4.0-10.0' },
    { key: 'plt', maChiSo: 17, label: 'Tiểu cầu (PLT)', type: 'number', donVi: 'G/L', giaTriBinhThuong: '150-400' },
    { key: 'mcv', maChiSo: 18, label: 'Thể tích hồng cầu trung bình (MCV)', type: 'number', donVi: 'fL', giaTriBinhThuong: '80-100' },
    { key: 'mch', maChiSo: 19, label: 'Lượng huyết sắc tố trung bình (MCH)', type: 'number', donVi: 'pg', giaTriBinhThuong: '27-32' },
    { key: 'mchc', maChiSo: 20, label: 'Nồng độ huyết sắc tố trung bình (MCHC)', type: 'number', donVi: 'g/L', giaTriBinhThuong: '320-360' }
  ]
};