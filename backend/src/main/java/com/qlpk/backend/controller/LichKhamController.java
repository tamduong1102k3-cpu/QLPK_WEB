package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.dto.ErrorResponse;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.NotificationQueue;
import com.qlpk.backend.entity.NotificationQueueStatus;
import com.qlpk.backend.entity.ThongBao;
import com.qlpk.backend.repository.NotificationQueueRepository;
import com.qlpk.backend.service.LichKhamService;
import com.qlpk.backend.service.ThongBaoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lich-kham")
public class LichKhamController {

    @Autowired
    private LichKhamService service;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ThongBaoService thongBaoService;

    @Autowired
    private NotificationQueueRepository notificationQueueRepository;

    private Integer getMaBenhNhanFromToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            return jwtUtils.getMaBenhNhanFromToken(token);
        }
        return null;
    }

    private Integer getMaTaiKhoanBnFromToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            return jwtUtils.getMaTaiKhoanBnFromToken(token);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<LichKham>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LichKham> getById(@PathVariable Integer id) {
        LichKham entity = service.getById(id);
        if (entity != null) {
            return ResponseEntity.ok(entity);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LichKham entity, HttpServletRequest request) {
        Integer maBenhNhan = getMaBenhNhanFromToken(request);
        if (maBenhNhan == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không thể xác thực bệnh nhân. Vui lòng đăng nhập lại."
            ));
        }
        entity.setMaBenhNhan(maBenhNhan);
        try {

            LichKham created = service.create(entity, null);

                try {

                    Integer maTaiKhoanBnFromToken = getMaTaiKhoanBnFromToken(request);
                    if (maTaiKhoanBnFromToken != null) {
                        String title = "Đặt lịch khám thành công";
                        String body = String.format(
                            "Lịch khám ngày %s đã được đặt thành công. Mã lịch: %d",
                            created.getNgayKham().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                            created.getId()
                        );

                        ThongBao savedThongBao = thongBaoService.createThongBao(
                            maTaiKhoanBnFromToken,
                            "BENH_NHAN",
                            title,
                            body,
                            "LICH_KHAM",
                            String.valueOf(created.getId()),
                            EventType.LICH_KHAM_CREATED.name(),
                            true,
                            true
                        );

                        if (savedThongBao != null && created.getNgayKham() != null) {
                            NotificationQueue queue = new NotificationQueue();
                            queue.setMaThongBao(savedThongBao.getId());
                            queue.setScheduledAt(
                                LocalDateTime.of(created.getNgayKham().minusDays(1), LocalTime.of(7, 0))
                            );
                            queue.setStatus(NotificationQueueStatus.PENDING);
                            queue.setRetryCount(0);
                            notificationQueueRepository.save(queue);
                        }
                    }
                } catch (Exception notiErr) {

                    System.err.println("Failed to send notification: " + notiErr.getMessage());
                }

            return ResponseEntity.ok(Map.of("success", true, "data", created));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody LichKham entity, HttpServletRequest request) {
        Integer maBenhNhan = getMaBenhNhanFromToken(request);
        if (maBenhNhan == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không thể xác thực bệnh nhân. Vui lòng đăng nhập lại."
            ));
        }

        LichKham existing = service.getById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existing.getMaBenhNhan().equals(maBenhNhan)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Bạn chỉ có thể sửa lịch khám của chính mình"
            ));
        }

        entity.setId(id);
        entity.setMaBenhNhan(maBenhNhan);

        LichKham updated = service.update(id, entity, null);

        try {
            Integer maTaiKhoanBnFromToken = getMaTaiKhoanBnFromToken(request);
            if (maTaiKhoanBnFromToken != null && updated != null && updated.getNgayKham() != null) {
                String title = "Lịch khám đã được cập nhật";
                String body = String.format(
                    "Lịch khám #%d của bạn đã được cập nhật. Ngày khám mới: %s",
                    updated.getId(),
                    updated.getNgayKham().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                );
                thongBaoService.createThongBao(
                    maTaiKhoanBnFromToken,
                    "BENH_NHAN",
                    title,
                    body,
                    "LICH_KHAM",
                    String.valueOf(updated.getId()),
                    EventType.LICH_KHAM_UPDATED.name(),
                    false,
                    true
                );
            }
        } catch (Exception notiErr) {
            System.err.println("Failed to send update notification: " + notiErr.getMessage());
        }

        return ResponseEntity.ok(Map.of("success", true, "data", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/benh-nhan/{maBenhNhan}")
    public ResponseEntity<List<LichKham>> getByBenhNhan(@PathVariable Integer maBenhNhan) {
        return ResponseEntity.ok(service.getByBenhNhan(maBenhNhan));
    }

    @GetMapping("/bac-si/{maBacSi}")
    public ResponseEntity<List<LichKham>> getByBacSi(@PathVariable Integer maBacSi) {
        return ResponseEntity.ok(service.getByBacSi(maBacSi));
    }

    @GetMapping("/ngay")
    public ResponseEntity<List<LichKham>> getByNgayKham(@RequestParam("ngayKham") String ngayKhamStr) {
        LocalDate ngayKham = LocalDate.parse(ngayKhamStr);
        return ResponseEntity.ok(service.getByNgayKham(ngayKham));
    }

    @GetMapping("/chuyen-khoa/{maChuyenKhoa}")
    public ResponseEntity<List<LichKham>> getByChuyenKhoa(@PathVariable Integer maChuyenKhoa) {
        return ResponseEntity.ok(service.getByChuyenKhoa(maChuyenKhoa));
    }

    @GetMapping("/trang-thai/{trangThai}")
    public ResponseEntity<List<LichKham>> getByTrangThai(@PathVariable String trangThai) {
        return ResponseEntity.ok(service.getByTrangThai(trangThai));
    }

    @GetMapping("/today")
    public ResponseEntity<List<LichKham>> getAppointmentsByDate(@RequestParam("ngayKham") String ngayKhamStr) {
        LocalDate ngayKham = LocalDate.parse(ngayKhamStr);
        return ResponseEntity.ok(service.getAppointmentsByDate(ngayKham));
    }

    @GetMapping("/bac-si/{maBacSi}/ngay")
    public ResponseEntity<List<LichKham>> getAppointmentsByDoctorAndDate(
            @PathVariable Integer maBacSi,
            @RequestParam("ngayKham") String ngayKhamStr) {
        LocalDate ngayKham = LocalDate.parse(ngayKhamStr);
        return ResponseEntity.ok(service.getAppointmentsByDoctorAndDate(maBacSi, ngayKham));
    }

    @GetMapping("/khoang-thoi-gian")
    public ResponseEntity<List<LichKham>> getAppointmentsBetweenDates(
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr) {
        LocalDate startDate = LocalDate.parse(startDateStr);
        LocalDate endDate = LocalDate.parse(endDateStr);
        return ResponseEntity.ok(service.getAppointmentsBetweenDates(startDate, endDate));
    }

    @PutMapping("/{id}/trang-thai")
    public ResponseEntity<?> updateTrangThai(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        String trangThai = payload.get("trangThai");
        if (trangThai == null || trangThai.isEmpty()) {
            return ResponseEntity.badRequest().body("Thiếu thông tin trangThai");
        }

        List<String> validStatuses = List.of("CHUA_DEN", "DA_CHECK_IN", "HOAN_THANH");
        if (!validStatuses.contains(trangThai)) {
            return ResponseEntity.badRequest().body("Trạng thái không hợp lệ: " + trangThai);
        }

        LichKham updated = service.updateTrangThai(id, trangThai);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/cancellation-count")
    public ResponseEntity<Map<String, Object>> getCancellationCount(HttpServletRequest request) {
        Integer maBenhNhan = getMaBenhNhanFromToken(request);
        if (maBenhNhan == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không thể xác thực bệnh nhân"
            ));
        }
        int count = service.countCancellationsLast30Days(maBenhNhan);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "count", count,
            "maxAllowed", 3,
            "canBook", count < 3
        ));
    }

    @GetMapping("/can-book")
    public ResponseEntity<Map<String, Object>> canBook(HttpServletRequest request) {
        Integer maBenhNhan = getMaBenhNhanFromToken(request);
        if (maBenhNhan == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không thể xác thực bệnh nhân"
            ));
        }
        boolean canBook = service.canBookAppointment(maBenhNhan);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "canBook", canBook
        ));
    }

    @GetMapping("/has-active")
    public ResponseEntity<Map<String, Object>> hasActiveAppointment(HttpServletRequest request) {
        Integer maBenhNhan = getMaBenhNhanFromToken(request);
        if (maBenhNhan == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không thể xác thực bệnh nhân"
            ));
        }
        boolean hasActive = service.hasActiveAppointment(maBenhNhan);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "hasActive", hasActive
        ));
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<Map<String, Object>> checkDuplicate(
            @RequestParam("ngayKham") String ngayKhamStr,
            @RequestParam(value = "maCa", required = false) Integer maCa,
            HttpServletRequest request) {
        Integer maBenhNhan = getMaBenhNhanFromToken(request);
        if (maBenhNhan == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không thể xác thực bệnh nhân"
            ));
        }
        try {
            LocalDate ngayKham = LocalDate.parse(ngayKhamStr);

            if (maCa == null) {
                return ResponseEntity.ok(Map.of("success", true, "isDuplicate", false));
            }
            boolean isDuplicate = service.isDuplicateDateTime(maBenhNhan, ngayKham, maCa);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "isDuplicate", isDuplicate
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Định dạng ngày không hợp lệ"
            ));
        }
    }

    @PutMapping("/{id}/xac-nhan")
    public ResponseEntity<?> xacNhan(@PathVariable Integer id) {

        return ResponseEntity.status(HttpStatus.GONE)
            .body(new ErrorResponse("FEATURE_REMOVED",
                "Chức năng xác nhận lịch hẹn không còn được hỗ trợ. Lịch hẹn được giữ chỗ ngay khi tạo."));
    }

}
