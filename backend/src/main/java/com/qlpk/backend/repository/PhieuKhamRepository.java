package com.qlpk.backend.repository;

import com.qlpk.backend.entity.PhieuKham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PhieuKhamRepository extends JpaRepository<PhieuKham, Integer> {

    /**
     * Thống kê lượt khám theo tháng trong năm.
     * Returns: [thang, soLuotKham, soBenhNhanMoi]
     */
    @Query("""
        SELECT MONTH(p.ngayKham),
               COUNT(p.maPhieuKham),
               COUNT(DISTINCT p.maBenhNhan)
        FROM PhieuKham p
        WHERE YEAR(p.ngayKham) = :nam
        GROUP BY MONTH(p.ngayKham)
        ORDER BY MONTH(p.ngayKham)
    """)
    List<Object[]> thongKeLuotKhamTheoNam(@Param("nam") int nam);

    /** Các năm có phiếu khám */
    @Query("SELECT DISTINCT YEAR(p.ngayKham) FROM PhieuKham p WHERE p.ngayKham IS NOT NULL ORDER BY 1 DESC")
    List<Integer> findDistinctYears();

    /** Đếm số lịch hẹn/lượt khám hôm nay */
    @Query("SELECT COUNT(p) FROM PhieuKham p WHERE p.ngayKham >= :start AND p.ngayKham <= :end")
    long countByNgayKhamBetween(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    /** Lấy danh sách phiếu khám trong khoảng thời gian */
    List<PhieuKham> findByNgayKhamBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    /** Lấy danh sách phiếu khám theo mã bệnh nhân */
    @Query("SELECT p FROM PhieuKham p WHERE p.maBenhNhan = :maBenhNhan ORDER BY p.ngayKham DESC")
    List<PhieuKham> findByMaBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);

    /** Lấy danh sách phiếu khám HOAN_THÀNH theo mã bệnh nhân */
    @Query("SELECT p FROM PhieuKham p WHERE p.maBenhNhan = :maBenhNhan AND p.trangThai = 'HOAN_THANH' ORDER BY p.ngayKham DESC")
    List<PhieuKham> findByMaBenhNhanAndTrangThaiHoanThanh(@Param("maBenhNhan") Integer maBenhNhan);

    /** Lấy danh sách phiếu khám kèm tên bệnh nhân cho lịch sử */
    /** Kiểm tra phiếu khám theo bệnh nhân + chuyên khoa trong ngày (chống trùng) */
    @Query("SELECT p FROM PhieuKham p WHERE p.maBenhNhan = :maBenhNhan AND p.maChuyenKhoa = :maChuyenKhoa AND p.ngayKham >= :start AND p.ngayKham <= :end")
    List<PhieuKham> findByMaBenhNhanAndMaChuyenKhoaAndNgayKhamBetween(
        @Param("maBenhNhan") Integer maBenhNhan,
        @Param("maChuyenKhoa") Integer maChuyenKhoa,
        @Param("start") java.time.LocalDateTime start,
        @Param("end") java.time.LocalDateTime end
    );

    @Query(value = "SELECT p.ma_phieu_kham as maPhieuKham, p.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, " +
                   "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, " +
                   "p.ngay_kham as ngayKham, p.trang_thai as trangThai, p.ghi_chu as ghiChu, p.ma_chuyen_khoa as maChuyenKhoa, " +
                   "ck.ten_chuyen_khoa as tenChuyenKhoa, nv.ho_ten as tenNhanVien, dv.ten_dich_vu as tenDichVu, " +
                   "kls.chan_doan_so_bo as chanDoan " +
                   "FROM phieu_kham p " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                   "LEFT JOIN nhan_vien nv ON p.ma_nhan_vien = nv.ma_nhan_vien " +
                   "LEFT JOIN dich_vu dv ON p.ma_dich_vu = dv.ma_dich_vu " +
                   "LEFT JOIN kham_lam_sang kls ON p.ma_phieu_kham = kls.ma_phieu_kham " +
                   "WHERE p.ma_nhan_vien = :maBacSi " +
                   "AND p.trang_thai = 'HOAN_THANH' " +
                   "AND DATE(p.ngay_kham) = CURRENT_DATE " +
                   "ORDER BY p.ngay_kham DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findHistoryDetailed(@Param("maBacSi") Integer maBacSi);

    @Query(value = "SELECT p.ma_phieu_kham as maPhieuKham, p.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, " +
                   "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, " +
                   "p.ngay_kham as ngayKham, p.trang_thai as trangThai, p.ghi_chu as ghiChu, " +
                   "ck.ten_chuyen_khoa as tenChuyenKhoa, nv.ho_ten as tenNhanVien, dv.ten_dich_vu as tenDichVu " +
                   "FROM phieu_kham p " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                   "LEFT JOIN nhan_vien nv ON p.ma_nhan_vien = nv.ma_nhan_vien " +
                   "LEFT JOIN dich_vu dv ON p.ma_dich_vu = dv.ma_dich_vu " +
                   "WHERE p.ma_chuyen_khoa = :maChuyenKhoa " +
                   "AND p.trang_thai = 'CHO_BAC_SI' " +
                   "AND DATE(p.ngay_kham) = CURRENT_DATE " +
                   "ORDER BY p.ngay_kham DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findAssistantHistory(@Param("maChuyenKhoa") Integer maChuyenKhoa);

    /** Lấy danh sách bệnh nhân đã hoàn thành khám (HOAN_THANH) để thu ngân thanh toán */
    @Query(value = "SELECT p.ma_phieu_kham as maPhieuKham, p.ma_benh_nhan as maBenhNhan, " +
                    "b.ho_ten as hoTen, b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, b.so_dien_thoai as soDienThoai, b.cccd as cccd, " +
                    "p.ngay_kham as ngayKham, p.trang_thai as trangThai, p.ma_chuyen_khoa as maChuyenKhoa, " +
                    "ck.ten_chuyen_khoa as tenChuyenKhoa " +
                    "FROM phieu_kham p " +
                    "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                    "JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                    "WHERE p.trang_thai = 'HOAN_THANH' " +
                    "AND DATE(p.ngay_kham) = CURRENT_DATE " +
                    "ORDER BY p.ngay_kham DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findCompletedPatientsToday();

    /** Tìm kiếm bệnh nhân đã khám hôm nay theo keyword (SQL LIKE) */
    @Query(value = "SELECT p.ma_phieu_kham as maPhieuKham, p.ma_benh_nhan as maBenhNhan, " +
                    "b.ho_ten as hoTen, b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, b.so_dien_thoai as soDienThoai, b.cccd as cccd, " +
                    "p.ngay_kham as ngayKham, p.trang_thai as trangThai, p.ma_chuyen_khoa as maChuyenKhoa, " +
                    "ck.ten_chuyen_khoa as tenChuyenKhoa " +
                    "FROM phieu_kham p " +
                    "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                    "JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                    "WHERE p.trang_thai = 'HOAN_THANH' " +
                    "AND DATE(p.ngay_kham) = CURRENT_DATE " +
                    "AND (:keyword IS NULL OR :keyword = '' " +
                    "     OR b.ho_ten LIKE CONCAT('%', :keyword, '%') " +
                    "     OR b.so_dien_thoai LIKE CONCAT('%', :keyword, '%') " +
                    "     OR CAST(p.ma_phieu_kham AS CHAR) LIKE CONCAT('%', :keyword, '%') " +
                    "     OR ck.ten_chuyen_khoa LIKE CONCAT('%', :keyword, '%')) " +
                    "ORDER BY p.ngay_kham DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findCompletedPatientsTodayWithSearch(@Param("keyword") String keyword);

    @Query(value = "SELECT p.ma_phieu_kham as maPhieuKham, p.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, " +
                   "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, b.so_dien_thoai as soDienThoai, " +
                   "p.ngay_kham as ngayKham, p.trang_thai as trangThai, p.ghi_chu as ghiChu, p.ma_chuyen_khoa as maChuyenKhoa, " +
                   "ck.ten_chuyen_khoa as tenChuyenKhoa, nv.ho_ten as tenNhanVien, dv.ten_dich_vu as tenDichVu, kls.chan_doan_so_bo as chanDoan " +
                   "FROM phieu_kham p " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                   "LEFT JOIN nhan_vien nv ON p.ma_nhan_vien = nv.ma_nhan_vien " +
                   "LEFT JOIN dich_vu dv ON p.ma_dich_vu = dv.ma_dich_vu " +
                   "LEFT JOIN kham_lam_sang kls ON p.ma_phieu_kham = kls.ma_phieu_kham " +
                   "WHERE p.ma_chuyen_khoa = :maChuyenKhoa " +
                   "AND p.trang_thai = 'HOAN_THANH' " +
                   "ORDER BY p.ngay_kham DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findHistoryByChuyenKhoaAllDays(@Param("maChuyenKhoa") Integer maChuyenKhoa);

    @Query(value = "SELECT p.ma_phieu_kham as maPhieuKham, p.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, " +
                    "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, b.so_dien_thoai as soDienThoai, b.cccd as cccd, " +
                    "p.ngay_kham as ngayKham, p.trang_thai as trangThai, p.ghi_chu as ghiChu, " +
                    "p.ma_chuyen_khoa as maChuyenKhoa, ck.ten_chuyen_khoa as tenChuyenKhoa, " +
                    "dv.ten_dich_vu as tenDichVu, dv.ma_dich_vu as maDichVu, dv.don_gia as donGia " +
                    "FROM phieu_kham p " +
                    "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                    "JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                    "LEFT JOIN dich_vu dv ON p.ma_dich_vu = dv.ma_dich_vu " +
                    "WHERE p.ma_chuyen_khoa = :maChuyenKhoa " +
                    "AND p.trang_thai = 'CHO_BAC_SI' " +
                    "AND DATE(p.ngay_kham) = CURRENT_DATE " +
                    "ORDER BY p.ngay_kham ASC", nativeQuery = true)
    List<java.util.Map<String, Object>> findPendingClsConfirmation(@Param("maChuyenKhoa") Integer maChuyenKhoa);

    /**
     * Lấy danh sách phiếu khám + kham_lam_sang + chuyen_khoa + nhan_vien theo ma_benh_nhan,
     * có thể lọc theo ma_chuyen_khoa (nếu maChuyenKhoa != null)
     */
    @Query(value = "SELECT p.ma_phieu_kham as maPhieuKham, p.ma_benh_nhan as maBenhNhan, b.ho_ten as hoTen, " +
                   "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, " +
                   "p.ngay_kham as ngayKham, p.trang_thai as trangThai, p.ghi_chu as ghiChu, " +
                   "p.ma_chuyen_khoa as maChuyenKhoa, ck.ten_chuyen_khoa as tenChuyenKhoa, " +
                   "nv.ho_ten as tenNhanVien, dv.ten_dich_vu as tenDichVu, " +
                   "kls.id as maKhamLamSang, kls.ly_do_kham as lyDoKham, " +
                   "kls.kham_lam_sang as khamLamSang, " +
                   "kls.chan_doan_so_bo as chanDoanSoBo, kls.loi_dan_bac_si as loiDanBacSi, " +
                   "kls.tien_su_ban_than as tienSuBanThan, kls.benh_su as benhSu, " +
                   "kls.ket_qua_kham_can_lam_sang as ketQuaCLS " +
                   "FROM phieu_kham p " +
                   "JOIN benh_nhan b ON p.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN chuyen_khoa ck ON p.ma_chuyen_khoa = ck.ma_chuyen_khoa " +
                   "LEFT JOIN nhan_vien nv ON p.ma_nhan_vien = nv.ma_nhan_vien " +
                   "LEFT JOIN dich_vu dv ON p.ma_dich_vu = dv.ma_dich_vu " +
                   "LEFT JOIN kham_lam_sang kls ON p.ma_phieu_kham = kls.ma_phieu_kham " +
                   "WHERE p.ma_benh_nhan = :maBenhNhan " +
                   "AND p.trang_thai = 'HOAN_THANH' " +
                   "AND (:maChuyenKhoa IS NULL OR p.ma_chuyen_khoa = :maChuyenKhoa) " +
                   "ORDER BY p.ngay_kham DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findHistoryByBenhNhan(@Param("maBenhNhan") Integer maBenhNhan, @Param("maChuyenKhoa") Integer maChuyenKhoa);

    /**
     * Tìm bệnh nhân đang được khám (phieu_kham có trạng thái 'CHO') cùng chuyên khoa trong ngày.
     * Trả về [maBenhNhan, maPhieuKham]
     */
    @Query("SELECT p.maBenhNhan, p.maPhieuKham FROM PhieuKham p WHERE p.trangThai = 'CHO' " +
           "AND p.maChuyenKhoa = :maChuyenKhoa AND p.ngayKham >= :startOfDay ORDER BY p.ngayKham ASC")
    List<Object[]> findCurrentChoByChuyenKhoa(@Param("maChuyenKhoa") Integer maChuyenKhoa, @Param("startOfDay") LocalDateTime startOfDay);

    /** Tìm phiếu khám HOAN_THANH gần nhất của bệnh nhân */
    Optional<PhieuKham> findFirstByMaBenhNhanAndTrangThaiOrderByNgayKhamDesc(Integer maBenhNhan, String trangThai);
}
