package com.qlpk.backend.service;

import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.LichKhamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SoLanQuaHenService {

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    /**
     * Xử lý 1 lịch quá hẹn: mark atomic trước, chỉ tăng điểm khi mark thành công.
     * Nếu tăng điểm lỗi, transaction rollback cả mark → lần scheduler sau xử lý lại
     * (idempotent, không mất lượt tính, không cộng trùng).
     */
    @Transactional
    public void xuLyMotLichQuaHen(Integer maLichKham, Integer maBenhNhan) {
        int rows = lichKhamRepository.markDaTinhQuaHenIfEligible(maLichKham);
        if (rows > 0) {
            benhNhanRepository.tangSoLanQuaHen(maBenhNhan);
        }
    }
}