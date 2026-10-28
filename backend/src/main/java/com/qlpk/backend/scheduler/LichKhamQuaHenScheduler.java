package com.qlpk.backend.scheduler;

import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.LichKhamRepository;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
import com.qlpk.backend.service.ThongBaoService;
import com.qlpk.backend.util.TimeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Scheduler định kỳ kiểm tra các lịch hẹn khám bệnh nhân đã quá hẹn.
 *
 * - Khi quá hẹn, hệ thống tự động chuyển trạng thái thành QUA_HEN và ghi nhận
 *   người hủy là HE_THONG.
 * - Chạy mỗi 5 phút 
 *

 * Phải dùng capNhatQuaHenCoDieuKien() (có WHERE atomic) thay vì save() thông thường
 * để tránh ghi đè trạng thái khi bệnh nhân vừa check-in giữa lúc scheduler chạy.
 * Chỉ giải phóng slot nếu cập nhật trạng thái thực sự thành công (rowsAffected > 0).
 */
@Component
public class LichKhamQuaHenScheduler {

    private static final Logger log = LoggerFactory.getLogger(LichKhamQuaHenScheduler.class);

    private static final String TRANG_THAI_QUA_HEN = "QUA_HEN";

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private ThongBaoService thongBaoService;

    /**
     * Chạy mỗi 5 phút. (Nếu render ngủ, cron-job.org sẽ đánh thức + trigger lại.)
     * Quy tắc: chỉ chuyển CHUA_DEN → QUA_HEN khi ngay_kham < hôm nay (sang ngày mới).
     */
    @Scheduled(cron = "0 */5 * * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void capNhatLichQuaHen() {
        LocalDate today = TimeUtil.today();
        List<LichKham> lichQuaHen = lichKhamRepository.findAppointmentsQuaNgayChuaDen(today);

        if (lichQuaHen == null || lichQuaHen.isEmpty()) {
            return;
        }

        log.info("=== Phát hiện {} lịch khám đã quá hẹn chưa check-in ===", lichQuaHen.size());

        for (LichKham lich : lichQuaHen) {
            try {
                int rowsAffected = lichKhamRepository.capNhatQuaHenCoDieuKien(lich.getId(), today, TimeUtil.now());
                if (rowsAffected == 0) {
                    log.info("Lịch khám #{} đã được xử lý bởi luồng khác, bỏ qua", lich.getId());
                    continue;
                }

                if (webSocketPublisher != null) {
                    webSocketPublisher.publishLichKhamChange("QUA_HEN", lich.getId(), TRANG_THAI_QUA_HEN);
                }

                // Gửi thông báo quá hẹn cho bệnh nhân (bọc try-catch riêng — không ảnh hưởng luồng chính)
                sendQuaHenNotification(lich);

                log.info("Lịch khám #{} (bệnh nhân {}) đã quá hẹn -> chuyển QUA_HEN",
                    lich.getId(), lich.getMaBenhNhan());
            } catch (Exception e) {
                log.error("Lỗi cập nhật lịch khám #{} quá hẹn: {}", lich.getId(), e.getMessage());
            }
        }
    }

    /**
     * Gửi thông báo quá hẹn cho bệnh nhân.
     * Tạo ThongBao + NotificationQueue với scheduledAt = NOW → Push Notification ngay lập tức.

     */
    private void sendQuaHenNotification(LichKham lich) {
        try {
            Integer maTaiKhoanBn = lich.getMaBenhNhan() != null
                ? taiKhoanBenhNhanRepository.findByMaBenhNhan(lich.getMaBenhNhan())
                    .map(acc -> acc.getMaTaiKhoanBn()).orElse(null)
                : null;
            if (maTaiKhoanBn != null) {
                String ngayKhamStr = lich.getNgayKham() != null
                    ? lich.getNgayKham().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";

                String noiDung = "Lịch khám ngày " + ngayKhamStr + " đã quá hẹn";

                // Tạo ThongBao — KHÔNG kiểm tra trùng lặp (mỗi lịch quá hẹn phải gửi thông báo)
                // sendFcm = true → FCM gửi ngay lập tức 
                thongBaoService.createThongBaoNoDedup(
                    maTaiKhoanBn,
                    "BENH_NHAN",
                    "Lịch khám đã quá hẹn",
                    noiDung,
                    "LICH_KHAM",
                    String.valueOf(lich.getId()),
                    EventType.LICH_KHAM_REMINDER.name(),
                    false,
                    true
                );
            }
        } catch (Exception notiErr) {
            log.error("Failed to send qua-hen notification for lich id={}: {}",
                lich.getId(), notiErr.getMessage());
        }
    }
}