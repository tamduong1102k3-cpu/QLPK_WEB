package com.qlpk.backend.service;

import com.qlpk.backend.entity.TaiKhoan;
import java.util.List;
import java.util.Map;

public interface TaiKhoanService {
    List<TaiKhoan> getAllTaiKhoan();
    TaiKhoan getTaiKhoanById(Integer id);
    TaiKhoan createTaiKhoan(TaiKhoan taiKhoan);
    TaiKhoan updateTaiKhoan(Integer id, TaiKhoan taiKhoanDetails);
    void deleteTaiKhoan(Integer id);
    TaiKhoan login(String identity, String password);
    TaiKhoan findByEmail(String email);
    TaiKhoan findByUsername(String username);
    boolean doiMatKhauTheoEmail(String email, String newPassword);
    boolean doiMatKhauLanDau(String email, String newPassword);
    boolean changePassword(Integer id, String oldPassword, String newPassword);
    Map<String, Object> getChuyenKhoaInfo(Integer maNhanVien);
}
