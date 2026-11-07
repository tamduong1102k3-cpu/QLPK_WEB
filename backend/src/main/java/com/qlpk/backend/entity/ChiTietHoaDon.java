package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "ct_hoa_don")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietHoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "ma_hoa_don")
    private Integer maHoaDon;

    @Column(name = "noi_dung", length = 255)
    private String noiDung;

    @Column(name = "loai_muc", length = 20)
    private String loaiMuc;

    @Column(name = "id_goc")
    private Integer idGoc;

    @Column(name = "so_luong")
    private Integer soLuong;

    @Column(name = "don_gia", precision = 15, scale = 2)
    private BigDecimal donGia;

    @Column(name = "thanh_tien", precision = 15, scale = 2)
    private BigDecimal thanhTien;
}
