package com.qlpk.backend.scheduler;

import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.LichKhamRepository;
import com.qlpk.backend.service.SoLanQuaHenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class SoLanQuaHenScheduler {

    private static final Logger log = LoggerFactory.getLogger(SoLanQuaHenScheduler.class);

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private SoLanQuaHenService soLanQuaHenService;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Scheduled(cron = "0 */5 * * * ?")
    public void tinhSoLanQuaHen() {
        List<LichKham> danhSach = lichKhamRepository.findQuaHenChuaTinhSoLan();
        if (danhSach == null || danhSach.isEmpty()) return;

        log.info("=== Phát hiện {} lịch QUA_HEN chưa tính, chuẩn bị so_lan_qua_hen ===", danhSach.size());

        for (LichKham lich : danhSach) {
            try {
                soLanQuaHenService.xuLyMotLichQuaHen(lich.getId(), lich.getMaBenhNhan());
            } catch (Exception e) {
                log.error("Lỗi tính so_lan_qua_hen cho lịch #{}: {}", lich.getId(), e.getMessage());
            }
        }
    }

    /**
     * Reset số lần vắng mặt của TẤT CẢ bệnh nhân về 0 vào 00:00 ngày 1 mỗi tháng.
     * Cột benh_nhan.so_lan_qua_hen là bộ đếm theo THÁNG
     */
    @Scheduled(cron = "0 0 0 1 * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void resetSoLanQuaHenDauThang() {
        try {
            int rows = benhNhanRepository.resetAllSoLanQuaHen();
            log.info("[Reset đầu tháng] Đã reset so_lan_qua_hen cho {} bệnh nhân", rows);
        } catch (Exception e) {
            log.error("[Reset đầu tháng] Lỗi reset so_lan_qua_hen: {}", e.getMessage());
        }
    }
}