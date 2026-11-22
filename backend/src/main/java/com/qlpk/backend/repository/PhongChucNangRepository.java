package com.qlpk.backend.repository;

import com.qlpk.backend.entity.PhongChucNang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhongChucNangRepository extends JpaRepository<PhongChucNang, Integer> {
    boolean existsByTenPhongIgnoreCase(String tenPhong);
    boolean existsByTenPhongIgnoreCaseAndMaPhongNot(String tenPhong, Integer maPhong);
    List<PhongChucNang> findByMaChucVu(Integer maChucVu);
    List<PhongChucNang> findByMaChuyenKhoa(Integer maChuyenKhoa);
    List<PhongChucNang> findByMaChuyenKhoaAndMaChucVu(Integer maChuyenKhoa, Integer maChucVu);

    @Query("SELECT DISTINCT p.tenPhong FROM PhongChucNang p "
        + "WHERE p.tenPhong IS NOT NULL AND TRIM(p.tenPhong) <> '' "
        + "ORDER BY p.tenPhong ASC")
    List<String> findDistinctTenPhong();

    @Query("SELECT COALESCE(SUM(p.soLuongToiDa), 0) FROM PhongChucNang p "
        + "WHERE p.maChuyenKhoa = :maChuyenKhoa "
        + "AND (:maPhongHienTai IS NULL OR p.maPhong != :maPhongHienTai) "
        + "AND p.maChucVu IN :allowedMaChucVus")
    Long sumKtvQuotaByChuyenKhoa(
        @Param("maChuyenKhoa") Integer maChuyenKhoa,
        @Param("maPhongHienTai") Integer maPhongHienTai,
        @Param("allowedMaChucVus") List<Integer> allowedMaChucVus
    );
}
