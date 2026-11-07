package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "benh_nhan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BenhNhan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_benh_nhan")
    private Integer maBenhNhan;

    @Column(name = "ho_ten", length = 30)
    private String hoTen;

    @Column(name = "ngay_sinh")
    private LocalDate ngaySinh;

    @Column(name = "dia_chi", length = 255)
    private String diaChi;

    @Column(name = "so_dien_thoai", length = 20)
    private String soDienThoai;

    @Column(name = "email", length = 50)
    private String email;

    @Column(name = "nghe_nghiep", length = 30)
    private String ngheNghiep;

    @Column(name = "nhom_mau", length = 20)
    private String nhomMau;

    @Column(name = "di_ung_thuoc", length = 50)
    private String diUngThuoc;

    @Column(name = "tien_su_benh", length = 255)
    private String tienSuBenh;

    @Column(name = "nguoi_giam_ho", length = 30)
    private String nguoiGiamHo;

    @Column(name = "so_dien_thoai_nguoi_giam_ho", length = 20)
    private String soDienThoaiNguoiGiamHo;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "cccd", length = 20)
    private String cccd;

    @Column(name = "gioi_tinh")
    private Boolean gioiTinh;

    @Column(name = "da_xac_minh_danh_tinh", nullable = false)
    private Boolean daXacMinhDanhTinh = false;

    @Column(name = "so_lan_qua_hen", nullable = false)
    private Integer soLanQuaHen = 0;
}
