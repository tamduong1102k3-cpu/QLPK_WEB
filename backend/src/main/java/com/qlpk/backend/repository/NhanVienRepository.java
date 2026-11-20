package com.qlpk.backend.repository;

import com.qlpk.backend.entity.NhanVien;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, Integer> {

    boolean existsByCccd(String cccd);
    boolean existsByCccdAndMaNhanVienNot(String cccd, Integer maNhanVien);
    boolean existsBySoDienThoai(String soDienThoai);
    boolean existsBySoDienThoaiAndMaNhanVienNot(String soDienThoai, Integer maNhanVien);
    boolean existsByEmail(String email);
    boolean existsByEmailAndMaNhanVienNot(String email, Integer maNhanVien);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT n FROM NhanVien n WHERE n.maNhanVien = :id")
    Optional<NhanVien> findByIdForUpdate(@Param("id") Integer id);

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
}
