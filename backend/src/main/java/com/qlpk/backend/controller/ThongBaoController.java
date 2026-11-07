package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.ThongBao;
import com.qlpk.backend.repository.ThongBaoRepository;
import com.qlpk.backend.service.ThongBaoService;
import com.qlpk.backend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private com.qlpk.backend.scheduler.ThuocCanhBaoScheduler thuocCanhBaoScheduler;

    /**
     * Trigger thủ công scheduler cảnh báo thuốc (chỉ dùng cho test/dev).
     * Yêu cầu role QUAN_TRI_VIEN (check qua SecurityConfig /api/admin/**).
     */
    @PostMapping("/admin/trigger-canh-bao-thuoc")
    public ResponseEntity<?> triggerCanhBaoThuoc() {
        try {
            thuocCanhBaoScheduler.canhBaoThuoc();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã trigger scheduler cảnh báo thuốc"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Lấy userId từ JWT. Ném 401 nếu token thiếu/không hợp lệ.
     * loaiNguoiNhan = "BENH_NHAN" → maTaiKhoanBn
     *                = "NHAN_VIEN"  → maTaiKhoan
     *                = null         → thử cả 2
     */
    private Integer extractUserIdFromJwt(String authHeader, String loaiNguoiNhan) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu token");
        }
        String token = authHeader.substring(7);
        Integer userId = null;
        if ("BENH_NHAN".equals(loaiNguoiNhan)) {
            userId = jwtUtils.getMaTaiKhoanBnFromToken(token);
        } else if ("NHAN_VIEN".equals(loaiNguoiNhan) || "QUAN_TRI_VIEN".equals(loaiNguoiNhan)) {
            userId = jwtUtils.getMaTaiKhoanFromToken(token);
        } else {
            userId = jwtUtils.getMaTaiKhoanBnFromToken(token);
            if (userId == null) userId = jwtUtils.getMaTaiKhoanFromToken(token);
        }
        if (userId == null || userId == 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ");
        }
        return userId;
    }

    // loaiNguoiNhan: ko truyền = lấy hết, có = lọc theo loại người nhận
    // thêm maTaiKhoan: lọc đúng tài khoản đang đăng nhập
    // thêm maNhanVien: lọc theo nhân viên (map ma_nhan_vien -> ma_tai_khoan qua tai_khoan),
    // dùng cho bell NV (VD: BS xem TB đặt lịch dù maTaiKhoan map lệch)
    @GetMapping("/reference-type/{referenceType}")
    public ResponseEntity<?> getThongBaoByReferenceType(
            @PathVariable String referenceType,
            @RequestParam(required = false) String loaiNguoiNhan,
            @RequestParam(required = false) Integer maTaiKhoan,
            @RequestParam(required = false) Integer maNhanVien,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer jwtUserId = extractUserIdFromJwt(authHeader, loaiNguoiNhan);
            // Nếu client truyền maTaiKhoan → phải khớp JWT
            if (maTaiKhoan != null && !maTaiKhoan.equals(jwtUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
            }
            // maNhanVien → map sang maTaiKhoan NV; nếu map ra khác JWT thì vẫn cho phép
            // khi JWT là NV (cùng hệ nhân viên), để BS không mất TB vì lệch map
            Integer maNvMapped = null;
            if (maNhanVien != null) {
                try {
                    com.qlpk.backend.entity.TaiKhoan tk =
                            taiKhoanRepository.findByMaNhanVien(maNhanVien);
                    if (tk != null) maNvMapped = tk.getMaTaiKhoan();
                } catch (Exception ignored) {}
            }
            // Nếu không truyền → ép lọc theo JWT
            Integer effectiveUserId = (maTaiKhoan != null) ? maTaiKhoan
                    : (maNvMapped != null ? maNvMapped : jwtUserId);
            List<ThongBao> list;
            if (loaiNguoiNhan != null && !loaiNguoiNhan.isBlank()) {
                list = thongBaoService.getThongBaoByReferenceTypeAndLoaiNguoiNhan(referenceType, loaiNguoiNhan);
            } else {
                list = thongBaoService.getThongBaoByReferenceType(referenceType);
            }

            final Integer filterUserId = effectiveUserId;
            list = list.stream()
                    .filter(tb -> tb.getMaTaiKhoan() != null && tb.getMaTaiKhoan().equals(filterUserId))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
                ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    // thông báo của bệnh nhân lấy từ JWT (cả đã đọc + chưa đọc)
    // Flutter tự lọc da_doc=false để hiện badge
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
            // bảng thong_bao lưu theo ma_tai_khoan, ko phải ma_benh_nhan
            Integer maTaiKhoanBn = jwtUtils.getMaTaiKhoanBnFromToken(token);
            if (maTaiKhoanBn == null || maTaiKhoanBn == 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy mã tài khoản trong token"
                ));
            }

            // null = lấy hết (cả đã đọc + chưa đọc), Flutter tự lọc
            List<ThongBao> list = thongBaoService.getThongBaoByUser(maTaiKhoanBn, "BENH_NHAN", null);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
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

            // dedup: đã có thông báo cùng reference + eventType thì bỏ qua
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
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
                ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    // chiChuaDoc=true: chỉ trả chưa đọc, mặc định trả tất cả
    @GetMapping("/{maTaiKhoan}/{loaiNguoiNhan}")
    public ResponseEntity<?> getThongBao(
            @PathVariable Integer maTaiKhoan,
            @PathVariable String loaiNguoiNhan,
            @RequestParam(required = false) Boolean chiChuaDoc,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer jwtUserId = extractUserIdFromJwt(authHeader, loaiNguoiNhan);
            if (!maTaiKhoan.equals(jwtUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
            }
            List<ThongBao> list = thongBaoService.getThongBaoByUser(maTaiKhoan, loaiNguoiNhan, chiChuaDoc);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", list,
                "total", list.size()
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
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
            @PathVariable String loaiNguoiNhan,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer jwtUserId = extractUserIdFromJwt(authHeader, loaiNguoiNhan);
            if (!maTaiKhoan.equals(jwtUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
            }
            long count = thongBaoService.countUnread(maTaiKhoan, loaiNguoiNhan);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "unreadCount", count
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
                ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}/mark-read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer jwtUserId = extractUserIdFromJwt(authHeader, null);
            ThongBao tb = thongBaoService.markAsRead(id, jwtUserId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã đánh dấu đã đọc",
                "data", tb
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
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
            @PathVariable String loaiNguoiNhan,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer jwtUserId = extractUserIdFromJwt(authHeader, loaiNguoiNhan);
            if (!maTaiKhoan.equals(jwtUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
            }
            thongBaoService.markAllAsRead(maTaiKhoan, loaiNguoiNhan);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã đánh dấu tất cả là đã đọc"
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
                ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteThongBao(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer jwtUserId = extractUserIdFromJwt(authHeader, null);
            thongBaoService.deleteThongBao(id, jwtUserId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xóa thông báo"
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
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
            @PathVariable String loaiNguoiNhan,
            @RequestHeader("Authorization") String authHeader) {
        try {
            Integer jwtUserId = extractUserIdFromJwt(authHeader, loaiNguoiNhan);
            if (!maTaiKhoan.equals(jwtUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
            }
            thongBaoService.deleteAllThongBao(maTaiKhoan, loaiNguoiNhan);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xóa tất cả thông báo"
            ));
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode())
                .body(Map.of(
                    "message", rse.getReason() != null ? rse.getReason() : "Lỗi",
                    "success", false
                ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }
}