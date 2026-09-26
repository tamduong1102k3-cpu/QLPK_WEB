package com.qlpk.backend.repository;

import com.qlpk.backend.entity.TaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Integer> {
    TaiKhoan findByUsername(String username);
    TaiKhoan findByEmail(String email);
    TaiKhoan findByMaNhanVien(Integer maNhanVien);
    void deleteByMaNhanVien(Integer maNhanVien);
}
