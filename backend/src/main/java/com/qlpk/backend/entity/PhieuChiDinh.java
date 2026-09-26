package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "phieu_chi_dinh")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhieuChiDinh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phieu_chi_dinh")
    private Integer maPhieuChiDinh;

    @Column(name = "ma_phieu_kham")
    private Integer maPhieuKham;

    @Column(name = "ma_nhan_vien_chi_dinh")
    private Integer maNhanVienChiDinh;

    @Column(name = "trang_thai")
    private String trangThai;

    @Column(name = "ngay_chi_dinh")
    private LocalDateTime ngayChiDinh;

    @Column(name = "tong_tien")
    private Double tongTien;
}
