package com.qlpk.backend.dto;

import lombok.Data;

@Data
public class CreateDangKyKhamBenhRequest {
    private Integer maBenhNhan;
    private Integer maNhanVien;
    private Integer maChuyenKhoa;
    private Integer maPhong;
    private Integer maDichVu;
    private Long version;
    private Integer maLichKham;
    private String ghiChu;

    private Boolean xacNhanCccd;
}
