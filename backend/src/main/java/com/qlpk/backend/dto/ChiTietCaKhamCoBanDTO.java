package com.qlpk.backend.dto;

import com.qlpk.backend.entity.BenhNhan;
import com.qlpk.backend.entity.PhieuKham;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietCaKhamCoBanDTO {
    private PhieuKham phieuKham;
    private BenhNhan benhNhan;
    private String tenChuyenKhoa;
    private String tenNhanVien;
    private String tenDichVu;
    private String loaiDichVu;
}
