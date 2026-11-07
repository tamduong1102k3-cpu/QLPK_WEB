package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "dang_ky_kham_benh")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DangKyKhamBenh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ma_benh_nhan")
    private Integer maBenhNhan;

    @Column(name = "ma_nhan_vien")
    private Integer maNhanVien; 

    @Column(name = "ma_chuyen_khoa")
    private Integer maChuyenKhoa;

    @Column(name = "ma_phong")
    private Integer maPhong;

    @Column(name = "so_thu_tu")
    private Integer soThuTu;

    @Column(name = "thoi_gian_dang_ky")
    private LocalDateTime thoiGianDangKy;

    @Column(name = "trang_thai", length = 50)
    private String trangThai; 

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ma_phieu_kham")
    private Integer maPhieuKham;

    @Column(name = "ma_dich_vu")
    private Integer maDichVu;
}
