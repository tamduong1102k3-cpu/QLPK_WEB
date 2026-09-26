package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.entity.ChiTietHoaDon;
import com.qlpk.backend.entity.HoaDon;
import com.qlpk.backend.payment.entity.GiaoDichThanhToan;
import com.qlpk.backend.payment.repository.GiaoDichThanhToanRepository;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.ChiTietHoaDonRepository;
import com.qlpk.backend.service.ChiTietHoaDonService;
import com.qlpk.backend.service.HoaDonService;
import com.qlpk.backend.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.HashMap;

@RestController
@RequestMapping("/api/hoa-don")
public class HoaDonController {

    @Autowired
    private HoaDonService hoaDonService;

    @Autowired
    private ChiTietHoaDonService chiTietHoaDonService;

    @Autowired
    private ChiTietHoaDonRepository chiTietHoaDonRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private GiaoDichThanhToanRepository giaoDichRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping
    public List<HoaDon> getAll() {
        return hoaDonService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HoaDon> getById(@PathVariable Integer id) {
        HoaDon hoaDon = hoaDonService.getById(id);
        if (hoaDon != null) {
            return ResponseEntity.ok(hoaDon);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/chi-tiet")
    public List<ChiTietHoaDon> getChiTiet(@PathVariable Integer id) {
        return chiTietHoaDonService.findByMaHoaDon(id);
    }

    @GetMapping("/phieu-kham/{maPhieuKham}/billing-items")
    public ResponseEntity<?> getBillingItems(@PathVariable Integer maPhieuKham) {
        try {
            Map<String, Object> items = hoaDonService.getBillingItems(maPhieuKham);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/phieu-kham/{maPhieuKham}/create")
    public ResponseEntity<?> createInvoiceFromPhieuKham(@PathVariable Integer maPhieuKham, @RequestBody Map<String, Object> body) {
        try {
            Integer maNhanVien = body.get("maNhanVien") != null 
                ? Integer.parseInt(body.get("maNhanVien").toString()) 
                : null;
            HoaDon result = hoaDonService.taoHoaDonTuPhieuKham(maPhieuKham, maNhanVien);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/paid-invoices")
    public ResponseEntity<?> getPaidInvoices() {
        try {
            List<Map<String, Object>> invoices = hoaDonService.getPaidInvoicesDetailed();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/paid-invoices-with-thuoc")
    public ResponseEntity<?> getPaidInvoicesWithThuoc() {
        try {
            List<Map<String, Object>> invoices = hoaDonService.getPaidInvoicesWithThuoc();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/paid-invoices-with-thuoc-status")
    public ResponseEntity<?> getPaidInvoicesWithThuocAndStatus() {
        try {
            List<Map<String, Object>> invoices = hoaDonService.getPaidInvoicesWithThuocAndStatus();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/paid-invoices-da-cap-thuoc")
    public ResponseEntity<?> getPaidInvoicesDaCapThuoc() {
        try {
            List<Map<String, Object>> invoices = hoaDonService.getPaidInvoicesDaCapThuoc();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/chi-tiet-thuoc")
    public ResponseEntity<?> getChiTietThuoc(@PathVariable Integer id) {
        try {
            List<ChiTietHoaDon> thuocItems = chiTietHoaDonRepository.findThuocByMaHoaDon(id);
            return ResponseEntity.ok(thuocItems);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/thanh-toan")
    public ResponseEntity<?> thanhToan(@PathVariable Integer id, @RequestBody Map<String, Object> body,
                                       HttpServletRequest request) {
        try {

            Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : null;

            if (username == null || !permissionService.hasRole(username, "THU_NGAN", "QUAN_TRI_VIEN", "LE_TAN")) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Bạn không có quyền thực hiện thanh toán. Vai trò hiện tại trong hệ thống không cho phép."
                ));
            }

            Integer maTaiKhoanNhanVien = null;
            Object maTaiKhoanBody = body.get("maTaiKhoan");
            if (maTaiKhoanBody != null) {
                try {
                    maTaiKhoanNhanVien = Integer.parseInt(maTaiKhoanBody.toString());
                } catch (NumberFormatException ignored) {
                    maTaiKhoanNhanVien = null;
                }
            }
            if (maTaiKhoanNhanVien == null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    maTaiKhoanNhanVien = jwtUtils.getMaTaiKhoanFromToken(token);
                }
            }

            Integer maNhanVien = body.get("maNhanVien") != null 
                ? Integer.parseInt(body.get("maNhanVien").toString()) 
                : null;
            String phuongThuc = (String) body.getOrDefault("phuongThuc", "tien_mat");
            BigDecimal soTienNhan = body.get("soTienNhan") != null 
                ? new BigDecimal(body.get("soTienNhan").toString()) 
                : null;
            String maGiaoDich = (String) body.get("maGiaoDich");

            HoaDon result = hoaDonService.thanhToan(id, maNhanVien, maTaiKhoanNhanVien, phuongThuc, soTienNhan, maGiaoDich);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/tao-thong-bao")
    public ResponseEntity<?> taoThongBaoThanhToan(@PathVariable Integer id) {
        try {
            hoaDonService.taoThongBaoThanhToan(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tạo thông báo thanh toán cho bệnh nhân thành công"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/vnpay-status")
    public ResponseEntity<?> checkVnpayStatus(@PathVariable Integer id) {
        try {
            HoaDon hoaDon = hoaDonService.getById(id);
            if (hoaDon == null) {
                return ResponseEntity.ok(Map.of(
                    "status", "not_found",
                    "message", "Không tìm thấy hóa đơn"
                ));
            }

            if ("da thanh toan".equalsIgnoreCase(hoaDon.getTrangThai())) {
                return ResponseEntity.ok(Map.of(
                    "status", "paid",
                    "trangThai", hoaDon.getTrangThai(),
                    "phuongThucThanhToan", hoaDon.getPhuongThucThanhToan(),
                    "maGiaoDich", hoaDon.getMaGiaoDich(),
                    "message", "VNPay đã xác nhận thanh toán thành công"
                ));
            }

            if ("dang_cho_thanh_toan".equalsIgnoreCase(hoaDon.getTrangThai())) {
                return ResponseEntity.ok(Map.of(
                    "status", "pending",
                    "trangThai", hoaDon.getTrangThai(),
                    "message", "VNPay chưa xác nhận thanh toán. Vui lòng đợi hoặc bấm reset."
                ));
            }

            return ResponseEntity.ok(Map.of(
                "status", "unknown",
                "trangThai", hoaDon.getTrangThai(),
                "message", "Trạng thái hóa đơn: " + hoaDon.getTrangThai()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/reset-vnpay-pending")
    public ResponseEntity<?> resetVnpayPending(@PathVariable Integer id) {
        try {
            HoaDon hoaDon = hoaDonService.getById(id);
            if (hoaDon == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy hóa đơn"
                ));
            }

            if (!"dang_cho_thanh_toan".equalsIgnoreCase(hoaDon.getTrangThai())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Hóa đơn không ở trạng thái chờ thanh toán VNPay. Trạng thái hiện tại: " + hoaDon.getTrangThai()
                ));
            }

            hoaDon.setTrangThai("chua thanh toan");
            hoaDonService.update(id, hoaDon);

            if (webSocketPublisher != null) {
                webSocketPublisher.publishHoaDonChange("RESET", id);
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã reset hóa đơn về trạng thái chưa thanh toán"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
