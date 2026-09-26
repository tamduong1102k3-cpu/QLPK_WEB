package com.qlpk.backend.repository;

import com.qlpk.backend.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Integer> {

    @Query("""
        SELECT MONTH(h.ngayThanhToan),
               SUM(h.tongTien)
        FROM HoaDon h
        WHERE YEAR(h.ngayThanhToan) = :nam
          AND h.ngayThanhToan IS NOT NULL
        GROUP BY MONTH(h.ngayThanhToan)
        ORDER BY MONTH(h.ngayThanhToan)
    """)
    List<Object[]> thongKeDoanhThuTheoNam(@Param("nam") int nam);

    @Query("SELECT DISTINCT YEAR(h.ngayThanhToan) FROM HoaDon h WHERE h.ngayThanhToan IS NOT NULL ORDER BY 1 DESC")
    List<Integer> findDistinctYears();

    @Query("SELECT h FROM HoaDon h WHERE h.maPhieuKham = :maPhieuKham")
    List<HoaDon> findByMaPhieuKham(@Param("maPhieuKham") Integer maPhieuKham);

    @Query("SELECT SUM(h.tongTien) FROM HoaDon h WHERE MONTH(h.ngayThanhToan) = :thang AND YEAR(h.ngayThanhToan) = :nam")
    java.math.BigDecimal sumRevenueByMonth(@Param("thang") int thang, @Param("nam") int nam);

    @Query("""
        SELECT CAST(h.ngayThanhToan AS date), SUM(h.tongTien)
        FROM HoaDon h
        WHERE h.ngayThanhToan >= :since
        GROUP BY CAST(h.ngayThanhToan AS date)
        ORDER BY CAST(h.ngayThanhToan AS date) ASC
    """)
    List<Object[]> thongKeDoanhThu7Ngay(@Param("since") java.time.LocalDateTime since);

    @Query(value = "SELECT h.ma_hoa_don as maHoaDon, h.ma_phieu_kham as maPhieuKham, h.tong_tien as tongTien, " +
                   "h.ngay_thanh_toan as ngayThanhToan, h.trang_thai as trangThai, h.phuong_thuc_thanh_toan as phuongThucThanhToan, " +
                   "b.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, b.so_dien_thoai as soDienThoai, " +
                   "CASE WHEN b.gioi_tinh = 1 THEN 'Nam' WHEN b.gioi_tinh = 0 THEN 'Nữ' ELSE b.gioi_tinh END as gioiTinh " +
                   "FROM hoa_don h " +
                   "JOIN phieu_kham p ON h.ma_phieu_kham = p.ma_phieu_kham " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "ORDER BY h.ngay_thanh_toan DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findPaidInvoicesDetailed();

    @Query(value = "SELECT DISTINCT h.ma_hoa_don as maHoaDon, h.ma_phieu_kham as maPhieuKham, h.tong_tien as tongTien, " +
                   "h.ngay_thanh_toan as ngayThanhToan, h.trang_thai as trangThai, " +
                   "b.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, b.so_dien_thoai as soDienThoai, " +
                   "CASE WHEN b.gioi_tinh = 1 THEN 'Nam' WHEN b.gioi_tinh = 0 THEN 'Nữ' ELSE b.gioi_tinh END as gioiTinh " +
                   "FROM hoa_don h " +
                   "JOIN phieu_kham p ON h.ma_phieu_kham = p.ma_phieu_kham " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN ct_hoa_don ct ON ct.ma_hoa_don = h.ma_hoa_don " +
                   "WHERE LOWER(h.trang_thai) = 'da thanh toan' " +
                   "  AND ct.loai_muc = 'THUOC' " +
                   "ORDER BY h.ngay_thanh_toan DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findPaidInvoicesWithThuoc();

    @Query(value = "SELECT DISTINCT h.ma_hoa_don as maHoaDon, h.ma_phieu_kham as maPhieuKham, h.tong_tien as tongTien, " +
                   "h.ngay_thanh_toan as ngayThanhToan, h.trang_thai as trangThai, " +
                   "b.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, b.so_dien_thoai as soDienThoai, " +
                   "CASE WHEN b.gioi_tinh = 1 THEN 'Nam' WHEN b.gioi_tinh = 0 THEN 'Nữ' ELSE b.gioi_tinh END as gioiTinh, " +
                   "CASE WHEN EXISTS (SELECT 1 FROM toa_thuoc tt WHERE tt.ma_phieu_kham = h.ma_phieu_kham AND tt.trang_thai = 'CHO_CAP_THUOC') " +
                   "     THEN 'CHO_CAP' ELSE 'DA_CAP' END as tinhTrangCapThuoc " +
                   "FROM hoa_don h " +
                   "JOIN phieu_kham p ON h.ma_phieu_kham = p.ma_phieu_kham " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN ct_hoa_don ct ON ct.ma_hoa_don = h.ma_hoa_don " +
                   "WHERE LOWER(h.trang_thai) = 'da thanh toan' " +
                   "  AND ct.loai_muc = 'THUOC' " +
                   "ORDER BY CASE WHEN EXISTS (SELECT 1 FROM toa_thuoc tt2 WHERE tt2.ma_phieu_kham = h.ma_phieu_kham AND tt2.trang_thai = 'CHO_CAP_THUOC') THEN 0 ELSE 1 END, " +
                   "h.ngay_thanh_toan DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findPaidInvoicesWithThuocAndStatus();

    @Query(value = "SELECT DISTINCT h.ma_hoa_don as maHoaDon, h.ma_phieu_kham as maPhieuKham, h.tong_tien as tongTien, " +
                   "h.ngay_thanh_toan as ngayThanhToan, h.trang_thai as trangThai, " +
                   "b.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, b.so_dien_thoai as soDienThoai, " +
                   "CASE WHEN b.gioi_tinh = 1 THEN 'Nam' WHEN b.gioi_tinh = 0 THEN 'Nữ' ELSE b.gioi_tinh END as gioiTinh, " +
                   "tt.ngay_tao as ngayCapThuoc " +
                   "FROM hoa_don h " +
                   "JOIN phieu_kham p ON h.ma_phieu_kham = p.ma_phieu_kham " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN toa_thuoc tt ON tt.ma_phieu_kham = h.ma_phieu_kham " +
                   "WHERE LOWER(h.trang_thai) = 'da thanh toan' " +
                   "  AND tt.trang_thai = 'DA_CAP_THUOC' " +
                   "ORDER BY tt.ngay_tao DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findPaidInvoicesDaCapThuoc();

    @Query(value = "SELECT h.ma_hoa_don as maHoaDon, h.ma_phieu_kham as maPhieuKham, " +
                   "h.tong_tien as tongTien, h.ngay_thanh_toan as ngayThanhToan, h.trang_thai as trangThai, " +
                   "h.phuong_thuc_thanh_toan as phuongThucThanhToan, h.ma_giao_dich as maGiaoDich, h.ghi_chu as ghiChu, " +
                   "p.ngay_kham as ngayKham, " +
                   "ck.ten_chuyen_khoa as tenChuyenKhoa, " +
                   "nv.ho_ten as tenNhanVien, " +
                   "dv.ten_dich_vu as tenDichVu " +
                   "FROM hoa_don h " +
                   "JOIN phieu_kham p ON h.ma_phieu_kham = p.ma_phieu_kham " +
                   "LEFT JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                   "LEFT JOIN nhan_vien nv ON p.ma_nhan_vien = nv.ma_nhan_vien " +
                   "LEFT JOIN dich_vu dv ON p.ma_dich_vu = dv.ma_dich_vu " +
                   "WHERE p.ma_benh_nhan = :maBenhNhan AND LOWER(h.trang_thai) = 'da thanh toan' " +
                   "ORDER BY h.ngay_thanh_toan DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findPaidInvoicesByBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);
}
