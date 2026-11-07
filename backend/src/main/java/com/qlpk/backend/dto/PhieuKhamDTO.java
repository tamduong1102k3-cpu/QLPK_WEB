package com.qlpk.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhieuKhamDTO {
    private Integer maPhieuKham;
    private LocalDateTime ngayKham;
    private String trieuChung;
    private String chanDoan;
    private String ghiChu;
    private String trangThai;
    private Integer maChuyenKhoa;
    private String tenChuyenKhoa;
    private String tenNhanVien;
    private String tenDichVu;
    private Integer maDichVu;
    private String loaiDichVu;
}
