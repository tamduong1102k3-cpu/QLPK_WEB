package com.qlpk.backend.repository;

import com.qlpk.backend.entity.PhieuChiDinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PhieuChiDinhRepository extends JpaRepository<PhieuChiDinh, Integer> {
    List<PhieuChiDinh> findByMaPhieuKham(Integer maPhieuKham);

    @Query("SELECT p FROM PhieuChiDinh p WHERE p.maPhieuKham IN (SELECT pk.maPhieuKham FROM PhieuKham pk WHERE pk.maBenhNhan = :maBenhNhan) ORDER BY p.ngayChiDinh DESC")
    List<PhieuChiDinh> findByMaBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);

    String TECH_LATEST_XN_STATUS =
            "(SELECT kq.trang_thai FROM ket_qua_xet_nghiem kq " +
            "WHERE kq.ma_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1)";

    String TECH_LATEST_CDHA_STATUS =
            "(SELECT kq.trang_thai FROM ket_qua_cdha kq " +
            "WHERE kq.id_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1)";

    String TECH_LATEST_RESULT_STATUS =
            "CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN " + TECH_LATEST_XN_STATUS +
            " WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN " + TECH_LATEST_CDHA_STATUS +
            " END";

    String CLS_DOCTOR_LIST_FROM =
            "FROM chi_tiet_chi_dinh ct " +
            "JOIN phieu_chi_dinh p ON p.ma_phieu_chi_dinh = ct.ma_phieu_chi_dinh " +
            "JOIN phieu_kham pk ON pk.ma_phieu_kham = p.ma_phieu_kham " +
            "JOIN benh_nhan b ON b.ma_benh_nhan = pk.ma_benh_nhan " +
            "JOIN dich_vu dv ON dv.ma_dich_vu = ct.ma_dich_vu ";

    String CLS_DOCTOR_XN_LATEST_STATUS =
            "(SELECT kq.trang_thai FROM ket_qua_xet_nghiem kq " +
            "WHERE kq.ma_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1)";

    String CLS_DOCTOR_CDHA_LATEST_STATUS =
            "(SELECT kq.trang_thai FROM ket_qua_cdha kq " +
            "WHERE kq.id_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1)";

    String CLS_DOCTOR_LIST_SELECT =
            "SELECT ct.id AS id, ct.id AS chiTietId, ct.ma_bac_si AS maBacSi, ct.nguon_tao AS nguonTao, " +
            "p.ma_phieu_kham AS maPhieuKham, pk.ma_benh_nhan AS maBenhNhan, " +
            "b.ho_ten AS hoTen, b.gioi_tinh AS gioiTinh, b.ngay_sinh AS ngaySinh, " +
            "b.so_dien_thoai AS soDienThoai, b.cccd AS cccd, " +
            "ct.ma_dich_vu AS maDichVu, pk.ma_dich_vu AS maDichVuPhieuKham, " +
            "dv.ten_dich_vu AS tenDichVu, dv.ma_chuyen_khoa AS maChuyenKhoa, " +
            "dv.loai_dich_vu AS loaiDichVu, p.ngay_chi_dinh AS ngayChiDinh, " +
            "ct.trang_thai_dv AS trangThaiDv, ct.ma_nhan_vien_thuc_hien AS maNhanVienThucHien, " +
            "ct.ma_phong AS ctMaPhong, " +
            "CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN " +
            "(SELECT kq.id FROM ket_qua_xet_nghiem kq WHERE kq.ma_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
            "WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN " +
            "(SELECT kq.id FROM ket_qua_cdha kq WHERE kq.id_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
            "END AS ketQuaId, " +
            "CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN 'XN' " +
            "WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN 'CDHA' END AS loaiKetQua, " +
            "CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN " + CLS_DOCTOR_XN_LATEST_STATUS +
            " WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN " + CLS_DOCTOR_CDHA_LATEST_STATUS +
            " END AS trangThaiKq, " +
            "CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN " +
            "(SELECT kq.ngay_thuc_hien FROM ket_qua_xet_nghiem kq WHERE kq.ma_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
            "WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN " +
            "(SELECT kq.ngay_thuc_hien FROM ket_qua_cdha kq WHERE kq.id_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
            "END AS ngayThucHien, " +
            "CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN " +
            "(SELECT CASE WHEN kq.trang_thai = 'TU_CHOI' THEN kq.ghi_chu_them END " +
            "FROM ket_qua_xet_nghiem kq WHERE kq.ma_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
            "WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN " +
            "(SELECT CASE WHEN kq.trang_thai = 'TU_CHOI' THEN kq.de_nghi END " +
            "FROM ket_qua_cdha kq WHERE kq.id_chi_tiet_chi_dinh = ct.id " +
            "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
            "END AS lyDoTuChoi " + CLS_DOCTOR_LIST_FROM;

    String CLS_DOCTOR_REVIEW_FILTERS =
            "WHERE dv.loai_dich_vu IN ('CLS_XET_NGHIEM', 'CLS_CHAN_DOAN_HINH_ANH') " +
            "AND dv.ma_chuyen_khoa = :maChuyenKhoa " +
            "AND ((ct.nguon_tao = 'DANG_KY_TRUC_TIEP' AND ct.ma_bac_si = :maBacSi " +
            "AND EXISTS (SELECT 1 FROM dang_ky_kham_benh dk " +
            "WHERE dk.ma_phieu_kham = pk.ma_phieu_kham " +
            "AND dk.ma_dich_vu = ct.ma_dich_vu " +
            "AND dk.ma_bac_si = :maBacSi)) " +
            "OR ct.nguon_tao = 'BAC_SI_CHI_DINH') " +
            "AND ((dv.loai_dich_vu = 'CLS_XET_NGHIEM' AND " + CLS_DOCTOR_XN_LATEST_STATUS +
            " IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI')) " +
            "OR (dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' AND " + CLS_DOCTOR_CDHA_LATEST_STATUS +
            " IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI'))) " +
            "AND (:fromDate IS NULL OR p.ngay_chi_dinh >= :fromDate) " +
            "AND (:toDateExclusive IS NULL OR p.ngay_chi_dinh < :toDateExclusive) " +
            "AND (:trangThaiDv IS NULL OR ct.trang_thai_dv = :trangThaiDv) " +
            "AND (:trangThaiKq IS NULL OR " +
            "(CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN " + CLS_DOCTOR_XN_LATEST_STATUS +
            " WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN " + CLS_DOCTOR_CDHA_LATEST_STATUS +
            " END) = :trangThaiKq) " +
            "AND (:maDichVu IS NULL OR ct.ma_dich_vu = :maDichVu) ";

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
    "CASE WHEN dv.loai_dich_vu = 'CLS_XET_NGHIEM' THEN " +
    "(SELECT CASE WHEN kq.trang_thai = 'TU_CHOI' THEN kq.ghi_chu_them END " +
    "FROM ket_qua_xet_nghiem kq WHERE kq.ma_chi_tiet_chi_dinh = ct.id " +
    "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
    "WHEN dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' THEN " +
    "(SELECT CASE WHEN kq.trang_thai = 'TU_CHOI' THEN kq.de_nghi END " +
    "FROM ket_qua_cdha kq WHERE kq.id_chi_tiet_chi_dinh = ct.id " +
    "ORDER BY kq.ngay_thuc_hien DESC, kq.id DESC LIMIT 1) " +
    "END as ghiChuThem, " +
    TECH_LATEST_RESULT_STATUS + " as trangThaiKq, " +
    "ct.ma_phong as ctMaPhong, " +
    "dk.ma_phong as maPhong " +
    "FROM chi_tiet_chi_dinh ct " +
    "JOIN phieu_chi_dinh p ON ct.ma_phieu_chi_dinh = p.ma_phieu_chi_dinh " +
    "JOIN phieu_kham pk ON p.ma_phieu_kham = pk.ma_phieu_kham " +
    "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
    "JOIN dich_vu dv ON ct.ma_dich_vu = dv.ma_dich_vu " +
    "LEFT JOIN dang_ky_kham_benh dk ON dk.ma_phieu_kham = pk.ma_phieu_kham " +
    "WHERE (:maChuyenKhoa IS NULL OR dv.ma_chuyen_khoa = :maChuyenKhoa) " +
    "AND ct.trang_thai_dv = 'CHUA_THUC_HIEN' " +
    "AND ((p.ngay_chi_dinh >= :start AND p.ngay_chi_dinh < :end) " +
    "OR (dv.loai_dich_vu = 'CLS_CHAN_DOAN_HINH_ANH' AND " +
    TECH_LATEST_CDHA_STATUS + " = 'TU_CHOI')) " +
    "ORDER BY p.ngay_chi_dinh ASC",
    nativeQuery = true)
    List<java.util.Map<String, Object>> findPendingTests(
            @Param("maChuyenKhoa") Integer maChuyenKhoa,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query(value = "SELECT ct.id as id, p.ma_phieu_kham as maPhieuKham, pk.ma_benh_nhan as maBenhNhan, " +
                   "ct.ma_dich_vu as maDichVu, " + // maDichVu = mã dịch vụ của chỉ tiêu xét nghiệm
                   "pk.ma_dich_vu as maDichVuPhieuKham, " +
                   "b.ho_ten as hoTen, b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, " +
                   "b.so_dien_thoai as soDienThoai, " +
                   "b.cccd as cccd, " +
                   "dv.ten_dich_vu as tenDichVu, p.ngay_chi_dinh as ngayChiDinh, ct.trang_thai_dv as trangThaiDv, " +
                   "ct.ma_nhan_vien_thuc_hien as maNhanVienThucHien, " +
                   TECH_LATEST_RESULT_STATUS + " as trangThaiKq, " +
                   "ct.ma_phong as ctMaPhong, " +
                   "dk.ma_phong as maPhong " +
                   "FROM chi_tiet_chi_dinh ct " +
                   "JOIN phieu_chi_dinh p ON ct.ma_phieu_chi_dinh = p.ma_phieu_chi_dinh " +
                   "JOIN phieu_kham pk ON p.ma_phieu_kham = pk.ma_phieu_kham " +
                   "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN dich_vu dv ON ct.ma_dich_vu = dv.ma_dich_vu " +
                   "LEFT JOIN dang_ky_kham_benh dk ON dk.ma_phieu_kham = pk.ma_phieu_kham " +
                   "WHERE (:maChuyenKhoa IS NULL OR dv.ma_chuyen_khoa = :maChuyenKhoa) " +
                   "AND ct.trang_thai_dv = 'DA_THUC_HIEN' " +
                   "AND pk.trang_thai != 'HOAN_THANH' " +
                   "AND (" + TECH_LATEST_RESULT_STATUS + " IS NULL OR " +
                   TECH_LATEST_RESULT_STATUS + " <> 'DA_DUYET') " +
                   "AND p.ngay_chi_dinh >= :start " +
                   "AND p.ngay_chi_dinh < :end " +
                   "ORDER BY p.ngay_chi_dinh DESC", nativeQuery = true)
    List<java.util.Map<String, Object>> findCompletedTestsToday(
            @Param("maChuyenKhoa") Integer maChuyenKhoa,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ====== NEW QUERIES FOR DOCTOR APPROVAL DASHBOARD ======

    /**
     * Lấy danh sách kết quả chờ duyệt (CHO_DUYET) theo chuyên khoa
     * Dùng cho bác sĩ chẩn đoán/xét nghiệm - tab "chờ duyệt"
     */
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
        "AND p.ngay_chi_dinh >= :start " +
        "AND p.ngay_chi_dinh < :end " +
        "ORDER BY ngayThucHien DESC",
        nativeQuery = true)
    List<java.util.Map<String, Object>> findPendingApprovalList(
            @Param("maChuyenKhoa") Integer maChuyenKhoa,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * Lấy danh sách kết quả đã duyệt (DA_DUYET) theo chuyên khoa
     * Dùng cho bác sĩ chẩn đoán/xét nghiệm - tab "đã duyệt"
     */
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
        "AND p.ngay_chi_dinh >= :start " +
        "AND p.ngay_chi_dinh < :end " +
        "ORDER BY ngayThucHien DESC",
        nativeQuery = true)
    List<java.util.Map<String, Object>> findApprovedList(
            @Param("maChuyenKhoa") Integer maChuyenKhoa,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query(value = CLS_DOCTOR_LIST_SELECT + CLS_DOCTOR_REVIEW_FILTERS +
            "ORDER BY ngayThucHien DESC, ct.id DESC",
            countQuery = "SELECT COUNT(*) " + CLS_DOCTOR_LIST_FROM + CLS_DOCTOR_REVIEW_FILTERS,
            nativeQuery = true)
    Page<java.util.Map<String, Object>> findDoctorClsReviewQueue(
            @Param("maBacSi") Integer maBacSi,
            @Param("maChuyenKhoa") Integer maChuyenKhoa,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDateExclusive") LocalDateTime toDateExclusive,
            @Param("trangThaiDv") String trangThaiDv,
            @Param("trangThaiKq") String trangThaiKq,
            @Param("maDichVu") Integer maDichVu,
            Pageable pageable);
}
