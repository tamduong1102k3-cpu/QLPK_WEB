package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "phong_chuc_nang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhongChucNang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phong")
    private Integer maPhong;

    @Column(name = "ten_phong", length = 100)
    private String tenPhong;

    @Column(name = "loai_phong", length = 50)
    private String loaiPhong;

    @Column(name = "so_luong_toi_da")
    private Integer soLuongToiDa;

    @Column(name = "ma_chuyen_khoa")
    private Integer maChuyenKhoa;

    @Column(name = "ma_chuc_vu")
    private Integer maChucVu;
}
