package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tai_khoan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaiKhoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_tai_khoan")
    private Integer maTaiKhoan;

    @Column(name = "username", length = 50, nullable = false)
    private String username;

    @Column(name = "email", length = 100, nullable = false)
    private String email;

    @Column(name = "mat_khau", length = 100, nullable = false)
    private String matKhau;

    @Column(name = "ma_nhan_vien", nullable = false)
    private Integer maNhanVien;

    @Column(name = "vai_tro", length = 50)
    private String vaiTro;

    @Column(name = "lan_dau_dang_nhap", columnDefinition = "BIT(1) DEFAULT 1")
    private Boolean lanDauDangNhap = true;
}
