// Form cấu hình riêng cho dịch vụ: Chức năng Gan (AST, ALT, GGT) - mã 10
export default {
  maDichVu: 10,
  tenDichVu: 'Chức năng Gan (AST, ALT, GGT)',
  fields: [
    { key: 'ast', maChiSo: 26, label: 'AST (GOT)', type: 'number', donVi: 'U/L', giaTriBinhThuong: 'Nam: < 40; Nữ: < 35' },
    { key: 'alt', maChiSo: 27, label: 'ALT (GPT)', type: 'number', donVi: 'U/L', giaTriBinhThuong: 'Nam: < 41; Nữ: < 33' },
    { key: 'ggt', maChiSo: 28, label: 'GGT', type: 'number', donVi: 'U/L', giaTriBinhThuong: 'Nam: 10-71; Nữ: 6-42' }
  ]
};