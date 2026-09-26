package com.qlpk.backend.service;

import com.qlpk.backend.entity.HoaDon;

import jakarta.transaction.Transactional;

import com.qlpk.backend.entity.ChiTietHoaDon;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface HoaDonService {
    List<HoaDon> getAll();
    HoaDon getById(Integer id);
    HoaDon create(HoaDon entity);
    HoaDon update(Integer id, HoaDon entity);
    void delete(Integer id);
    @Transactional
    HoaDon thanhToan(Integer maHoaDon, Integer maNhanVien, Integer maTaiKhoanNhanVien, String phuongThuc, BigDecimal soTienNhan, String maGiaoDich);

    HoaDon taoHoaDonTuPhieuKham(Integer maPhieuKham, Integer maNhanVien) throws Exception;

    Map<String, Object> getBillingItems(Integer maPhieuKham);

    List<Map<String, Object>> getPaidInvoicesDetailed();

    List<Map<String, Object>> getPaidInvoicesWithThuoc();

    List<Map<String, Object>> getPaidInvoicesWithThuocAndStatus();

    List<Map<String, Object>> getPaidInvoicesDaCapThuoc();

    void taoThongBaoThanhToan(Integer maHoaDon);
}
