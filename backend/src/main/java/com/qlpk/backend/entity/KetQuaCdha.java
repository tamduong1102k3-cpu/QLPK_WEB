package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "ket_qua_cdha")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KetQuaCdha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "id_chi_tiet_chi_dinh", nullable = false)
    private Integer idChiTietChiDinh;

    @Column(name = "mo_ta_hinh_anh", columnDefinition = "TEXT")
    private String moTaHinhAnh;

    @Column(name = "ket_luan", columnDefinition = "TEXT")
    private String ketLuan;

    @Column(name = "de_nghi", columnDefinition = "TEXT")
    private String deNghi;

    @Column(name = "duong_dan_anh_1", columnDefinition = "TEXT")
    private String duongDanAnh1;

    @Column(name = "duong_dan_anh_2", length = 255)
    private String duongDanAnh2;

    @Column(name = "ngay_thuc_hien")
    private LocalDateTime ngayThucHien;

    @Column(name = "ma_bac_si_thuc_hien")
    private Integer maBacSiThucHien;

    @Column(name = "ma_nhan_vien_thuc_hien")
    private Integer maNhanVienThucHien;

    @Column(name = "trang_thai", length = 100)
    private String trangThai;
}
