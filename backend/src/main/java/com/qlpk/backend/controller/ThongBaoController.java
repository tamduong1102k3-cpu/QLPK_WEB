package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.ThongBao;
import com.qlpk.backend.repository.ThongBaoRepository;
import com.qlpk.backend.service.ThongBaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/thong-bao")
public class ThongBaoController {

    @Autowired
    private ThongBaoService thongBaoService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ThongBaoRepository thongBaoRepository;

    @GetMapping("/reference-type/{referenceType}")
    public ResponseEntity<?> getThongBaoByReferenceType(
            @PathVariable String referenceType,
            @RequestParam(required = false) String loaiNguoiNhan,
            @RequestParam(required = false) Integer maTaiKhoan) {
        try {
            List<ThongBao> list;
            if (loaiNguoiNhan != null && !loaiNguoiNhan.isBlank()) {
                list = thongBaoService.getThongBaoByReferenceTypeAndLoaiNguoiNhan(referenceType, loaiNguoiNhan);
            } else {
                list = thongBaoService.getThongBaoByReferenceType(referenceType);
            }

            if (maTaiKhoan != null) {
                list = list.stream()
                    .filter(tb -> tb.getMaTaiKhoan() != null && tb.getMaTaiKhoan().equals(maTaiKhoan))
                    .collect(Collectors.toList());
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/benh-nhan")
    public ResponseEntity<?> getThongBaoForBenhNhan(
            @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Thiếu token xác thực"
                ));
            }
            String token = authHeader.substring(7);

            Integer maTaiKhoanBn = jwtUtils.getMaTaiKhoanBnFromToken(token);
            if (maTaiKhoanBn == null || maTaiKhoanBn == 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy mã tài khoản trong token"
                ));
            }

            List<ThongBao> list = thongBaoService.getThongBaoByUser(maTaiKhoanBn, "BENH_NHAN", null);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @PostMapping
    public ResponseEntity<?> createThongBao(@RequestBody ThongBao thongBao) {
        try {

            String eventType = thongBao.getEventType() != null
                ? thongBao.getEventType()
                : EventType.SYSTEM_NOTIFICATION.name();

            if (thongBao.getReferenceType() != null && thongBao.getReferenceId() != null) {
                boolean daTonTai = thongBaoRepository
                    .existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventType(
                        thongBao.getMaTaiKhoan(),
                        thongBao.getLoaiNguoiNhan(),
                        thongBao.getReferenceType(),
                        thongBao.getReferenceId(),
                        eventType
                    );
                if (daTonTai) {
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Thông báo đã tồn tại, bỏ qua",
                        "data", (Object) null
                    ));
                }
            }

            ThongBao saved = thongBaoService.createThongBao(
                thongBao.getMaTaiKhoan(),
                thongBao.getLoaiNguoiNhan(),
                thongBao.getTieuDe(),
                thongBao.getNoiDung(),
                thongBao.getReferenceType(),
                thongBao.getReferenceId(),
                eventType,
                thongBao.getDaDoc(),
                true
            );
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tạo thông báo thành công",
                "data", saved
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{maTaiKhoan}/{loaiNguoiNhan}")
    public ResponseEntity<?> getThongBao(
            @PathVariable Integer maTaiKhoan,
            @PathVariable String loaiNguoiNhan,
            @RequestParam(required = false) Boolean chiChuaDoc) {
        try {
            List<ThongBao> list = thongBaoService.getThongBaoByUser(maTaiKhoan, loaiNguoiNhan, chiChuaDoc);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{maTaiKhoan}/{loaiNguoiNhan}/unread-count")
    public ResponseEntity<?> countUnread(
            @PathVariable Integer maTaiKhoan,
            @PathVariable String loaiNguoiNhan) {
        try {
            long count = thongBaoService.countUnread(maTaiKhoan, loaiNguoiNhan);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "unreadCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}/mark-read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            ThongBao tb = thongBaoService.markAsRead(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã đánh dấu đã đọc",
                "data", tb
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{maTaiKhoan}/{loaiNguoiNhan}/mark-all-read")
    public ResponseEntity<?> markAllAsRead(
            @PathVariable Integer maTaiKhoan,
            @PathVariable String loaiNguoiNhan) {
        try {
            thongBaoService.markAllAsRead(maTaiKhoan, loaiNguoiNhan);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã đánh dấu tất cả là đã đọc"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteThongBao(@PathVariable Long id) {
        try {
            thongBaoService.deleteThongBao(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xóa thông báo"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{maTaiKhoan}/{loaiNguoiNhan}/all")
    public ResponseEntity<?> deleteAllThongBao(
            @PathVariable Integer maTaiKhoan,
            @PathVariable String loaiNguoiNhan) {
        try {
            thongBaoService.deleteAllThongBao(maTaiKhoan, loaiNguoiNhan);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xóa tất cả thông báo"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }
}
