package com.qlpk.backend.service;

import com.qlpk.backend.entity.TaiKhoanBenhNhan;

import java.util.List;
import java.util.Optional;

public interface TaiKhoanBenhNhanService {

    List<TaiKhoanBenhNhan> getAllTaiKhoanBenhNhan();

    Optional<TaiKhoanBenhNhan> getTaiKhoanBenhNhanById(Integer id);

    TaiKhoanBenhNhan createTaiKhoanBenhNhan(TaiKhoanBenhNhan taiKhoanBenhNhan);

    TaiKhoanBenhNhan updateTaiKhoanBenhNhan(Integer id, TaiKhoanBenhNhan taiKhoanBenhNhanDetails);

    Optional<TaiKhoanBenhNhan> findByUsername(String username);

    Optional<TaiKhoanBenhNhan> findByEmail(String email);

    Optional<TaiKhoanBenhNhan> findBySoDienThoai(String soDienThoai);

    Optional<TaiKhoanBenhNhan> findByMaBenhNhan(Integer maBenhNhan);

    boolean existsByEmail(String email);

    boolean existsBySoDienThoai(String soDienThoai);

    TaiKhoanBenhNhan login(String identity, String password);

    boolean doiMatKhau(String email, String newPassword);

    /**
     * Đổi mật khẩu khi đã login — verify mật khẩu cũ.
     * @return message thành công
     * @throws RuntimeException nếu mật khẩu cũ sai hoặc user không tồn tại
     */
    String changePassword(Integer id, String oldPassword, String newPassword);

    boolean emailVerified(String email);

    Optional<Integer> findMaBenhNhanByIdentity(String identity);

    /** Liên kết hồ sơ bệnh nhân: CHỈ cập nhật maBenhNhan
     *  Trả về account đã cập nhật nếu thành công, null nếu không tìm thấy tài khoản. */
    TaiKhoanBenhNhan linkPatient(Integer id, Integer maBenhNhan);
}
