package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "kham_lam_sang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhamLamSang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_phieu_kham")
    private Integer maPhieuKham;

    @Transient 
    private Integer maBacSi;

    @Column(name = "ly_do_kham", columnDefinition = "TEXT")
    private String lyDoKham;

    @Column(name = "tien_su_ban_than", columnDefinition = "TEXT")
    private String tienSuBanThan;

    @Column(name = "benh_su", columnDefinition = "TEXT")
    private String benhSu;

    @Column(name = "chan_doan_so_bo", length = 255)
    private String chanDoanSoBo;

    @Column(name = "loi_dan_bac_si", columnDefinition = "TEXT")
    private String loiDanBacSi;

    @Column(name = "ket_qua_kham_can_lam_sang", columnDefinition = "TEXT")
    private String ketQuaKhamCanLamSang;

    @Column(name = "kham_lam_sang", columnDefinition = "TEXT")
    private String khamLamSang;
}
