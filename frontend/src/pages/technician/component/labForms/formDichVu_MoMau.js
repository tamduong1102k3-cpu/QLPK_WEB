// Form cấu hình riêng cho dịch vụ: Bộ mỡ máu (Cholesterol, Triglyceride...) - mã 9
export default {
  maDichVu: 9,
  tenDichVu: 'Bộ mỡ máu (Cholesterol, Triglyceride...)',
  fields: [
    { key: 'cholesterol', maChiSo: 22, label: 'Cholesterol toàn phần', type: 'number', donVi: 'mmol/L', giaTriBinhThuong: '< 5.2' },
    { key: 'triglyceride', maChiSo: 23, label: 'Triglyceride', type: 'number', donVi: 'mmol/L', giaTriBinhThuong: '< 1.7' },
    { key: 'hdl_c', maChiSo: 24, label: 'HDL-C', type: 'number', donVi: 'mmol/L', giaTriBinhThuong: '> 1.0' },
    { key: 'ldl_c', maChiSo: 25, label: 'LDL-C', type: 'number', donVi: 'mmol/L', giaTriBinhThuong: '< 3.4' }
  ]
};