package com.qlpk.backend.dto;

import lombok.Data;

@Data
public class AppointmentRequest {
    private Integer maBenhNhan;
    private Integer maChuyenKhoa;
    private Integer maBacSi;
    private Integer maNhanVien;        
    private Integer maDichVu;
    private Integer maPhong;
    private Integer maPhieuKham;       
    private Integer maDangKyKhamBenh;
    private Integer maCa;
    private String nguonTao;           
    private String ngayKham;           
    private String ngayTaiKham;        
    private String trangThai;
    private String ghiChu;
    private String lyDoHoan;
}
