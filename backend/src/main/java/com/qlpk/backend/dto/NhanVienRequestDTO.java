package com.qlpk.backend.dto;

import java.util.Date;

public class NhanVienRequestDTO {
    private String hoTen;
    private Integer gioiTinh;
    private Date ngaySinh;
    private String cccd;
    private String diaChi;
    private String soDienThoai;
    private String email;
    private Integer chuyenKhoa;
    private String bangCap;
    private String chucVu;
    private Date ngayVaoLam;
    private String username;
    private String role;

    // Getters and Setters
    public String getHoTen() { return hoTen; }
    public void setHoTen(String hoTen) { this.hoTen = hoTen; }

    public Integer getGioiTinh() { return gioiTinh; }
    public void setGioiTinh(Integer gioiTinh) { this.gioiTinh = gioiTinh; }

    public Date getNgaySinh() { return ngaySinh; }
    public void setNgaySinh(Date ngaySinh) { this.ngaySinh = ngaySinh; }

    public String getCccd() { return cccd; }
    public void setCccd(String cccd) { this.cccd = cccd; }

    public String getDiaChi() { return diaChi; }
    public void setDiaChi(String diaChi) { this.diaChi = diaChi; }

    public String getSoDienThoai() { return soDienThoai; }
    public void setSoDienThoai(String soDienThoai) { this.soDienThoai = soDienThoai; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getChuyenKhoa() { return chuyenKhoa; }
    public void setChuyenKhoa(Integer chuyenKhoa) { this.chuyenKhoa = chuyenKhoa; }

    public String getBangCap() { return bangCap; }
    public void setBangCap(String bangCap) { this.bangCap = bangCap; }

    public String getChucVu() { return chucVu; }
    public void setChucVu(String chucVu) { this.chucVu = chucVu; }

    public Date getNgayVaoLam() { return ngayVaoLam; }
    public void setNgayVaoLam(Date ngayVaoLam) { this.ngayVaoLam = ngayVaoLam; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
