package com.qlpk.backend.repository;

import com.qlpk.backend.entity.TaiKhoan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Integer> {
    TaiKhoan findByUsername(String username);
    TaiKhoan findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndMaTaiKhoanNot(String username, Integer maTaiKhoan);
    boolean existsByEmail(String email);
    boolean existsByEmailAndMaTaiKhoanNot(String email, Integer maTaiKhoan);
    TaiKhoan findByMaNhanVien(Integer maNhanVien);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT tk FROM TaiKhoan tk WHERE tk.maNhanVien = :maNhanVien")
    TaiKhoan findByMaNhanVienForUpdate(@Param("maNhanVien") Integer maNhanVien);
    List<TaiKhoan> findByMaNhanVienIn(List<Integer> maNhanViens);
    void deleteByMaNhanVien(Integer maNhanVien);
    List<TaiKhoan> findByVaiTro(String vaiTro);
}
