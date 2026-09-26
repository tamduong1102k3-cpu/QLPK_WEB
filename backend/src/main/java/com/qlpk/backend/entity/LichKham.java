package com.qlpk.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lich_kham")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LichKham {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_lich_kham")
    private Integer id;

    @Column(name = "ma_benh_nhan", nullable = false)
    private Integer maBenhNhan;

    @Column(name = "ma_chuyen_khoa", nullable = false)
    private Integer maChuyenKhoa;

    @Column(name = "ma_bac_si")
    private Integer maBacSi;

    @Column(name = "ma_dich_vu", nullable = false)
    private Integer maDichVu;

    @Column(name = "ma_phong")
    private Integer maPhong;

    @Column(name = "ma_dang_ky_kham_benh")
    private Integer maDangKyKhamBenh;

    @Column(name = "ma_lich_kham_goc")
    private Integer maLichKhamGoc;

    @Column(name = "ma_ca")
    private Integer maCa;

    @Enumerated(EnumType.STRING)
    @Column(name = "nguon_tao", nullable = false, length = 20)
    private NguonTao nguonTao = NguonTao.DAT_LICH_APP;

    @Column(name = "ngay_kham", nullable = false)
    private LocalDate ngayKham;

    @Column(name = "trang_thai", nullable = false, length = 50)
    private String trangThai = "CHUA_DEN";

    @Column(name = "ma_nguoi_cap_nhat")
    private Integer maNguoiCapNhat;

    @Column(name = "ghi_chu", length = 255)
    private String ghiChu;

    @Column(name = "ly_do_hoan", length = 500)
    private String lyDoHoan;

    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat", nullable = false)
    private LocalDateTime ngayCapNhat;

    @Column(name = "da_tinh_qua_hen", nullable = false)
    private Boolean daTinhQuaHen = false;

    @Transient
    @JsonProperty("tenBenhNhan")
    private String tenBenhNhan;

    @Transient
    @JsonProperty("tenBacSi")
    private String tenBacSi;

    @Transient
    @JsonProperty("tenChuyenKhoa")
    private String tenChuyenKhoa;

    @Transient
    @JsonProperty("tenDichVu")
    private String tenDichVu;

    @Transient
    @JsonProperty("tenCa")
    private String tenCa;

    @Transient
    @JsonProperty("tenPhong")
    private String tenPhong;

    @Transient
    @JsonProperty("gioBatDau")
    @JsonFormat(pattern = "HH:mm:ss")
    private java.time.LocalTime gioBatDau;

    @Transient
    @JsonProperty("gioKetThuc")
    @JsonFormat(pattern = "HH:mm:ss")
    private java.time.LocalTime gioKetThuc;

    @Transient
    @JsonProperty("daXacMinhDanhTinh")
    private Boolean daXacMinhDanhTinh;

    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
        ngayCapNhat = LocalDateTime.now();
        if (trangThai == null) {
            trangThai = "CHUA_DEN";
        }
        if (nguonTao == null) {
            nguonTao = NguonTao.DAT_LICH_APP;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
    }
}
