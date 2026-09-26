package com.qlpk.backend.service;

import com.qlpk.backend.entity.BenhNhan;

public interface PatientService {

    BenhNhan createPatientAndLink(Integer maTaiKhoanBn, BenhNhan benhNhan);

    BenhNhan linkExistingPatient(Integer maTaiKhoanBn, String hoTen, String soDienThoai, String cccd);
}
