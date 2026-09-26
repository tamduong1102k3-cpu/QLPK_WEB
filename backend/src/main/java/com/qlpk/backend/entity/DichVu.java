package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "dich_vu")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DichVu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_dich_vu")
    private Integer maDichVu;

    @Column(name = "ten_dich_vu", length = 50)
    private String tenDichVu;

    @Column(name = "don_gia", precision = 10, scale = 2)
    private BigDecimal donGia;

    @Column(name = "loai_dich_vu", length = 50)
    private String loaiDichVu;

    @Column(name = "ma_chuyen_khoa")
    private Integer maChuyenKhoa;

    @Column(name = "ma_nhom_dich_vu")
    private Integer maNhomDichVu;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
