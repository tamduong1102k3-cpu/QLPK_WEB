package com.qlpk.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BenhNhanDTO {
    private Integer maBenhNhan;
    private String hoTen;
    private LocalDate ngaySinh;
    private String diaChi;
    private String soDienThoai;
    private String email;
    private String ngheNghiep;
    private String nhomMau;
    private String diUngThuoc;
    private String nguoiGiamHo;
    private String soDienThoaiNguoiGiamHo;
    private String ghiChu;
    private String cccd;
    private Boolean gioiTinh;
}
