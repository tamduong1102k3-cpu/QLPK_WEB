package com.qlpk.backend.repository;

import com.qlpk.backend.entity.PhieuChiDinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface PhieuChiDinhRepository extends JpaRepository<PhieuChiDinh, Integer> {
    List<PhieuChiDinh> findByMaPhieuKham(Integer maPhieuKham);

    @Query("SELECT p FROM PhieuChiDinh p WHERE p.maPhieuKham IN (SELECT pk.maPhieuKham FROM PhieuKham pk WHERE pk.maBenhNhan = :maBenhNhan) ORDER BY p.ngayChiDinh DESC")
    List<PhieuChiDinh> findByMaBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);
    @Query(value = 
    "SELECT ct.id as id, " +
    "p.ma_phieu_kham as maPhieuKham, " +
    "pk.ma_benh_nhan as maBenhNhan, " +
    "ct.ma_dich_vu as maDichVu, " + 
    "pk.ma_dich_vu as maDichVuPhieuKham, " + 
    "b.ho_ten as hoTen, " +
    "b.gioi_tinh as gioiTinh, " +
    "b.ngay_sinh as ngaySinh, " +
    "b.so_dien_thoai as soDienThoai, " +
    "b.cccd as cccd, " +
    "dv.ten_dich_vu as tenDichVu, " +
    "p.ngay_chi_dinh as ngayChiDinh, " +
    "ct.trang_thai_dv as trangThaiDv, " +
    "kq.ghi_chu_them as ghiChuThem, " +
    "kq.trang_thai as trangThaiKq, " +
    "dk.ma_phong as maPhong " +
    "FROM chi_tiet_chi_dinh ct " +
    "JOIN phieu_chi_dinh p ON ct.ma_phieu_chi_dinh = p.ma_phieu_chi_dinh " +
    "JOIN phieu_kham pk ON p.ma_phieu_kham = pk.ma_phieu_kham " +
    "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
    "JOIN dich_vu dv ON ct.ma_dich_vu = dv.ma_dich_vu " +
    "LEFT JOIN ket_qua_xet_nghiem kq ON kq.ma_chi_tiet_chi_dinh = ct.id " +
    "LEFT JOIN dang_ky_kham_benh dk ON dk.ma_phieu_kham = pk.ma_phieu_kham " +
    "WHERE (:maChuyenKhoa IS NULL OR dv.ma_chuyen_khoa = :maChuyenKhoa) " +
    "AND ct.trang_thai_dv = 'CHUA_THUC_HIEN' " +
    "AND pk.trang_thai != 'HOAN_THANH' " +
    "AND DATE(p.ngay_chi_dinh) = CURDATE() " +
    "ORDER BY p.ngay_chi_dinh ASC",
    nativeQuery = true)
    List<java.util.Map<String, Object>> findPendingTests(@Param("maChuyenKhoa") Integer maChuyenKhoa);

    @Query(value = "SELECT ct.id as id, p.ma_phieu_kham as maPhieuKham, pk.ma_benh_nhan as maBenhNhan, " +
                   "ct.ma_dich_vu as maDichVu, " + 
                   "pk.ma_dich_vu as maDichVuPhieuKham, " +
                   "b.ho_ten as hoTen, b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, " +
                   "b.so_dien_thoai as soDienThoai, " +
                   "b.cccd as cccd, " +
                   "dv.ten_dich_vu as tenDichVu, p.ngay_chi_dinh as ngayChiDinh, ct.trang_thai_dv as trangThaiDv, " +
                   "ct.ma_nhan_vien_thuc_hien as maNhanVienThucHien, " +
                   "COALESCE(kqxn.trang_thai, kqcdha.trang_thai, 'CHO_DUYET') as trangThaiKq, " +
                   "dk.ma_phong as maPhong " +
                   "FROM chi_tiet_chi_dinh ct " +
                   "JOIN phieu_chi_dinh p ON ct.ma_phieu_chi_dinh = p.ma_phieu_chi_dinh " +
                   "JOIN phieu_kham pk ON p.ma_phieu_kham = pk.ma_phieu_kham " +
                   "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN dich_vu dv ON ct.ma_dich_vu = dv.ma_dich_vu " +
                   "LEFT JOIN ket_qua_xet_nghiem kqxn ON kqxn.ma_chi_tiet_chi_dinh = ct.id " +
                   "LEFT JOIN ket_qua_cdha kqcdha ON kqcdha.id_chi_tiet_chi_dinh = ct.id " +
                   "LEFT JOIN dang_ky_kham_benh dk ON dk.ma_phieu_kham = pk.ma_phieu_kham " +
                   "WHERE (:maChuyenKhoa IS NULL OR dv.ma_chuyen_khoa = :maChuyenKhoa) " +
                   "AND ct.trang_thai_dv = 'DA_THUC_HIEN' " +
                   "AND pk.trang_thai != 'HOAN_THANH' " +
                   "AND (kqxn.id IS NULL OR kqxn.trang_thai != 'DA_DUYET') " +
                   "AND (kqcdha.id IS NULL OR kqcdha.trang_thai != 'DA_DUYET') " +
                   "AND DATE(p.ngay_chi_dinh) = CURRENT_DATE " +
                   "ORDER BY p.ngay_chi_dinh DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findCompletedTestsToday(@Param("maChuyenKhoa") Integer maChuyenKhoa);

    @Query(value = 
        "SELECT DISTINCT " +
        "pk.ma_phieu_kham as maPhieuKham, " +
        "pk.ma_benh_nhan as maBenhNhan, " +
        "b.ho_ten as hoTen, " +
        "b.gioi_tinh as gioiTinh, " +
        "b.ngay_sinh as ngaySinh, " +
        "b.so_dien_thoai as soDienThoai, " +
        "b.cccd as cccd, " +
        "dv.ma_chuyen_khoa as maChuyenKhoa, " +
        "dv.ten_dich_vu as tenDichVu, " +
        "ct.id as chiTietId, " +
        "ct.ma_dich_vu as maDichVu, " +
        "pk.ma_dich_vu as maDichVuPhieuKham, " +
        "dv2.loai_dich_vu as loaiDichVu, " +
        "COALESCE(kqxn.trang_thai, kqcdha.trang_thai, 'CHO_DUYET') as trangThai, " +
        "COALESCE(kqxn.id, kqcdha.id) as ketQuaId, " +
        "CASE WHEN kqxn.id IS NOT NULL THEN 'XN' WHEN kqcdha.id IS NOT NULL THEN 'CDHA' ELSE 'UNKNOWN' END as loaiKetQua, " +
        "COALESCE(kqxn.ngay_thuc_hien, kqcdha.ngay_thuc_hien) as ngayThucHien " +
        "FROM chi_tiet_chi_dinh ct " +
        "JOIN phieu_chi_dinh p ON ct.ma_phieu_chi_dinh = p.ma_phieu_chi_dinh " +
        "JOIN phieu_kham pk ON p.ma_phieu_kham = pk.ma_phieu_kham " +
        "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
        "JOIN dich_vu dv ON ct.ma_dich_vu = dv.ma_dich_vu " +
        "LEFT JOIN dich_vu dv2 ON pk.ma_dich_vu = dv2.ma_dich_vu " +
        "LEFT JOIN ket_qua_xet_nghiem kqxn ON kqxn.ma_chi_tiet_chi_dinh = ct.id " +
        "LEFT JOIN ket_qua_cdha kqcdha ON kqcdha.id_chi_tiet_chi_dinh = ct.id " +
        "WHERE (:maChuyenKhoa IS NULL OR dv.ma_chuyen_khoa = :maChuyenKhoa) " +
        "AND ct.trang_thai_dv = 'DA_THUC_HIEN' " +
        "AND ((kqxn.id IS NOT NULL AND kqxn.trang_thai = 'CHO_DUYET') " +
        "     OR (kqcdha.id IS NOT NULL AND kqcdha.trang_thai = 'CHO_DUYET')) " +
        "AND DATE(p.ngay_chi_dinh) = CURRENT_DATE " +
        "ORDER BY ngayThucHien DESC",
        nativeQuery = true)
    List<java.util.Map<String, Object>> findPendingApprovalList(@Param("maChuyenKhoa") Integer maChuyenKhoa);

    @Query(value = 
        "SELECT DISTINCT " +
        "pk.ma_phieu_kham as maPhieuKham, " +
        "pk.ma_benh_nhan as maBenhNhan, " +
        "b.ho_ten as hoTen, " +
        "b.gioi_tinh as gioiTinh, " +
        "b.ngay_sinh as ngaySinh, " +
        "b.so_dien_thoai as soDienThoai, " +
        "b.cccd as cccd, " +
        "dv.ma_chuyen_khoa as maChuyenKhoa, " +
        "dv.ten_dich_vu as tenDichVu, " +
        "ct.id as chiTietId, " +
        "ct.ma_dich_vu as maDichVu, " +
        "pk.ma_dich_vu as maDichVuPhieuKham, " +
        "dv2.loai_dich_vu as loaiDichVu, " +
        "COALESCE(kqxn.trang_thai, kqcdha.trang_thai, 'DA_DUYET') as trangThai, " +
        "COALESCE(kqxn.id, kqcdha.id) as ketQuaId, " +
        "CASE WHEN kqxn.id IS NOT NULL THEN 'XN' WHEN kqcdha.id IS NOT NULL THEN 'CDHA' ELSE 'UNKNOWN' END as loaiKetQua, " +
        "COALESCE(kqxn.ngay_thuc_hien, kqcdha.ngay_thuc_hien) as ngayThucHien " +
        "FROM chi_tiet_chi_dinh ct " +
        "JOIN phieu_chi_dinh p ON ct.ma_phieu_chi_dinh = p.ma_phieu_chi_dinh " +
        "JOIN phieu_kham pk ON p.ma_phieu_kham = pk.ma_phieu_kham " +
        "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
        "JOIN dich_vu dv ON ct.ma_dich_vu = dv.ma_dich_vu " +
        "LEFT JOIN dich_vu dv2 ON pk.ma_dich_vu = dv2.ma_dich_vu " +
        "LEFT JOIN ket_qua_xet_nghiem kqxn ON kqxn.ma_chi_tiet_chi_dinh = ct.id " +
        "LEFT JOIN ket_qua_cdha kqcdha ON kqcdha.id_chi_tiet_chi_dinh = ct.id " +
        "WHERE (:maChuyenKhoa IS NULL OR dv.ma_chuyen_khoa = :maChuyenKhoa) " +
        "AND ((kqxn.id IS NOT NULL AND kqxn.trang_thai = 'DA_DUYET') " +
        "     OR (kqcdha.id IS NOT NULL AND kqcdha.trang_thai = 'DA_DUYET')) " +
        "AND DATE(p.ngay_chi_dinh) = CURRENT_DATE " +
        "ORDER BY ngayThucHien DESC",
        nativeQuery = true)
    List<java.util.Map<String, Object>> findApprovedList(@Param("maChuyenKhoa") Integer maChuyenKhoa);
}
