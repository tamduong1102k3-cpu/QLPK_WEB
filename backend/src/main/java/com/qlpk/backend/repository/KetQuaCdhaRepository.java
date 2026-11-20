package com.qlpk.backend.repository;

import com.qlpk.backend.entity.KetQuaCdha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.repository.query.Param;

@Repository
public interface KetQuaCdhaRepository extends JpaRepository<KetQuaCdha, Integer> {
    boolean existsByIdChiTietChiDinh(Integer idChiTietChiDinh);

    @Modifying
    @Query(value = "UPDATE ket_qua_cdha SET ma_bac_si_thuc_hien = :maBacSi " +
            "WHERE id = :id AND trang_thai = 'CHO_DUYET' AND ma_bac_si_thuc_hien IS NULL",
            nativeQuery = true)
    int claimPendingResult(@Param("id") Integer id, @Param("maBacSi") Integer maBacSi);

    Optional<KetQuaCdha> findFirstByIdChiTietChiDinhOrderByNgayThucHienDescIdDesc(
            Integer idChiTietChiDinh);

    @Query(value = "SELECT kq.id AS id, kq.ket_luan AS ketLuan, " +
            "kq.mo_ta_hinh_anh AS moTaHinhAnh, kq.de_nghi AS deNghi, " +
            "kq.ma_bac_si_thuc_hien AS maBacSiThucHien, " +
            "nv.ho_ten AS tenNhanVien " +
            "FROM ket_qua_cdha kq " +
            "JOIN chi_tiet_chi_dinh ct ON ct.id = kq.id_chi_tiet_chi_dinh " +
            "JOIN phieu_chi_dinh pcd ON pcd.ma_phieu_chi_dinh = ct.ma_phieu_chi_dinh " +
            "JOIN phieu_kham pk ON pk.ma_phieu_kham = pcd.ma_phieu_kham " +
            "LEFT JOIN nhan_vien nv ON nv.ma_nhan_vien = kq.ma_bac_si_thuc_hien " +
            "WHERE pk.ma_benh_nhan = :maBenhNhan AND pk.ma_phieu_kham = :maPhieuKham " +
            "ORDER BY kq.ngay_thuc_hien DESC", nativeQuery = true)
    List<KetQuaCdhaLichSuProjection> findLichSuDetailsByMaBenhNhanAndMaPhieuKham(
            @Param("maBenhNhan") Integer maBenhNhan,
            @Param("maPhieuKham") Integer maPhieuKham);

    @Query(value = "SELECT kq.* FROM ket_qua_cdha kq " +
            "JOIN chi_tiet_chi_dinh ct ON ct.id = kq.id_chi_tiet_chi_dinh " +
            "JOIN phieu_chi_dinh pcd ON pcd.ma_phieu_chi_dinh = ct.ma_phieu_chi_dinh " +
            "JOIN phieu_kham pk ON pk.ma_phieu_kham = pcd.ma_phieu_kham " +
            "WHERE pk.ma_benh_nhan = :maBenhNhan AND pk.ma_phieu_kham = :maPhieuKham " +
            "ORDER BY kq.ngay_thuc_hien DESC", nativeQuery = true)
    List<KetQuaCdha> findLichSuByMaBenhNhanAndMaPhieuKham(
            @Param("maBenhNhan") Integer maBenhNhan,
            @Param("maPhieuKham") Integer maPhieuKham);
    
    /** Tìm kết quả chẩn đoán hình ảnh trong ngày kèm thông tin bệnh nhân */
    @Query(value = "SELECT k.id as id, " +
            "b.ma_benh_nhan as maBenhNhan, " +
            "b.ho_ten as hoTen, " +
            "b.gioi_tinh as gioiTinh, " +
            "b.ngay_sinh as ngaySinh, " +
            "k.trang_thai as trangThai, " +
            "pk.ma_phieu_kham as maPhieuKham, " +
            "pk.ghi_chu as ghiChu, " +
            "dk.ma_phong as maPhong " +
            "FROM ket_qua_cdha k " +
            "JOIN chi_tiet_chi_dinh ct ON k.id_chi_tiet_chi_dinh = ct.id " +
            "JOIN phieu_chi_dinh pcd ON ct.ma_phieu_chi_dinh = pcd.ma_phieu_chi_dinh " +
            "JOIN phieu_kham pk ON pcd.ma_phieu_kham = pk.ma_phieu_kham " +
            "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
            "LEFT JOIN dang_ky_kham_benh dk ON dk.ma_phieu_kham = pk.ma_phieu_kham " +
            "WHERE k.ngay_thuc_hien >= :start " +
            "AND k.ngay_thuc_hien < :end", nativeQuery = true)
    List<Map<String, Object>> findResultsTodayWithPatientInfo(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /** Tìm kết quả chẩn đoán hình ảnh trong ngày kèm thông tin bệnh nhân theo bác sĩ thực hiện */
    @Query(value = "SELECT k.id as id, " +
            "b.ma_benh_nhan as maBenhNhan, " +
            "b.ho_ten as hoTen, " +
            "b.gioi_tinh as gioiTinh, " +
            "b.ngay_sinh as ngaySinh, " +
            "k.trang_thai as trangThai, " +
            "pk.ma_phieu_kham as maPhieuKham, " +
            "pk.ghi_chu as ghiChu " +
            "FROM ket_qua_cdha k " +
            "JOIN chi_tiet_chi_dinh ct ON k.id_chi_tiet_chi_dinh = ct.id " +
            "JOIN phieu_chi_dinh pcd ON ct.ma_phieu_chi_dinh = pcd.ma_phieu_chi_dinh " +
            "JOIN phieu_kham pk ON pcd.ma_phieu_kham = pk.ma_phieu_kham " +
            "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
            "WHERE k.ngay_thuc_hien >= :start " +
            "AND k.ngay_thuc_hien < :end " +
            "AND k.ma_bac_si_thuc_hien = :maBacSi", nativeQuery = true)
    List<Map<String, Object>> findResultsTodayWithPatientInfoByDoctorId(
            @Param("maBacSi") Integer maBacSi,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
