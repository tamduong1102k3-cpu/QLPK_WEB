package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "ket_qua_xet_nghiem")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KetQuaXetNghiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_chi_tiet_chi_dinh", nullable = false)
    private Integer maChiTietChiDinh;

    @Column(name = "ngay_thuc_hien")
    private LocalDateTime ngayThucHien;

    @Column(name = "nguoi_thuc_hien")
    private Integer nguoiThucHien;

    @Column(name = "ma_bs_ket_luan")
    private Integer maBsKetLuan;

    @Column(name = "ket_luan", columnDefinition = "TEXT")
    private String ketLuan;

    @Column(name = "ket_qua", columnDefinition = "TEXT")
    private String ketQua;

    @Column(name = "ghi_chu_them", columnDefinition = "TEXT")
    private String ghiChuThem;

    @Column(name = "trang_thai", length = 100)
    private String trangThai;
}
