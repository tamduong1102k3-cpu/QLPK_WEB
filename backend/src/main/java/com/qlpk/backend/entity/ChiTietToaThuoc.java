package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ct_toa_thuoc")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietToaThuoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_toa_thuoc")
    private Integer maToaThuoc;

    @Column(name = "ma_thuoc")
    private Integer maThuoc;

    @Column(name = "lieu_dung", length = 100)
    private String lieuDung;

    @Column(name = "sang", length = 50)
    private String sang;

    @Column(name = "trua", length = 50)
    private String trua;

    @Column(name = "chieu", length = 50)
    private String chieu;

    @Column(name = "toi", length = 50)
    private String toi;

    @Column(name = "so_ngay")
    private Integer soNgay;

    @Column(name = "cach_dung", columnDefinition = "TEXT")
    private String cachDung;

    @Column(name = "thoi_diem_dung", length = 100)
    private String thoiDiemDung;
}
