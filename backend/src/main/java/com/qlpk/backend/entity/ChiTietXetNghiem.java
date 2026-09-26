package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chi_so_xet_nghiem")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietXetNghiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chi_tiet")
    private Integer maChiTiet;

    @Column(name = "ma_dich_vu", nullable = false)
    private Integer maDichVu;

    @Column(name = "ten_chi_so", nullable = false, length = 255)
    private String tenChiSo;

    @Column(name = "don_vi", length = 50)
    private String donVi;

    @Column(name = "gia_tri_binh_thuong", length = 255)
    private String giaTriBinhThuong;

    @Column(name = "thu_tu")
    private Integer thuTu;
}
