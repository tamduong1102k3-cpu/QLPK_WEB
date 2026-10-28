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

/**
 * Scheduler định kỳ xử lý các toa thuốc đã thanh toán (CHO_CAP_THUOC)
 * bệnh nhân không đến nhận thuốc trong thời hạn quy định.
 *
 *
 * - Mỗi toa sau khi thanh toán được giữ thuốc 24 giờ.
 * - Sau 24 giờ, nếu bệnh nhân chưa nhận thuốc:
 *   + Giải phóng số lượng thuốc đã giữ (soLuongDaGiu -= soLuongCan).
 *   + KHÔNG trừ soLuongTon vì thuốc chưa thực sự xuất khỏi kho.
 *   + Chuyển trạng thái toa thành HET_HAN_NHAN_THUOC.
 * - Hóa đơn giữ nguyên trạng thái "đã thanh toán"; hoàn tiền là nghiệp vụ tài chính riêng.
 */
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

    /**
     * Chạy mỗi 5 phút. (Nếu render ngủ, cron-job.org sẽ đánh thức + trigger lại.)
     */
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
                // Khóa dòng kho để tránh cập nhật đồng thời
                KhoThuoc kho = khoThuocRepository.findByMaThuocForUpdate(ct.getMaThuoc())
                        .orElseThrow(() -> new Exception("Không tìm thấy thuốc trong kho: " + ct.getMaThuoc()));

                int soLuongDaGiu = kho.getSoLuongDaGiu() != null ? kho.getSoLuongDaGiu() : 0;
                // Giải phóng số lượng thuốc đã giữ cho toa này (thuốc chưa xuất kho => không đụng soLuongTon)
                kho.setSoLuongDaGiu(Math.max(0, soLuongDaGiu - soLuongCan));
                kho.setNgayCapNhatCuoi(LocalDateTime.now());
                khoThuocRepository.save(kho);
            }
        }

        // Cập nhật trạng thái toa thành HET_HAN_NHAN_THUOC
        toaThuocRepository.updateTrangThaiHetHan(toa.getMaToaThuoc());

        // Publish sự kiện realtime cho dược sĩ + kho
        if (webSocketPublisher != null) {
            webSocketPublisher.publishToaThuocChange("HET_HAN_NHAN_THUOC", toa.getMaPhieuKham());
            webSocketPublisher.publishKhoUpdate();
        }

        log.info("Toa thuốc #{} đã hết hạn -> giải phóng thuốc + chuyển HET_HAN_NHAN_THUOC", toa.getMaToaThuoc());
    }

    /**
     * Tính tổng số lượng thuốc cần dùng trong toa:
     * (sang + trua + chieu + toi) * soNgay, tối thiểu 1.
     */
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