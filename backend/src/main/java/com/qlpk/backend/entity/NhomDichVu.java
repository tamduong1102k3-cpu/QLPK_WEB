package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "nhom_dich_vu")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhomDichVu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nhom")
    private Integer maNhom;

    @Column(name = "ten_nhom", nullable = false, length = 100)
    private String tenNhom;

    @Column(name = "mo_ta", length = 255)
    private String moTa;
}
