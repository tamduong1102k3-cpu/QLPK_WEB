package com.qlpk.backend.scheduler;

import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.entity.NotificationQueue;
import com.qlpk.backend.entity.NotificationQueueStatus;
import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import com.qlpk.backend.entity.ThongBao;
import com.qlpk.backend.repository.ChuyenKhoaRepository;
import com.qlpk.backend.repository.LichKhamRepository;
import com.qlpk.backend.repository.NhanVienRepository;
import com.qlpk.backend.repository.NotificationQueueRepository;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
import com.qlpk.backend.repository.ThongBaoRepository;
import com.qlpk.backend.service.ThongBaoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private ThongBaoService thongBaoService;

    @Autowired
    private ThongBaoRepository thongBaoRepository;

    @Autowired
    private ChuyenKhoaRepository chuyenKhoaRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private NotificationQueueRepository notificationQueueRepository;

    @Scheduled(cron = "0 0 7 * * ?")
    public void sendAppointmentReminderForNextDay() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        log.info("=== Checking appointments for date: {} ===", tomorrow);

        try {
            List<LichKham> appointments = lichKhamRepository.findAppointmentsForReminder(tomorrow);
            log.info("Found {} appointments for tomorrow", appointments.size());

            for (LichKham appointment : appointments) {
                String trangThai = appointment.getTrangThai();
                if ("HUY".equals(trangThai) ||
                    "HOAN".equals(trangThai) ||
                    "QUA_HEN".equals(trangThai)) {
                    continue;
                }

                if (appointment.getMaBenhNhan() == null) {
                    log.warn("No maBenhNhan for appointment {}", appointment.getId());
                    continue;
                }

                TaiKhoanBenhNhan account = taiKhoanBenhNhanRepository
                    .findByMaBenhNhan(appointment.getMaBenhNhan())
                    .orElse(null);
                if (account == null) {
                    log.warn("No account found for patient {}", appointment.getMaBenhNhan());
                    continue;
                }

                Integer maTaiKhoanBn = account.getMaTaiKhoanBn();

                boolean daCoThongBao = thongBaoRepository
                    .existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventType(
                        maTaiKhoanBn, "BENH_NHAN", "LICH_KHAM", String.valueOf(appointment.getId()),
                        EventType.LICH_KHAM_REMINDER.name());

                if (daCoThongBao) {
                    log.info("ThongBao reminder already exists for appointment {}, skip", appointment.getId());
                    continue;
                }

                String tenChuyenKhoa = getTenChuyenKhoa(appointment.getMaChuyenKhoa());
                String tenBacSi = getTenBacSi(appointment.getMaBacSi());

                String title = "Nhắc nhở lịch khám";
                String body = String.format(
                    "Bạn có lịch khám tại %s vào ngày mai (%s)%s. Vui lòng đến đúng giờ!",
                    tenChuyenKhoa,
                    tomorrow.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                    tenBacSi != null ? " - BS. " + tenBacSi : ""
                );

                ThongBao created = thongBaoService.createThongBao(
                    maTaiKhoanBn,
                    "BENH_NHAN",
                    title,
                    body,
                    "LICH_KHAM",
                    String.valueOf(appointment.getId()),
                    EventType.LICH_KHAM_REMINDER.name(),
                    false,
                    false
                );

                if (created == null) {

                    log.info("ThongBao reminder already existed (concurrent), skip queue for appointment {}",
                        appointment.getId());
                    continue;
                }

                NotificationQueue queue = new NotificationQueue();
                queue.setMaThongBao(created.getId());
                queue.setScheduledAt(java.time.LocalDateTime.of(LocalDate.now(), LocalTime.of(7, 0)));
                queue.setStatus(NotificationQueueStatus.PENDING);
                queue.setRetryCount(0);
                notificationQueueRepository.save(queue);

                log.info("Created reminder + queued for maTaiKhoanBn {} (appointment {}), scheduled_at = {}",
                    maTaiKhoanBn, appointment.getId(), queue.getScheduledAt());
            }
        } catch (Exception e) {
            log.error("Error sending appointment reminders: {}", e.getMessage());
        }
    }

    private String getTenChuyenKhoa(Integer maChuyenKhoa) {
        if (maChuyenKhoa == null) return "";
        try {
            Optional<ChuyenKhoa> ck = chuyenKhoaRepository.findById(maChuyenKhoa);
            return ck.map(ChuyenKhoa::getTenChuyenKhoa).orElse("");
        } catch (Exception e) {
            return "";
        }
    }

    private String getTenBacSi(Integer maBacSi) {
        if (maBacSi == null) return null;
        try {
            Optional<NhanVien> nv = nhanVienRepository.findById(maBacSi);
            return nv.map(NhanVien::getHoTen).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
