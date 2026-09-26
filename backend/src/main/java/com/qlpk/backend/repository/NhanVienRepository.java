package com.qlpk.backend.repository;

import com.qlpk.backend.entity.NhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import java.util.Date;
import java.util.List;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, Integer> {

    List<NhanVien> findByChucVu(String chucVu);

    List<NhanVien> findByChuyenKhoa(Integer chuyenKhoa);

    List<NhanVien> findByChucVuAndChuyenKhoa(String chucVu, Integer chuyenKhoa);

    @Query("""
        SELECT n FROM NhanVien n
        WHERE (
            :keyword IS NULL OR :keyword = '' OR
            LOWER(n.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(n.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(n.cccd) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(n.soDienThoai) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (:chuyenKhoa IS NULL OR n.chuyenKhoa = :chuyenKhoa)
        AND (
            :vaiTro IS NULL OR :vaiTro = '' OR
            EXISTS (
                SELECT tk.maTaiKhoan FROM TaiKhoan tk
                WHERE tk.maNhanVien = n.maNhanVien AND tk.vaiTro = :vaiTro
            )
        )
        ORDER BY n.maNhanVien DESC
        """)
    List<NhanVien> searchNhanVien(
        @Param("keyword") String keyword,
        @Param("chuyenKhoa") Integer chuyenKhoa,
        @Param("vaiTro") String vaiTro
    );

    @Procedure(procedureName = "sp_ThemNhanVienVaTaiKhoan")
    void themNhanVienVaTaiKhoan(
        @Param("p_HoTen") String p_HoTen,
        @Param("p_GioiTinh") Integer p_GioiTinh,
        @Param("p_NgaySinh") Date p_NgaySinh,
        @Param("p_CCCD") String p_CCCD,
        @Param("p_DiaChi") String p_DiaChi,
        @Param("p_SDT") String p_SDT,
        @Param("p_Email") String p_Email,
        @Param("p_BangCap") String p_BangCap,
        @Param("p_ChucVu") String p_ChucVu,
        @Param("p_ChuyenKhoa") Integer p_ChuyenKhoa,
        @Param("p_NgayVaoLam") Date p_NgayVaoLam,
        @Param("p_Username") String p_Username,
        @Param("p_Password") String p_Password,
        @Param("p_Role") String p_Role
    );
}
