package com.qlpk.backend.dto;

import java.time.LocalDateTime;

public class RegistrationDto {
    private Integer id;
    private String maBenhNhan;
    private String hoTen;
    private String soThuTu;
    private LocalDateTime thoiGian;
    private String tenChuyenKhoa;
    private String trangThai;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getMaBenhNhan() { return maBenhNhan; }
    public void setMaBenhNhan(String maBenhNhan) { this.maBenhNhan = maBenhNhan; }

    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public String getSoThuTu() { return soThuTu; }
    public void setSoThuTu(String soThuTu) { this.soThuTu = soThuTu; }

    public LocalDateTime getThoiGian() { return thoiGian; }
    public void setThoiGian(LocalDateTime thoiGian) { this.thoiGian = thoiGian; }

    public String getTenChuyenKhoa() { return tenChuyenKhoa; }
    public void setTenChuyenKhoa(String tenChuyenKhoa) { this.tenChuyenKhoa = tenChuyenKhoa; }

    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
}
