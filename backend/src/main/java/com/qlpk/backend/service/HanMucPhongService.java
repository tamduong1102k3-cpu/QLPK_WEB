package com.qlpk.backend.service;

import com.qlpk.backend.entity.HanMucNgay;
import com.qlpk.backend.entity.PhongChucNang;
import com.qlpk.backend.exception.SlotFullException;
import com.qlpk.backend.repository.HanMucNgayRepository;
import com.qlpk.backend.repository.PhongChucNangRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class HanMucPhongService {

    @Autowired
    private HanMucNgayRepository hanMucNgayRepository;

    @Autowired
    private PhongChucNangRepository phongChucNangRepository;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public boolean giuChoPhong(Integer maPhong, LocalDate ngay) {
        if (maPhong == null || ngay == null) {
            return false;
        }

        Integer soToiDa = phongChucNangRepository.findById(maPhong)
                .map(PhongChucNang::getSoLuongToiDa)
                .orElse(0);
        if (soToiDa == null || soToiDa <= 0) {
            return false;
        }

        hanMucNgayRepository.insertIfAbsent(maPhong, ngay);

        int rows = hanMucNgayRepository.incrementIfAvailable(maPhong, ngay);
        if (rows == 0) {
            throw new SlotFullException("Phòng khám này đã hết chỗ trong ngày " + ngay + ".");
        }

        return true;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void giaiPhongPhong(Integer maPhong, LocalDate ngay) {
        if (maPhong == null || ngay == null) {
            return;
        }

        hanMucNgayRepository.insertIfAbsent(maPhong, ngay);
        hanMucNgayRepository.releaseSlot(maPhong, ngay);
    }
}
