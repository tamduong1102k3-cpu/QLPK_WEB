package com.qlpk.backend.repository;

import com.qlpk.backend.entity.KetQuaXetNghiem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface KetQuaXetNghiemRepository extends JpaRepository<KetQuaXetNghiem, Integer> {
    Optional<KetQuaXetNghiem> findByMaChiTietChiDinh(Integer maChiTietChiDinh);

    @Query(value = "SELECT pk.ma_phieu_kham as maPhieuKham, b.ho_ten as hoTen, " +
                   "b.gioi_tinh as gioiTinh, b.ngay_sinh as ngaySinh, " +
                   "kq.ngay_thuc_hien as ngayKham, kq.trang_thai as trangThai, " +
                   "dv.ten_dich_vu as chanDoan " +
                   "FROM ket_qua_xet_nghiem kq " +
                   "JOIN chi_tiet_chi_dinh ct ON kq.ma_chi_tiet_chi_dinh = ct.id " +
                   "JOIN phieu_chi_dinh pcd ON ct.ma_phieu_chi_dinh = pcd.ma_phieu_chi_dinh " +
                   "JOIN phieu_kham pk ON pcd.ma_phieu_kham = pk.ma_phieu_kham " +
                   "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
                   "JOIN dich_vu dv ON ct.ma_dich_vu = dv.ma_dich_vu " +
                   "WHERE kq.ma_bs_ket_luan = :maBacSi " +
                   "AND kq.trang_thai = 'DA_DUYET' " +
                   "AND DATE(kq.ngay_thuc_hien) = CURRENT_DATE " +
                   "ORDER BY kq.ngay_thuc_hien DESC", nativeQuery = true)
    List<Map<String, Object>> findApprovedHistoryDetailed(@Param("maBacSi") Integer maBacSi);

   @Query(value = "SELECT k.id as id, " +
           "b.ma_benh_nhan as maBenhNhan, " +
           "b.ho_ten as hoTen, " +
           "b.gioi_tinh as gioiTinh, " +
           "b.ngay_sinh as ngaySinh, " +
           "k.trang_thai as trangThai, " +
           "pk.ma_phieu_kham as maPhieuKham, " +
           "pk.ghi_chu as ghiChu, " +
           "dk.ma_phong as maPhong " + 
           "FROM ket_qua_xet_nghiem k " +
           "JOIN chi_tiet_chi_dinh ct ON k.ma_chi_tiet_chi_dinh = ct.id " +
           "JOIN phieu_chi_dinh pcd ON ct.ma_phieu_chi_dinh = pcd.ma_phieu_chi_dinh " +
           "JOIN phieu_kham pk ON pcd.ma_phieu_kham = pk.ma_phieu_kham " +
           "JOIN benh_nhan b ON pk.ma_benh_nhan = b.ma_benh_nhan " +
           "LEFT JOIN dang_ky_kham_benh dk ON dk.ma_phieu_kham = pk.ma_phieu_kham " +
           "WHERE DATE(k.ngay_thuc_hien) = CURDATE()", nativeQuery = true)
      List<Map<String, Object>> findResultsTodayWithPatientInfo();

}
