package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "hoa_don")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_hoa_don")
    private Integer maHoaDon;

    @Column(name = "ma_phieu_kham")
    private Integer maPhieuKham;

    @Column(name = "ma_nhan_vien")
    private Integer maNhanVien;

    @Column(name = "tong_tien", precision = 15, scale = 2)
    private BigDecimal tongTien;

    @Column(name = "ngay_thanh_toan")
    private LocalDateTime ngayThanhToan;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "trang_thai", length = 30)
    private String trangThai;

    @Column(name = "phuong_thuc_thanh_toan", length = 50)
    private String phuongThucThanhToan;

    @Column(name = "ma_giao_dich", length = 100)
    private String maGiaoDich;
}
