package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chi_tiet_ket_qua_xn")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietKetQuaXn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_ket_qua_xn", nullable = false)
    private Integer maKetQuaXn;

    @Column(name = "ma_chi_so", nullable = false)
    private Integer maChiSo;

    @Column(name = "gia_tri", length = 255)
    private String giaTri;

    @Column(name = "ghi_chu", length = 255)
    private String ghiChu;
}
