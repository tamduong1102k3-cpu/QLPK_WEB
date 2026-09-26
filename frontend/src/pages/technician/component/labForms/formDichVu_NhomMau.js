// Form cấu hình riêng cho dịch vụ: Xét nghiệm Nhóm máu (ABO, Rh) - mã 13
export default {
  maDichVu: 13,
  tenDichVu: 'Xét nghiệm Nhóm máu (ABO, Rh)',
  fields: [
    {
      key: 'nhom_mau_abo',
      maChiSo: 41,
      label: 'Nhóm máu ABO',
      type: 'select',
      options: ['A', 'B', 'AB', 'O'],
      giaTriBinhThuong: 'A/B/AB/O',
      donVi: null
    },
    {
      key: 'rh_d',
      maChiSo: 42,
      label: 'Rh(D)',
      type: 'select',
      options: ['Dương tính', 'Âm tính'],
      giaTriBinhThuong: 'Dương tính/Âm tính',
      donVi: null
    }
  ]
};