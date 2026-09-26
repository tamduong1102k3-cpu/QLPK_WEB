package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "thuoc")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Thuoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_thuoc")
    private Integer maThuoc;

    @Column(name = "ten_thuoc", length = 50)
    private String tenThuoc;

    @Column(name = "hoat_chat", length = 50)
    private String hoatChat;

    @Column(name = "ham_luong", length = 100)
    private String hamLuong;

    @Column(name = "dang_thuoc", length = 50)
    private String dangThuoc;

    @Column(name = "loai_thuoc", length = 10)
    private String loaiThuoc;

    @Column(name = "don_vi_tinh", length = 20)
    private String donViTinh;

    @Column(name = "don_gia_nhap", precision = 15, scale = 2)
    private BigDecimal donGiaNhap;

    @Column(name = "don_gia_ban", precision = 15, scale = 2)
    private BigDecimal donGiaBan;

    @Column(name = "ngay_san_xuat")
    private LocalDate ngaySanXuat;

    @Column(name = "han_su_dung")
    private LocalDate hanSuDung;

    @Column(name = "nha_san_xuat", length = 50)
    private String nhaSanXuat;

    @Column(name = "nuoc_san_xuat", length = 30)
    private String nuocSanXuat;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
