// Form cấu hình riêng cho dịch vụ: Xét nghiệm Viêm gan B (HBsAg test nhanh) - mã 14
export default {
  maDichVu: 14,
  tenDichVu: 'Xét nghiệm Viêm gan B (HBsAg test nhanh)',
  fields: [
    {
      key: 'hbsag',
      maChiSo: 43,
      label: 'HBsAg',
      type: 'select',
      options: ['Âm tính', 'Dương tính'],
      giaTriBinhThuong: 'Âm tính',
      donVi: null
    }
  ]
};