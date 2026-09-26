package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tai_khoan_benh_nhan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaiKhoanBenhNhan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_tai_khoan_bn")
    private Integer maTaiKhoanBn;

    @Column(name = "ma_benh_nhan", unique = true)
    private Integer maBenhNhan;

    @Column(name = "username", length = 50, nullable = false, unique = true)
    private String username;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "so_dien_thoai", length = 15, unique = true)
    private String soDienThoai;

    @Column(name = "mat_khau", length = 255, nullable = false)
    private String matKhau;

    @Column(name = "email_verified", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean emailVerified = false;

    @Column(name = "ngay_tao", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "vai_tro", length = 30, nullable = false, columnDefinition = "VARCHAR(30) DEFAULT 'BENH_NHAN'")
    private String vaiTro = "BENH_NHAN";

    @Column(name = "lan_dang_nhap_cuoi")
    private LocalDateTime lanDangNhapCuoi;

    @PrePersist
    protected void onCreate() {
        if (ngayTao == null) {
            ngayTao = LocalDateTime.now();
        }
    }
}
