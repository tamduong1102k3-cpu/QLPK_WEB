package com.qlpk.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;

import java.util.Date;

public class NhanVienRequestDTO {
    @NotBlank(message = "Họ và tên không được để trống")
    private String hoTen;
    private Integer gioiTinh;
    @PastOrPresent(message = "Ngày sinh không được ở tương lai")
    private Date ngaySinh;
    @NotBlank(message = "CCCD không được để trống")
    @Pattern(regexp = "^(?:\\d{9}|\\d{12})$", message = "CCCD phải có 9 hoặc 12 chữ số")
    private String cccd;
    private String diaChi;
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải có 10 số và bắt đầu bằng 0")
    private String soDienThoai;
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Email không hợp lệ")
    private String email;
    private Integer chuyenKhoa;
    private String bangCap;
    @NotBlank(message = "Chức vụ không được để trống")
    private String chucVu;
    @PastOrPresent(message = "Ngày vào làm không được ở tương lai")
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
