package com.qlpk.backend.repository;

import com.qlpk.backend.entity.KetQuaCdha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.repository.query.Param;

@Repository
public interface KetQuaCdhaRepository extends JpaRepository<KetQuaCdha, Integer> {
    Optional<KetQuaCdha> findByIdChiTietChiDinh(Integer idChiTietChiDinh);

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
            "WHERE DATE(k.ngay_thuc_hien) = CURDATE()", nativeQuery = true)
    List<Map<String, Object>> findResultsTodayWithPatientInfo();

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
            "WHERE DATE(k.ngay_thuc_hien) = CURDATE() " +
            "AND k.ma_bac_si_thuc_hien = :maBacSi", nativeQuery = true)
    List<Map<String, Object>> findResultsTodayWithPatientInfoByDoctorId(@Param("maBacSi") Integer maBacSi);
}
