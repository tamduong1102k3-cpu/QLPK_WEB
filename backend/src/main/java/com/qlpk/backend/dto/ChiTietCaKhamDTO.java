package com.qlpk.backend.dto;

import com.qlpk.backend.entity.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietCaKhamDTO {
    private PhieuKham phieuKham;
    private BenhNhan benhNhan;
    private String tenChuyenKhoa;
    private String tenNhanVien;
    private KhamLamSang khamLamSang;
    private ChiSoKhamTongHop chiSoKhamTongHop;
    private HoaDon hoaDon;
    private List<ChiTietHoaDon> chiTietHoaDon;
    private List<LichKham> lichTaiKham;
    private TiepNhanCls tiepNhanCls;
    private List<PhieuChiDinhChiTietDTO> danhSachPhieuChiDinh;
    private List<ToaThuocChiTietDTO> danhSachToaThuoc;
}
