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

    @Query("SELECT DISTINCT YEAR(p.ngayKham) FROM PhieuKham p WHERE p.ngayKham IS NOT NULL ORDER BY 1 DESC")
    List<Integer> findDistinctYears();

    @Query("SELECT COUNT(p) FROM PhieuKham p WHERE p.ngayKham >= :start AND p.ngayKham <= :end")
    long countByNgayKhamBetween(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    List<PhieuKham> findByNgayKhamBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Query("SELECT p FROM PhieuKham p WHERE p.maBenhNhan = :maBenhNhan ORDER BY p.ngayKham DESC")
    List<PhieuKham> findByMaBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);

    @Query("SELECT p FROM PhieuKham p WHERE p.maBenhNhan = :maBenhNhan AND p.trangThai = 'HOAN_THANH' ORDER BY p.ngayKham DESC")
    List<PhieuKham> findByMaBenhNhanAndTrangThaiHoanThanh(@Param("maBenhNhan") Integer maBenhNhan);

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

    @Query("SELECT p.maBenhNhan, p.maPhieuKham FROM PhieuKham p WHERE p.trangThai = 'CHO' " +
           "AND p.maChuyenKhoa = :maChuyenKhoa AND p.ngayKham >= :startOfDay ORDER BY p.ngayKham ASC")
    List<Object[]> findCurrentChoByChuyenKhoa(@Param("maChuyenKhoa") Integer maChuyenKhoa, @Param("startOfDay") LocalDateTime startOfDay);

    Optional<PhieuKham> findFirstByMaBenhNhanAndTrangThaiOrderByNgayKhamDesc(Integer maBenhNhan, String trangThai);
}
