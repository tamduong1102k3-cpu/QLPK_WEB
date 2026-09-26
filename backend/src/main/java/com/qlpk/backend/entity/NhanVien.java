package com.qlpk.backend.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "nhan_vien")
public class NhanVien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nhan_vien")
    private Integer maNhanVien;

    @Column(name = "ho_ten", nullable = false, length = 40)
    private String hoTen;

    @Column(name = "gioi_tinh")
    private Integer gioiTinh; 

    @Column(name = "ngay_sinh")
    @Temporal(TemporalType.DATE)
    private Date ngaySinh;

    @Column(name = "cccd", nullable = false, length = 20)
    private String cccd;

    @Column(name = "dia_chi", length = 255)
    private String diaChi;

    @Column(name = "so_dien_thoai", length = 12)
    private String soDienThoai;

    @Column(name = "email", length = 40)
    private String email;

    @Column(name = "chuyen_khoa")
    private Integer chuyenKhoa;

    @Column(name = "bang_cap", length = 100)
    private String bangCap;

    @Column(name = "chuc_vu", length = 40)
    private String chucVu;

    @Column(name = "ngay_vao_lam")
    @Temporal(TemporalType.DATE)
    private Date ngayVaoLam;

    public Integer getMaNhanVien() { return maNhanVien; }
    public void setMaNhanVien(Integer maNhanVien) { this.maNhanVien = maNhanVien; }

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
}
