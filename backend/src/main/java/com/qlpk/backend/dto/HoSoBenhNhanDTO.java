package com.qlpk.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoSoBenhNhanDTO {
    // ── Phiếu khám ──────────────────────
    private Integer maPhieuKham;
    private LocalDateTime ngayKham;
    private String trangThaiKham;
    private String lyDoKham;
    private String tienSuBanThan;
    private String benhSu;
    private String chanDoanSoBo;
    private String loiDanBacSi;
    private String ketQuaCLS;
    private String khamLamSang;
    private String ghiChuKham;
    private String tenChuyenKhoa;
    private String tenNhanVien;
    private String tenDichVu;

    // ── Hóa đơn (nullable nếu chưa có) ──
    private Integer maHoaDon;
    private BigDecimal tongTien;
    private LocalDateTime ngayThanhToan;
    private String trangThaiHoaDon;
    private String ghiChuHoaDon;
}
