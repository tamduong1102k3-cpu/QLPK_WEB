package com.qlpk.backend.repository;

import com.qlpk.backend.entity.DangKyKhamBenh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DangKyKhamBenhRepository extends JpaRepository<DangKyKhamBenh, Integer> {

    @Query("SELECT COUNT(d) FROM DangKyKhamBenh d WHERE d.thoiGianDangKy >= :startOfDay AND d.thoiGianDangKy < :endOfDay")
    long countTodayRegistrations(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(d) FROM DangKyKhamBenh d WHERE d.thoiGianDangKy >= :startOfDay AND d.thoiGianDangKy < :endOfDay AND d.maChuyenKhoa = :maChuyenKhoa")
    long countTodayRegistrationsByChuyenKhoa(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay, @Param("maChuyenKhoa") Integer maChuyenKhoa);

    @Query("SELECT d FROM DangKyKhamBenh d WHERE d.thoiGianDangKy >= :startOfDay AND d.thoiGianDangKy < :endOfDay ORDER BY d.soThuTu ASC")
    List<DangKyKhamBenh> findTodayRegistrations(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query(value = "SELECT d.id as id, d.ma_benh_nhan as maBenhNhan, d.so_thu_tu as soThuTu, b.ho_ten as hoTen, " +
                   "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, b.so_dien_thoai as soDienThoai, c.ten_chuyen_khoa as tenChuyenKhoa, " +
                   "d.trang_thai as trangThai, d.thoi_gian_dang_ky as thoiGian, d.ghi_chu as ghiChu, d.ma_phieu_kham as maPhieuKham, " +
                   "d.ma_chuyen_khoa as maChuyenKhoa, d.ma_dich_vu as maDichVu, " +
                   "d.ma_phong as maPhong, p.ten_phong as tenPhong, " +
                   "b.cccd as cccd, " +
                   "b.di_ung_thuoc as diUngThuoc, b.tien_su_benh as tienSuBenh " +
                   "FROM dang_ky_kham_benh d " +
                   "JOIN benh_nhan b ON d.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN chuyen_khoa c ON d.ma_chuyen_khoa = c.ma_chuyen_khoa " +
                   "LEFT JOIN phong_chuc_nang p ON d.ma_phong = p.ma_phong " +
                   "WHERE d.thoi_gian_dang_ky >= :startOfDay AND d.thoi_gian_dang_ky < :endOfDay " +
                   "ORDER BY d.so_thu_tu ASC", nativeQuery = true)
    List<java.util.Map<String, Object>> findTodayRegistrationsDetailed(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    Optional<DangKyKhamBenh> findByMaPhieuKham(Integer maPhieuKham);

    @Query(value = "SELECT d.id as id, d.ma_benh_nhan as maBenhNhan, d.so_thu_tu as soThuTu, b.ho_ten as hoTen, " +
                   "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, b.so_dien_thoai as soDienThoai, c.ten_chuyen_khoa as tenChuyenKhoa, " +
                   "d.trang_thai as trangThai, d.thoi_gian_dang_ky as thoiGian, d.ghi_chu as ghiChu, d.ma_phieu_kham as maPhieuKham, " +
                   "d.ma_chuyen_khoa as maChuyenKhoa, d.ma_dich_vu as maDichVu, " +
                   "d.ma_phong as maPhong, p.ten_phong as tenPhong, " +
                   "b.cccd as cccd, " +
                   "b.di_ung_thuoc as diUngThuoc, b.tien_su_benh as tienSuBenh " +
                   "FROM dang_ky_kham_benh d " +
                   "JOIN benh_nhan b ON d.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN chuyen_khoa c ON d.ma_chuyen_khoa = c.ma_chuyen_khoa " +
                   "LEFT JOIN phong_chuc_nang p ON d.ma_phong = p.ma_phong " +
                   "WHERE d.thoi_gian_dang_ky >= :startOfDay AND d.thoi_gian_dang_ky < :endOfDay " +
                   "AND (:keyword IS NULL OR :keyword = '' " +
                   "     OR b.ho_ten LIKE CONCAT('%', :keyword, '%') " +
                   "     OR b.cccd LIKE CONCAT('%', :keyword, '%') " +
                   "     OR CAST(d.ma_phieu_kham AS CHAR) LIKE CONCAT('%', :keyword, '%') " +
                   "     OR c.ten_chuyen_khoa LIKE CONCAT('%', :keyword, '%')) " +
                   "ORDER BY d.so_thu_tu ASC", nativeQuery = true)
    List<java.util.Map<String, Object>> findTodayRegistrationsDetailedWithSearch(
                   @Param("startOfDay") LocalDateTime startOfDay,
                   @Param("endOfDay") LocalDateTime endOfDay,
                   @Param("keyword") String keyword);

    @Query("SELECT COALESCE(MAX(d.soThuTu), 0) FROM DangKyKhamBenh d WHERE d.thoiGianDangKy >= :startOfDay AND d.thoiGianDangKy < :endOfDay AND d.maPhong = :maPhong")
    Integer findMaxSoThuTuByPhong(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay, @Param("maPhong") Integer maPhong);

    @Modifying
    @Query("UPDATE DangKyKhamBenh d SET d.trangThai = :newStatus WHERE d.id = :id AND d.trangThai = :expectedStatus")
    int updateTrangThaiIfCurrent(@Param("id") Integer id,
                                @Param("newStatus") String newStatus,
                                @Param("expectedStatus") String expectedStatus);
}
