// Form cấu hình riêng cho dịch vụ: Tổng phân tích nước tiểu - mã 12
export default {
  maDichVu: 12,
  tenDichVu: 'Tổng phân tích nước tiểu',
  fields: [
    { key: 'protein', maChiSo: 31, label: 'Protein', type: 'radio', options: ['Âm tính', 'Dương tính'], giaTriBinhThuong: 'Âm tính', donVi: 'mg/dL' },
    { key: 'glucose', maChiSo: 32, label: 'Glucose', type: 'radio', options: ['Âm tính', 'Dương tính'], giaTriBinhThuong: 'Âm tính', donVi: 'mg/dL' },
    { key: 'hong_cau', maChiSo: 33, label: 'Hồng cầu', type: 'radio', options: ['Âm tính', 'Dương tính'], giaTriBinhThuong: 'Âm tính', donVi: 'RBC/µL' },
    { key: 'bach_cau', maChiSo: 34, label: 'Bạch cầu', type: 'radio', options: ['Âm tính', 'Dương tính'], giaTriBinhThuong: 'Âm tính', donVi: 'WBC/µL' },
    { key: 'nitrite', maChiSo: 35, label: 'Nitrite', type: 'radio', options: ['Âm tính', 'Dương tính'], giaTriBinhThuong: 'Âm tính', donVi: null },
    { key: 'ketone', maChiSo: 36, label: 'Ketone', type: 'radio', options: ['Âm tính', 'Dương tính'], giaTriBinhThuong: 'Âm tính', donVi: 'mg/dL' },
    { key: 'bilirubin', maChiSo: 37, label: 'Bilirubin', type: 'radio', options: ['Âm tính', 'Dương tính'], giaTriBinhThuong: 'Âm tính', donVi: 'mg/dL' },
    { key: 'urobilinogen', maChiSo: 38, label: 'Urobilinogen', type: 'radio', options: ['Bình thường', 'Bất thường'], giaTriBinhThuong: 'Bình thường', donVi: 'mg/dL' },
    { key: 'ph', maChiSo: 39, label: 'pH', type: 'number', donVi: null, giaTriBinhThuong: '5.0-8.0' },
    { key: 'ty_trong', maChiSo: 40, label: 'Tỷ trọng', type: 'number', donVi: null, giaTriBinhThuong: '1.005-1.030' }
  ]
};