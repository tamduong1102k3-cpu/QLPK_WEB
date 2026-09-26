package com.qlpk.backend.scheduler;

import com.qlpk.backend.entity.ChiTietToaThuoc;
import com.qlpk.backend.entity.KhoThuoc;
import com.qlpk.backend.entity.ToaThuoc;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.ChiTietToaThuocRepository;
import com.qlpk.backend.repository.KhoThuocRepository;
import com.qlpk.backend.repository.ToaThuocRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ToaThuocHetHanScheduler {

    private static final Logger log = LoggerFactory.getLogger(ToaThuocHetHanScheduler.class);

    @Autowired
    private ToaThuocRepository toaThuocRepository;

    @Autowired
    private ChiTietToaThuocRepository chiTietToaThuocRepository;

    @Autowired
    private KhoThuocRepository khoThuocRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Scheduled(cron = "0 */5 * * * ?")
    @Transactional
    public void xuLyToaThuocHetHanNhanThuoc() {
        LocalDateTime now = LocalDateTime.now();
        List<ToaThuoc> toaQuaHan = toaThuocRepository.findToaChoCapQuaHan(now);
        if (toaQuaHan == null || toaQuaHan.isEmpty()) {
            return;
        }

        log.info("=== Phát hiện {} toa thuốc quá hạn nhận thuốc ===", toaQuaHan.size());

        for (ToaThuoc toa : toaQuaHan) {
            try {
                giaiPhongThuocVaCapNhatToa(toa);
            } catch (Exception e) {
                log.error("Lỗi xử lý toa thuốc #{} hết hạn: {}", toa.getMaToaThuoc(), e.getMessage());
            }
        }
    }

    private void giaiPhongThuocVaCapNhatToa(ToaThuoc toa) throws Exception {
        List<ChiTietToaThuoc> chiTietList = chiTietToaThuocRepository.findByMaToaThuoc(toa.getMaToaThuoc());
        if (chiTietList != null) {
            for (ChiTietToaThuoc ct : chiTietList) {
                int soLuongCan = tinhSoLuongCan(ct);
                if (soLuongCan <= 0) {
                    continue;
                }

                KhoThuoc kho = khoThuocRepository.findByMaThuocForUpdate(ct.getMaThuoc())
                        .orElseThrow(() -> new Exception("Không tìm thấy thuốc trong kho: " + ct.getMaThuoc()));

                int soLuongDaGiu = kho.getSoLuongDaGiu() != null ? kho.getSoLuongDaGiu() : 0;

                kho.setSoLuongDaGiu(Math.max(0, soLuongDaGiu - soLuongCan));
                kho.setNgayCapNhatCuoi(LocalDateTime.now());
                khoThuocRepository.save(kho);
            }
        }

        toaThuocRepository.updateTrangThaiHetHan(toa.getMaToaThuoc());

        if (webSocketPublisher != null) {
            webSocketPublisher.publishToaThuocChange("HET_HAN_NHAN_THUOC", toa.getMaPhieuKham());
            webSocketPublisher.publishKhoUpdate();
        }

        log.info("Toa thuốc #{} đã hết hạn -> giải phóng thuốc + chuyển HET_HAN_NHAN_THUOC", toa.getMaToaThuoc());
    }

    private int tinhSoLuongCan(ChiTietToaThuoc ct) {
        int lieu = 0;
        try { lieu += Integer.parseInt(ct.getSang()); } catch (Exception ignored) {}
        try { lieu += Integer.parseInt(ct.getTrua()); } catch (Exception ignored) {}
        try { lieu += Integer.parseInt(ct.getChieu()); } catch (Exception ignored) {}
        try { lieu += Integer.parseInt(ct.getToi()); } catch (Exception ignored) {}
        if (ct.getSoNgay() != null) lieu *= ct.getSoNgay();
        if (lieu <= 0) lieu = 1;
        return lieu;
    }
}
