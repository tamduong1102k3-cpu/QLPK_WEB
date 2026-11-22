package com.qlpk.backend.dto;

import lombok.Data;

@Data
public class AppointmentRequest {
    private Integer maBenhNhan;
    private Integer maChuyenKhoa;
    private Integer maBacSi;
    private Integer maNhanVien;        // alias cho maBacSi
    private Integer maDichVu;
    private Integer maPhong;
    private Integer maPhieuKham;       // mã phiếu khám, dùng để lookup maDichVu + maChuyenKhoa
    private Integer maDangKyKhamBenh;
    private Integer maCa;
    private String nguonTao;           // "DAT_LICH_APP" hoặc "TAI_KHAM"
    private String ngayKham;           // "2026-07-28"
    private String ngayTaiKham;        // alias cho ngayKham
    private String trangThai;
    private String ghiChu;
    private String lyDoHoan;
}
