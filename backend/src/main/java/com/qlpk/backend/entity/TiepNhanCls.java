package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "tiep_nhan_cls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TiepNhanCls {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_tiep_nhan")
    private Integer maTiepNhan;

    @Column(name = "ma_phieu_kham")
    private Integer maPhieuKham;

    @Column(name = "ly_do_den", columnDefinition = "TEXT")
    private String lyDoDen;

    @Column(name = "thong_tin_sang_loc", columnDefinition = "TEXT")
    private String thongTinSangLoc;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;
}
