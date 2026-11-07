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
    /** Tạo hóa đơn + chi tiết từ phiếu khám */
    HoaDon taoHoaDonTuPhieuKham(Integer maPhieuKham, Integer maNhanVien) throws Exception;
    /** Lấy danh sách dịch vụ và thuốc cần thanh toán cho phiếu khám */
    Map<String, Object> getBillingItems(Integer maPhieuKham);
    /** Lấy danh sách hóa đơn đã thanh toán chi tiết kèm tên bệnh nhân */
    List<Map<String, Object>> getPaidInvoicesDetailed();

    /** Lấy danh sách hóa đơn đã thanh toán có thuốc (chỉ hóa đơn có ct_hoa_don loai_muc = 'THUOC') */
    List<Map<String, Object>> getPaidInvoicesWithThuoc();

    /** Lấy danh sách hóa đơn đã thanh toán có thuốc kèm trạng thái toa thuốc (cho dược sĩ 2 tab) */
    List<Map<String, Object>> getPaidInvoicesWithThuocAndStatus();

    /** Lấy danh sách hóa đơn đã thanh toán CÓ thuốc đã cấp (DA_CAP_THUOC) - cho lịch sử dược sĩ */
    List<Map<String, Object>> getPaidInvoicesDaCapThuoc();

    /** Tạo thông báo thanh toán cho bệnh nhân từ hóa đơn đã thanh toán */
    void taoThongBaoThanhToan(Integer maHoaDon);
}
