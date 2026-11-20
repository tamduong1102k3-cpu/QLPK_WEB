package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "phieu_nhap_thuoc")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhieuNhapThuoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phieu_nhap_thuoc")
    private Integer maPhieuNhapThuoc;

    @Column(name = "ngay_nhap")
    private LocalDateTime ngayNhap;

    @Column(name = "ma_nhan_vien_nhap")
    private Integer maNhanVienNhap;

    @Column(name = "ma_nha_cung_cap")
    private Integer maNhaCungCap;

    @Column(name = "tong_tien_nhap", precision = 10, scale = 2)
    private BigDecimal tongTienNhap;

    @Column(name = "trang_thai", length = 50)
    private String trangThai;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;
}
