package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.dto.AppointmentRequest;
import com.qlpk.backend.dto.AppointmentResponse;
import com.qlpk.backend.dto.ErrorResponse;
import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.NguonTao;
import com.qlpk.backend.entity.NotificationQueue;
import com.qlpk.backend.entity.NotificationQueueStatus;
import com.qlpk.backend.entity.ThongBao;
import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.ChuyenKhoaRepository;
import com.qlpk.backend.repository.DichVuRepository;
import com.qlpk.backend.repository.LichKhamRepository;
import com.qlpk.backend.repository.NhanVienRepository;
import com.qlpk.backend.repository.NotificationQueueRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import com.qlpk.backend.repository.PhongChucNangRepository;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private LichKhamService lichKhamService;

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private ThongBaoService thongBaoService;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private ChuyenKhoaRepository chuyenKhoaRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Autowired
    private PhieuKhamRepository phieuKhamRepository;

    @Autowired
    private PhongChucNangRepository phongChucNangRepository;

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private NotificationQueueRepository notificationQueueRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping
    public List<AppointmentResponse> getAll() {
        List<LichKham> list = lichKhamService.getByNguonTao(NguonTao.TAI_KHAM);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/doctor")
    public List<AppointmentResponse> getByDoctorChuyenKhoa(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return List.of();
        }
        String token = header.substring(7);
        Integer maChuyenKhoa = jwtUtils.getMaChuyenKhoaFromToken(token);
        if (maChuyenKhoa == null || maChuyenKhoa <= 0) {
            return List.of(); 
        }
        List<LichKham> list = lichKhamService.getByChuyenKhoa(maChuyenKhoa);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AppointmentRequest request, HttpServletRequest httpRequest) {

        Integer maNhanVienThucHien = getMaNhanVienFromRequest(httpRequest);

        LichKham entity = new LichKham();

        entity.setMaBenhNhan(request.getMaBenhNhan());
        entity.setMaChuyenKhoa(request.getMaChuyenKhoa());

        if (request.getMaBacSi() != null) {
            entity.setMaBacSi(request.getMaBacSi());
        } else if (request.getMaNhanVien() != null) {
            entity.setMaBacSi(request.getMaNhanVien());
        }

        if (request.getMaDichVu() != null) {
            entity.setMaDichVu(request.getMaDichVu());
        } else if (request.getMaPhieuKham() != null) {
            phieuKhamRepository.findById(request.getMaPhieuKham()).ifPresent(pk -> {
                if (pk.getMaDichVu() != null) entity.setMaDichVu(pk.getMaDichVu());
                if (entity.getMaChuyenKhoa() == null && pk.getMaChuyenKhoa() != null) {
                    entity.setMaChuyenKhoa(pk.getMaChuyenKhoa());
                }
            });
        }
        entity.setMaDangKyKhamBenh(request.getMaDangKyKhamBenh());
        entity.setMaPhong(request.getMaPhong());
        entity.setMaCa(request.getMaCa());

        if (request.getNguonTao() != null) {
            entity.setNguonTao(NguonTao.valueOf(request.getNguonTao()));
        }

        if (request.getNgayKham() != null) {
            entity.setNgayKham(LocalDate.parse(request.getNgayKham()));
        } else if (request.getNgayTaiKham() != null) {
            entity.setNgayKham(LocalDate.parse(request.getNgayTaiKham()));
        }

        entity.setTrangThai(request.getTrangThai());
        entity.setGhiChu(request.getGhiChu());

        if (entity.getMaBenhNhan() != null && entity.getNgayKham() != null) {
            boolean trungLich = lichKhamService.isDuplicateDateTime(
                entity.getMaBenhNhan(), entity.getNgayKham(), entity.getMaCa());
            if (trungLich) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Bệnh nhân này đã có lịch hẹn vào ca này trong ngày đã chọn. Vui lòng chọn ca khác."
                ));
            }
        }

        LichKham saved;
        try {
            saved = lichKhamService.create(entity, maNhanVienThucHien);
        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }

        if (saved != null && saved.getMaBenhNhan() != null && saved.getNgayKham() != null) {
            String tenChuyenKhoa = "";
            if (saved.getMaChuyenKhoa() != null) {
                tenChuyenKhoa = chuyenKhoaRepository.findById(saved.getMaChuyenKhoa())
                        .map(ck -> ck.getTenChuyenKhoa())
                        .orElse("");
            }
            String tenBacSi = "";
            if (saved.getMaBacSi() != null) {
                tenBacSi = nhanVienRepository.findById(saved.getMaBacSi())
                        .map(nv -> nv.getHoTen())
                        .orElse("");
            }
            String ngayKhamStr = saved.getNgayKham().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

            String noiDung = String.format(
                "Bạn có lịch khám tại %s vào ngày %s - BS. %s. Vui lòng đến đúng giờ!",
                tenChuyenKhoa, ngayKhamStr, tenBacSi
            );

            Integer maTaiKhoanBn = null;
            if (saved.getMaBenhNhan() != null) {
                maTaiKhoanBn = taiKhoanBenhNhanRepository
                    .findByMaBenhNhan(saved.getMaBenhNhan())
                    .map(acc -> acc.getMaTaiKhoanBn())
                    .orElse(null);
            }
            if (maTaiKhoanBn != null) {
                ThongBao savedThongBao = thongBaoService.createThongBao(
                    maTaiKhoanBn,
                    "BENH_NHAN",
                    "Nhắc nhở lịch tái khám",
                    noiDung,
                    "LICH_KHAM",
                    saved.getId().toString(),
                    EventType.LICH_TAI_KHAM_CREATED.name(),
                    false,
                    true
                );

                if (savedThongBao != null && saved.getNgayKham() != null) {
                    NotificationQueue queue = new NotificationQueue();
                    queue.setMaThongBao(savedThongBao.getId());
                    queue.setScheduledAt(
                        LocalDateTime.of(saved.getNgayKham().minusDays(1), LocalTime.of(7, 0))
                    );
                    queue.setStatus(NotificationQueueStatus.PENDING);
                    queue.setRetryCount(0);
                    notificationQueueRepository.save(queue);
                }
            }
        }

        if (saved != null && request.getMaPhieuKham() != null) {
            phieuKhamRepository.findById(request.getMaPhieuKham()).ifPresent(pk -> {
                pk.setMaLichKham(saved.getId());
                phieuKhamRepository.save(pk);
            });
        }

        return ResponseEntity.ok(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody AppointmentRequest request, HttpServletRequest httpRequest) {

        Integer maNhanVienThucHien = getMaNhanVienFromRequest(httpRequest);

        if ("HUY".equals(request.getTrangThai())) {
            try {
                LichKham result = lichKhamService.huyLich(id, maNhanVienThucHien);
                sendCancelNotification(result);
                return ResponseEntity.ok(toResponse(result));
            } catch (RuntimeException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("APPOINTMENT_ALREADY_PROCESSED", ex.getMessage()));
            }
        }

        if ("HOAN".equals(request.getTrangThai())) {
            try {

                String ngayMoiStr = request.getNgayTaiKham() != null
                        ? request.getNgayTaiKham()
                        : request.getNgayKham();
                if (ngayMoiStr == null || ngayMoiStr.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Thiếu thông tin ngày khám mới khi hoãn lịch"
                    ));
                }
                LocalDate ngayMoi;
                try {
                    ngayMoi = LocalDate.parse(ngayMoiStr);
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Định dạng ngày không hợp lệ"
                    ));
                }

                LocalDate homNay = LocalDate.now();
                if (ngayMoi.isBefore(homNay)) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Không thể hoãn sang ngày trong quá khứ"
                    ));
                }
                if (ngayMoi.equals(homNay)) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Không thể hoãn sang ngày hôm nay. Vui lòng chọn từ ngày mai trở đi."
                    ));
                }

                String lyDoHoan = request.getLyDoHoan();
                if (lyDoHoan == null || lyDoHoan.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Vui lòng nhập lý do hoãn lịch"
                    ));
                }

                LichKham lichTruoc = lichKhamService.getById(id);
                if (lichTruoc == null) {
                    return ResponseEntity.notFound().build();
                }
                LocalDate ngayCu = lichTruoc.getNgayKham();

                LichKham lichMoi = new LichKham();
                lichMoi.setNgayKham(ngayMoi);
                lichMoi.setMaCa(request.getMaCa());
                if (request.getMaBacSi() != null) lichMoi.setMaBacSi(request.getMaBacSi());
                if (request.getMaPhong() != null) lichMoi.setMaPhong(request.getMaPhong());
                if (request.getMaDichVu() != null) lichMoi.setMaDichVu(request.getMaDichVu());
                if (request.getMaChuyenKhoa() != null) lichMoi.setMaChuyenKhoa(request.getMaChuyenKhoa());

                LichKham result = lichKhamService.hoanLich(id, lichMoi, lyDoHoan, maNhanVienThucHien);

                try {
                    sendRescheduleNotification(result, ngayCu, lyDoHoan);
                } catch (Exception notiErr) {
                    System.err.println("Failed to send reschedule notification for lich id=" + id + ": " + notiErr.getMessage());
                }

                return ResponseEntity.ok(toResponse(result));
            } catch (RuntimeException ex) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
                ));
            }
        }

        LichKham existing = lichKhamService.getById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        LichKham oldValues = new LichKham();
        oldValues.setMaBacSi(existing.getMaBacSi());
        oldValues.setMaDichVu(existing.getMaDichVu());
        oldValues.setMaPhong(existing.getMaPhong());
        oldValues.setMaChuyenKhoa(existing.getMaChuyenKhoa());
        oldValues.setNgayKham(existing.getNgayKham());
        oldValues.setMaCa(existing.getMaCa());

        if (request.getMaBenhNhan() != null) existing.setMaBenhNhan(request.getMaBenhNhan());
        if (request.getMaChuyenKhoa() != null) existing.setMaChuyenKhoa(request.getMaChuyenKhoa());

        if (request.getMaBacSi() != null) {
            existing.setMaBacSi(request.getMaBacSi());
        } else if (request.getMaNhanVien() != null) {
            existing.setMaBacSi(request.getMaNhanVien());
        }

        if (request.getMaDichVu() != null) existing.setMaDichVu(request.getMaDichVu());
        if (request.getMaPhong() != null) existing.setMaPhong(request.getMaPhong());
        if (request.getMaDangKyKhamBenh() != null) existing.setMaDangKyKhamBenh(request.getMaDangKyKhamBenh());
        if (request.getMaCa() != null) existing.setMaCa(request.getMaCa());

        if (request.getNguonTao() != null) {
            existing.setNguonTao(NguonTao.valueOf(request.getNguonTao()));
        }

        if (request.getNgayKham() != null) {
            existing.setNgayKham(LocalDate.parse(request.getNgayKham()));
        } else if (request.getNgayTaiKham() != null) {
            existing.setNgayKham(LocalDate.parse(request.getNgayTaiKham()));
        }

        if (request.getTrangThai() != null) existing.setTrangThai(request.getTrangThai());
        if (request.getGhiChu() != null) existing.setGhiChu(request.getGhiChu());

        LichKham result = lichKhamService.update(id, existing, maNhanVienThucHien);

        if (result != null && "HUY".equals(result.getTrangThai())) {
            sendCancelNotification(result);
        } else if (result != null) {

            try {
                sendUpdateNotification(result, oldValues);
            } catch (Exception notiErr) {
                System.err.println("Failed to send update notification: " + notiErr.getMessage());
            }
        }

        if (result != null) {
            return ResponseEntity.ok(toResponse(result));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/hoan-lich")
        public ResponseEntity<?> hoanLich(@PathVariable Integer id,
            @RequestBody Map<String, Object> payload, HttpServletRequest httpRequest) {

        Integer maNhanVienThucHien = getMaNhanVienFromRequest(httpRequest);

        String ngayMoiStr = payload.get("ngayTaiKham") instanceof String value ? value : null;
        String lyDo = payload.get("lyDo") instanceof String value ? value : null;
        Object maCaValue = payload.get("maCa");
        if (ngayMoiStr == null || ngayMoiStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Thiếu thông tin ngày khám mới"
            ));
        }
        if (lyDo == null || lyDo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Vui lòng nhập lý do hoãn lịch"
            ));
        }
        LocalDate ngayMoi;
        try {
            ngayMoi = LocalDate.parse(ngayMoiStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Định dạng ngày không hợp lệ"
            ));
        }
        if (!(maCaValue instanceof Number)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Thiếu hoặc sai thông tin ca khám"
            ));
        }
        Integer maCa = ((Number) maCaValue).intValue();

        LichKham lichTruoc = lichKhamService.getById(id);
        if (lichTruoc == null) {
            return ResponseEntity.notFound().build();
        }
        LocalDate ngayCu = lichTruoc.getNgayKham();

        LichKham lichMoi = new LichKham();
        lichMoi.setNgayKham(ngayMoi);
        lichMoi.setMaCa(maCa);

        LichKham result;
        try {
            result = lichKhamService.hoanLich(id, lichMoi, lyDo, maNhanVienThucHien);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }

        try {
            sendRescheduleNotification(result, ngayCu, lyDo);
        } catch (Exception notiErr) {
            System.err.println("Failed to send reschedule notification for lich id=" + id + ": " + notiErr.getMessage());
        }

        return ResponseEntity.ok(toResponse(result));
    }

    private Integer getMaNhanVienFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        String token = header.substring(7);
        return jwtUtils.getMaNhanVienFromToken(token);
    }

    private void sendRescheduleNotification(LichKham result, LocalDate ngayCu, String lyDo) {
        try {
            Integer maTaiKhoanBn = result.getMaBenhNhan() != null
                ? taiKhoanBenhNhanRepository.findByMaBenhNhan(result.getMaBenhNhan())
                    .map(acc -> acc.getMaTaiKhoanBn()).orElse(null)
                : null;
            if (maTaiKhoanBn != null) {
                String ngayCuStr = ngayCu != null
                    ? ngayCu.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                String ngayMoiStr = result.getNgayKham() != null
                    ? result.getNgayKham().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                String lyDoText = (lyDo != null && !lyDo.isEmpty()) ? lyDo : "Bác sĩ bận";
                String noiDung = "Lịch khám ngày " + ngayCuStr
                    + " đã được hoãn sang ngày " + ngayMoiStr + ". Lý do: " + lyDoText;
                thongBaoService.createThongBaoNoDedup(
                    maTaiKhoanBn,
                    "BENH_NHAN",
                    "Lịch khám đã được hoãn",
                    noiDung,
                    "LICH_KHAM",
                    String.valueOf(result.getId()),
                    EventType.LICH_KHAM_UPDATED.name(),
                    false,
                    true
                );
            }
        } catch (Exception notiErr) {
            System.err.println("Failed to send reschedule notification: " + notiErr.getMessage());
        }
    }

    private void sendCancelNotification(LichKham result) {
        try {
            Integer maTaiKhoanBn = result.getMaBenhNhan() != null
                ? taiKhoanBenhNhanRepository.findByMaBenhNhan(result.getMaBenhNhan())
                    .map(acc -> acc.getMaTaiKhoanBn()).orElse(null)
                : null;
            if (maTaiKhoanBn != null) {
                String lyDo = result.getGhiChu() != null && !result.getGhiChu().isEmpty()
                    ? result.getGhiChu() : "Lịch bác sĩ bận, phòng khám xin hủy lịch hẹn của bạn.";
                String ngayStr = result.getNgayKham() != null
                    ? result.getNgayKham().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                thongBaoService.createThongBao(
                    maTaiKhoanBn,
                    "BENH_NHAN",
                    "Lịch khám đã bị hủy",
                    "Lịch khám ngày " + ngayStr + " đã bị hủy. Lý do: " + lyDo,
                    "LICH_KHAM",
                    String.valueOf(result.getId()),
                    EventType.LICH_KHAM_CANCELLED.name(),
                    false,
                    true
                );
            }
        } catch (Exception notiErr) {
            System.err.println("Failed to send cancellation notification: " + notiErr.getMessage());
        }
    }

    private void sendUpdateNotification(LichKham result, LichKham oldValues) {
        try {
            Integer maTaiKhoanBn = result.getMaBenhNhan() != null
                ? taiKhoanBenhNhanRepository.findByMaBenhNhan(result.getMaBenhNhan())
                    .map(acc -> acc.getMaTaiKhoanBn()).orElse(null)
                : null;
            if (maTaiKhoanBn != null) {

                java.util.function.Function<Integer, String> getTenPhong = (maPhong) -> {
                    if (maPhong == null) return "";
                    return phongChucNangRepository.findById(maPhong)
                            .map(p -> p.getTenPhong()).orElse("");
                };

                java.util.function.Function<Integer, String> getTenDichVu = (maDichVu) -> {
                    if (maDichVu == null) return "";
                    return dichVuRepository.findById(maDichVu)
                            .map(dv -> dv.getTenDichVu()).orElse("");
                };

                java.util.function.Function<Integer, String> getTenBacSi = (maBacSi) -> {
                    if (maBacSi == null) return "";
                    return nhanVienRepository.findById(maBacSi)
                            .map(nv -> nv.getHoTen()).orElse("");
                };

                String oldPhong = getTenPhong.apply(oldValues != null ? oldValues.getMaPhong() : null);
                String oldDichVu = getTenDichVu.apply(oldValues != null ? oldValues.getMaDichVu() : null);
                String oldBacSi = getTenBacSi.apply(oldValues != null ? oldValues.getMaBacSi() : null);

                String newPhong = getTenPhong.apply(result.getMaPhong());
                String newDichVu = getTenDichVu.apply(result.getMaDichVu());
                String newBacSi = getTenBacSi.apply(result.getMaBacSi());

                StringBuilder noiDung = new StringBuilder("Lịch khám của bạn đã được cập nhật:");
                if (!oldPhong.equals(newPhong)) {
                    noiDung.append(" Phòng: ").append(oldPhong.isEmpty() ? "—" : oldPhong)
                            .append(" → ").append(newPhong.isEmpty() ? "—" : newPhong).append(".");
                }
                if (!oldDichVu.equals(newDichVu)) {
                    noiDung.append(" Dịch vụ: ").append(oldDichVu.isEmpty() ? "—" : oldDichVu)
                            .append(" → ").append(newDichVu.isEmpty() ? "—" : newDichVu).append(".");
                }
                if (!oldBacSi.equals(newBacSi)) {
                    noiDung.append(" Bác sĩ: ").append(oldBacSi.isEmpty() ? "—" : oldBacSi)
                            .append(" → ").append(newBacSi.isEmpty() ? "—" : newBacSi).append(".");
                }
                if (noiDung.length() <= "Lịch khám của bạn đã được cập nhật:".length()) {
                    noiDung.append(" Thông tin lịch khám đã được đổi.");
                }

                thongBaoService.createThongBaoNoDedup(
                    maTaiKhoanBn,
                    "BENH_NHAN",
                    "Lịch khám đã được cập nhật",
                    noiDung.toString(),
                    "LICH_KHAM",
                    String.valueOf(result.getId()),
                    EventType.LICH_KHAM_UPDATED.name(),
                    false,
                    true
                );
            }
        } catch (Exception notiErr) {
            System.err.println("Failed to send update notification: " + notiErr.getMessage());
        }
    }

    @GetMapping("/search")
    public List<AppointmentResponse> search(
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String nguonTao,
            @RequestParam(required = false) String keyword) {

        NguonTao nguonEnum = null;
        if (nguonTao != null && !nguonTao.isEmpty() && !"ALL".equals(nguonTao)) {
            try { nguonEnum = NguonTao.valueOf(nguonTao); } catch (Exception ignored) {}
        }

        List<LichKham> list = lichKhamService.searchAppointmentsByKeyword(trangThai, nguonEnum, keyword);
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (lichKhamService.getById(id) != null) {
            lichKhamService.delete(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private AppointmentResponse toResponse(LichKham lk) {
        if (lk == null) return null;

        String tenBenhNhan = null;
        Boolean daXacMinhDanhTinh = null;
        if (lk.getMaBenhNhan() != null) {
            try {
                final Boolean[] xmFlag = { null };
                tenBenhNhan = benhNhanRepository.findById(lk.getMaBenhNhan())
                        .map(bn -> {
                            xmFlag[0] = Boolean.TRUE.equals(bn.getDaXacMinhDanhTinh());
                            return bn.getHoTen();
                        }).orElse(null);
                daXacMinhDanhTinh = xmFlag[0];
            } catch (Exception ignored) {}
        }

        String tenChuyenKhoa = null;
        if (lk.getMaChuyenKhoa() != null) {
            try {
                tenChuyenKhoa = chuyenKhoaRepository.findById(lk.getMaChuyenKhoa())
                        .map(ck -> ck.getTenChuyenKhoa()).orElse(null);
            } catch (Exception ignored) {}
        }

        String tenBacSi = null;
        if (lk.getMaBacSi() != null) {
            try {
                tenBacSi = nhanVienRepository.findById(lk.getMaBacSi())
                        .map(nv -> nv.getHoTen()).orElse(null);
            } catch (Exception ignored) {}
        }

        String tenDichVu = null;
        Integer maDichVu = lk.getMaDichVu();
        if (maDichVu != null && maDichVu > 0) {
            try {
                tenDichVu = dichVuRepository.findById(maDichVu)
                        .map(dv -> dv.getTenDichVu()).orElse(null);
            } catch (Exception ignored) {}
        }

        String tenPhong = null;
        if (lk.getMaPhong() != null) {
            try {
                tenPhong = phongChucNangRepository.findById(lk.getMaPhong())
                        .map(p -> p.getTenPhong()).orElse(null);
            } catch (Exception ignored) {}
        }

        String ngayKhamStr = lk.getNgayKham() != null ? lk.getNgayKham().toString() : null;

        Integer maLichKhamMoi = null;
        if ("HOAN".equals(lk.getTrangThai())) {
            try {
                List<LichKham> lichMoiList = lichKhamRepository.findByMaLichKhamGoc(lk.getId());
                if (!lichMoiList.isEmpty()) {
                    maLichKhamMoi = lichMoiList.get(0).getId();
                }
            } catch (Exception ignored) {}
        }

        return AppointmentResponse.builder()
                .id(lk.getId())
                .maLichKham(lk.getId())
                .maBenhNhan(lk.getMaBenhNhan())
                .tenBenhNhan(tenBenhNhan)
                .maChuyenKhoa(lk.getMaChuyenKhoa())
                .tenChuyenKhoa(tenChuyenKhoa)
                .maBacSi(lk.getMaBacSi())
                .tenBacSi(tenBacSi)
                .maNhanVien(lk.getMaBacSi())
                .tenNhanVien(tenBacSi)
                .maDichVu(maDichVu != null && maDichVu > 0 ? maDichVu : 1)
                .tenDichVu(tenDichVu)
                .maPhong(lk.getMaPhong())
                .tenPhong(tenPhong)
                .maDangKyKhamBenh(lk.getMaDangKyKhamBenh())
                .maLichKhamGoc(lk.getMaLichKhamGoc())
                .maLichKhamMoi(maLichKhamMoi)
                .maCa(lk.getMaCa())
                .tenCa(lk.getTenCa())
                .gioBatDau(lk.getGioBatDau() != null ? lk.getGioBatDau().toString() : null)
                .gioKetThuc(lk.getGioKetThuc() != null ? lk.getGioKetThuc().toString() : null)
                .daXacMinhDanhTinh(daXacMinhDanhTinh)
                .nguonTao(lk.getNguonTao())
                .ngayKham(ngayKhamStr)
                .ngayTaiKham(ngayKhamStr)
                .trangThai(lk.getTrangThai())
                .maNguoiCapNhat(lk.getMaNguoiCapNhat())
                .ghiChu(lk.getGhiChu())
                .lyDoHoan(lk.getLyDoHoan())
                .ngayTao(lk.getNgayTao())
                .build();
    }
}
