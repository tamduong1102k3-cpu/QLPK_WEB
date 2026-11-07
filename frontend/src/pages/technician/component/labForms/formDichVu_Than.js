// Form cấu hình riêng cho dịch vụ: Chức năng Thận (Ure, Creatinine) - mã 11
export default {
  maDichVu: 11,
  tenDichVu: 'Chức năng Thận (Ure, Creatinine)',
  fields: [
    { key: 'ure', maChiSo: 29, label: 'Ure', type: 'number', donVi: 'mmol/L', giaTriBinhThuong: '2.5-7.5' },
    { key: 'creatinine', maChiSo: 30, label: 'Creatinine', type: 'number', donVi: 'µmol/L', giaTriBinhThuong: 'Nam: 62-106; Nữ: 44-88' }
  ]
};