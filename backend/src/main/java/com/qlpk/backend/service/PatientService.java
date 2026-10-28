package com.qlpk.backend.service;

import com.qlpk.backend.entity.BenhNhan;

public interface PatientService {

    /**
     * Tạo mới hồ sơ bệnh nhân và liên kết với tài khoản bệnh nhân đang đăng nhập.
     * Chỉ hoạt động nếu tài khoản chưa có maBenhNhan.
     */
    BenhNhan createPatientAndLink(Integer maTaiKhoanBn, BenhNhan benhNhan);

    /**
     * Liên kết tài khoản bệnh nhân với hồ sơ bệnh nhân đã tồn tại.
     * Yêu cầu khớp chính xác (hoTen, soDienThoai, cccd).
     */
    BenhNhan linkExistingPatient(Integer maTaiKhoanBn, String hoTen, String soDienThoai, String cccd);
}