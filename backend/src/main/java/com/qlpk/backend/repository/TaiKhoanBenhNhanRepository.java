package com.qlpk.backend.repository;

import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaiKhoanBenhNhanRepository extends JpaRepository<TaiKhoanBenhNhan, Integer> {

    Optional<TaiKhoanBenhNhan> findByUsername(String username);

    Optional<TaiKhoanBenhNhan> findByEmail(String email);

    Optional<TaiKhoanBenhNhan> findBySoDienThoai(String soDienThoai);

    Optional<TaiKhoanBenhNhan> findByMaBenhNhan(Integer maBenhNhan);

    boolean existsByEmail(String email);

    boolean existsBySoDienThoai(String soDienThoai);

    void deleteByMaBenhNhan(Integer maBenhNhan);
}
