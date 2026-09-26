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

    @Transactional
    public void xuLyMotLichQuaHen(Integer maLichKham, Integer maBenhNhan) {
        int rows = lichKhamRepository.markDaTinhQuaHenIfEligible(maLichKham);
        if (rows > 0) {
            benhNhanRepository.tangSoLanQuaHen(maBenhNhan);
        }
    }
}
