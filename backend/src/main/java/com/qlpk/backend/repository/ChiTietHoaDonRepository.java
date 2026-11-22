package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiTietHoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChiTietHoaDonRepository extends JpaRepository<ChiTietHoaDon, Integer> {

    /** Top dịch vụ sử dụng nhiều nhất  */
    @Query("""
        SELECT c.noiDung, SUM(c.soLuong)
        FROM ChiTietHoaDon c
        WHERE LOWER(c.loaiMuc) IN ('dich_vu', 'dịch vụ', 'dich vu', 'dịch_vụ')
        GROUP BY c.noiDung
        ORDER BY SUM(c.soLuong) DESC
    """)
    List<Object[]> thongKeTopDichVu(org.springframework.data.domain.Pageable pageable);

    List<ChiTietHoaDon> findByMaHoaDon(Integer maHoaDon);

    /**
     * Lấy chi tiết hóa đơn chỉ gồm các mục thuốc (loai_muc = 'THUOC')
     * Dùng cho dược sĩ xem thuốc cần cấp
     */
    @Query("SELECT c FROM ChiTietHoaDon c WHERE c.maHoaDon = :maHoaDon AND c.loaiMuc = 'THUOC'")
    List<ChiTietHoaDon> findThuocByMaHoaDon(@Param("maHoaDon") Integer maHoaDon);

    /**
     * Lấy danh sách thuốc từ các hóa đơn đã thanh toán (cho dược sĩ)
     * Join giữa hoa_don (trang_thai = 'da thanh toan') và ct_hoa_don (loai_muc = 'THUOC')
     * Trả về danh sách chi tiết hóa đơn loại thuốc
     */
    @Query(value = """
        SELECT ct.* FROM ct_hoa_don ct
        JOIN hoa_don h ON ct.ma_hoa_don = h.ma_hoa_don
        WHERE LOWER(h.trang_thai) = 'da thanh toan'
          AND ct.loai_muc = 'THUOC'
        ORDER BY h.ngay_thanh_toan DESC, h.ma_hoa_don DESC
    """, nativeQuery = true)
    List<ChiTietHoaDon> findThuocFromPaidInvoices();
}