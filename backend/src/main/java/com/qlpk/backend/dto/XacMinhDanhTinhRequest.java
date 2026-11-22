package com.qlpk.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class XacMinhDanhTinhRequest {
    @NotBlank(message = "Vui lòng nhập họ và tên")
    private String hoTen;

    private LocalDate ngaySinh;
    private Boolean gioiTinh;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    private String soDienThoai;

    @NotBlank(message = "Vui lòng nhập CCCD/CMND")
    private String cccd;

    private String email;
    private String diaChi;
    private String ngheNghiep;
    private String nhomMau;
    private String diUngThuoc;
    private String tienSuBenh;
    private String nguoiGiamHo;
    private String soDienThoaiNguoiGiamHo;
    private String ghiChu;
}
