package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "phieu_kham")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhieuKham {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phieu_kham")
    private Integer maPhieuKham;

    @Column(name = "ma_benh_nhan")
    private Integer maBenhNhan;

    @Column(name = "ma_nhan_vien")
    private Integer maNhanVien;

    @Column(name = "ma_chuyen_khoa")
    private Integer maChuyenKhoa;

    @Column(name = "ngay_kham")
    private LocalDateTime ngayKham;

    @Column(name = "trang_thai", length = 50)
    private String trangThai;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;

    @Column(name = "ma_dich_vu")
    private Integer maDichVu;

    @Column(name = "ma_lich_kham")
    private Integer maLichKham;
}
