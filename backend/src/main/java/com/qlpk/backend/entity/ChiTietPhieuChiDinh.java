package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ct_phieu_chi_dinh")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietPhieuChiDinh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_ct_phieu_chi_dinh")
    private Integer maCtPhieuChiDinh;

    @Column(name = "ma_phieu_chi_dinh")
    private Integer maPhieuChiDinh;

    @Column(name = "ma_dich_vu")
    private Integer maDichVu;

    @Column(name = "don_gia")
    private Double donGia;

    @Column(name = "so_luong")
    private Integer soLuong;

    @Column(name = "thanh_tien")
    private Double thanhTien;

    @Column(name = "trang_thai")
    private String trangThai; 
}
