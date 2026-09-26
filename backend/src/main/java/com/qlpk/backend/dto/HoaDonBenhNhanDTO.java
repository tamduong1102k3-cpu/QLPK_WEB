package com.qlpk.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoaDonBenhNhanDTO {
    private Integer maHoaDon;
    private Integer maPhieuKham;
    private BigDecimal tongTien;
    private LocalDateTime ngayThanhToan;
    private String trangThai;
    private String phuongThucThanhToan;
    private String maGiaoDich;
    private String ghiChu;
    private LocalDateTime ngayKham;
    private String tenChuyenKhoa;
    private String tenNhanVien;
    private String tenDichVu;
}
