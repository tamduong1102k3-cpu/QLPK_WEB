package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "ct_phieu_nhap_thuoc")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietPhieuNhapThuoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ma_phieu_nhap_thuoc")
    private Integer maPhieuNhapThuoc;

    @Column(name = "ma_thuoc")
    private Integer maThuoc;

    @Column(name = "so_luong_nhap")
    private Integer soLuongNhap;

    @Column(name = "don_gia_nhap", precision = 10, scale = 2)
    private BigDecimal donGiaNhap;

    @Column(name = "thanh_tien", precision = 15, scale = 7)
    private BigDecimal thanhTien;

    @Column(name = "ma_ncc")
    private Integer maNcc;
}
