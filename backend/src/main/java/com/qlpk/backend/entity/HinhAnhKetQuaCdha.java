package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "hinh_anh_ket_qua_cdha")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HinhAnhKetQuaCdha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_hinh_anh")
    private Integer maHinhAnh;

    @Column(name = "ma_ket_qua_cdha", nullable = false)
    private Integer maKetQuaCdha;

    @Column(name = "duong_dan_anh", nullable = false, length = 500)
    private String duongDanAnh;

    @Column(name = "thu_tu")
    private Integer thuTu = 0;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao = LocalDateTime.now();
}
