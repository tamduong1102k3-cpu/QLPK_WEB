package com.qlpk.backend.dto;

import com.qlpk.backend.entity.NguonTao;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AppointmentResponse {
    private Integer id;
    private Integer maLichKham;
    private Integer maBenhNhan;
    private String tenBenhNhan;
    private Integer maChuyenKhoa;
    private String tenChuyenKhoa;
    private Integer maBacSi;
    private String tenBacSi;
    private Integer maNhanVien;
    private String tenNhanVien;
    private Integer maDichVu;
    private String tenDichVu;
    private Integer maPhong;
    private String tenPhong;
    private Integer maDangKyKhamBenh;
    private Integer maLichKhamGoc;
    private Integer maLichKhamMoi;
    private Integer maCa;
    private String tenCa;
    private String gioBatDau;
    private String gioKetThuc;
    private NguonTao nguonTao;

    private Boolean daXacMinhDanhTinh;
    private String ngayKham;
    private String ngayTaiKham;
    private String trangThai;
    private Integer maNguoiCapNhat;
    private String ghiChu;
    private String lyDoHoan;
    private LocalDateTime ngayTao;
}
