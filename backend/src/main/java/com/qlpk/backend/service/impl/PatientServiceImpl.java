package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.BenhNhan;
import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
import com.qlpk.backend.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class PatientServiceImpl implements PatientService {

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Override
    @Transactional
    public BenhNhan createPatientAndLink(Integer maTaiKhoanBn, BenhNhan benhNhan) {

        TaiKhoanBenhNhan taiKhoan = taiKhoanBenhNhanRepository.findById(maTaiKhoanBn)
                .orElseThrow(() -> new RuntimeException("Tài khoản bệnh nhân không tồn tại!"));

        if (taiKhoan.getMaBenhNhan() != null) {
            throw new RuntimeException("Tài khoản này đã được liên kết với hồ sơ bệnh nhân!");
        }

        benhNhan.setDaXacMinhDanhTinh(false);

        BenhNhan savedBenhNhan = benhNhanRepository.save(benhNhan);

        taiKhoan.setMaBenhNhan(savedBenhNhan.getMaBenhNhan());
        taiKhoanBenhNhanRepository.save(taiKhoan);

        return savedBenhNhan;
    }

    @Override
    @Transactional
    public BenhNhan linkExistingPatient(Integer maTaiKhoanBn, String hoTen, String soDienThoai, String cccd) {

        TaiKhoanBenhNhan taiKhoan = taiKhoanBenhNhanRepository.findById(maTaiKhoanBn)
                .orElseThrow(() -> new RuntimeException("Tài khoản bệnh nhân không tồn tại!"));

        if (taiKhoan.getMaBenhNhan() != null) {
            throw new RuntimeException("Tài khoản này đã được liên kết với hồ sơ bệnh nhân!");
        }

        Optional<BenhNhan> existingOpt = benhNhanRepository.findExactMatch(hoTen, soDienThoai, cccd);

        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy hồ sơ bệnh nhân phù hợp. Vui lòng kiểm tra lại thông tin hoặc liên hệ phòng khám để xác minh.");
        }

        BenhNhan existingBenhNhan = existingOpt.get();

        taiKhoan.setMaBenhNhan(existingBenhNhan.getMaBenhNhan());
        taiKhoanBenhNhanRepository.save(taiKhoan);

        return existingBenhNhan;
    }
}
