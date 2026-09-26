package com.qlpk.backend.service;

import com.qlpk.backend.entity.TaiKhoanBenhNhan;

import java.util.List;
import java.util.Optional;

public interface TaiKhoanBenhNhanService {

    List<TaiKhoanBenhNhan> getAllTaiKhoanBenhNhan();

    Optional<TaiKhoanBenhNhan> getTaiKhoanBenhNhanById(Integer id);

    TaiKhoanBenhNhan createTaiKhoanBenhNhan(TaiKhoanBenhNhan taiKhoanBenhNhan);

    TaiKhoanBenhNhan updateTaiKhoanBenhNhan(Integer id, TaiKhoanBenhNhan taiKhoanBenhNhanDetails);

    void deleteTaiKhoanBenhNhan(Integer id);

    Optional<TaiKhoanBenhNhan> findByUsername(String username);

    Optional<TaiKhoanBenhNhan> findByEmail(String email);

    Optional<TaiKhoanBenhNhan> findBySoDienThoai(String soDienThoai);

    Optional<TaiKhoanBenhNhan> findByMaBenhNhan(Integer maBenhNhan);

    boolean existsByEmail(String email);

    boolean existsBySoDienThoai(String soDienThoai);

    TaiKhoanBenhNhan login(String identity, String password);

    boolean doiMatKhau(String email, String newPassword);

    boolean emailVerified(String email);

    Optional<Integer> findMaBenhNhanByIdentity(String identity);

    TaiKhoanBenhNhan linkPatient(Integer id, Integer maBenhNhan);
}
