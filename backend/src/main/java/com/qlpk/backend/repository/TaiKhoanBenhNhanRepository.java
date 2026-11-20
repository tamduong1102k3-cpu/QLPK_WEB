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

    boolean existsByUsername(String username);
    boolean existsByUsernameAndMaTaiKhoanBnNot(String username, Integer maTaiKhoanBn);
    boolean existsByEmail(String email);
    boolean existsByEmailAndMaTaiKhoanBnNot(String email, Integer maTaiKhoanBn);
    boolean existsBySoDienThoai(String soDienThoai);
    boolean existsBySoDienThoaiAndMaTaiKhoanBnNot(String soDienThoai, Integer maTaiKhoanBn);
    boolean existsByMaBenhNhan(Integer maBenhNhan);
    boolean existsByMaBenhNhanAndMaTaiKhoanBnNot(Integer maBenhNhan, Integer maTaiKhoanBn);

    void deleteByMaBenhNhan(Integer maBenhNhan);
}