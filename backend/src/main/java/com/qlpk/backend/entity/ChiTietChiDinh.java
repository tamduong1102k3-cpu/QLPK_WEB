package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chi_tiet_chi_dinh")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietChiDinh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_phieu_chi_dinh")
    private Integer maPhieuChiDinh;

    @Column(name = "ma_dich_vu")
    private Integer maDichVu;

    @Column(name = "so_luong")
    private Integer soLuong;

    @Column(name = "don_gia")
    private Double donGia;

    @Column(name = "trang_thai_dv")
    private String trangThaiDv; 

    @Column(name = "ma_nhan_vien_thuc_hien")
    private Integer maNhanVienThucHien;

}
