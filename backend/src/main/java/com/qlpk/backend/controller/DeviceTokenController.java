package com.qlpk.backend.controller;

import com.qlpk.backend.dto.RegisterDeviceRequest;
import com.qlpk.backend.entity.DeviceToken;
import com.qlpk.backend.service.DeviceTokenService;
import com.qlpk.backend.service.ThongBaoService;
import com.qlpk.backend.service.impl.DeviceTokenServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/device-tokens")
public class DeviceTokenController {

    private static final Logger log = LoggerFactory.getLogger(DeviceTokenController.class);

    @Autowired
    private DeviceTokenService deviceTokenService;

    @Autowired
    private ThongBaoService thongBaoService;

    @PostMapping("/register")
    public ResponseEntity<?> registerToken(@RequestBody Map<String, Object> request) {
        try {
            RegisterDeviceRequest req = RegisterDeviceRequest.fromMap(request);
            DeviceTokenServiceImpl.RegisterOutcome outcome =
                    ((DeviceTokenServiceImpl) deviceTokenService).registerDeviceWithOutcome(req);
            DeviceToken token = outcome == null ? null : outcome.getDevice();
            if (token == null) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Bỏ qua đăng ký (thiếu dòng thiết bị, không insert)",
                        "data", ""));
            }

            // Chỉ gửi push bù khi có gì đổi (dòng mới / token đổi / enabled false->true).
            if (req.getMaTaiKhoanBn() != null && outcome.isShouldSendPendingPush()) {
                sendPendingQuietly(req.getMaTaiKhoanBn());
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đăng ký thiết bị thành công",
                    "data", token
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    private void sendPendingQuietly(Integer maTaiKhoanBn) {
        try {
            int count = thongBaoService.sendPendingPushToUser(maTaiKhoanBn);
            if (count > 0) {
                log.info("Đã gửi push bù cho {} thông báo của maTaiKhoanBn={} sau khi đăng ký token",
                        count, maTaiKhoanBn);
            }
        } catch (Exception pushErr) {
            log.warn("Lỗi khi gửi push bù cho maTaiKhoanBn={}: {}", maTaiKhoanBn, pushErr.getMessage());
        }
    }

    @PatchMapping("/notification-status")
    public ResponseEntity<?> updateNotificationStatus(@RequestBody Map<String, Object> request) {
        try {
            Integer maTaiKhoanBn = toInt(request.get("maTaiKhoanBn"));
            String deviceId = toStr(request.get("deviceId"));
            // Thiếu (user, deviceId): bỏ qua, không insert, vẫn trả success (idempotent).
            if (maTaiKhoanBn == null || deviceId == null) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Bỏ qua (thiếu maTaiKhoanBn/deviceId)",
                        "data", ""));
            }
            Boolean enabled = toBool(request.get("notificationsEnabled"));
            String fcmToken = toStr(request.get("fcmToken"));
            DeviceToken saved = deviceTokenService.updateNotificationStatus(
                    maTaiKhoanBn, deviceId, enabled, fcmToken);
            if (saved == null) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Bỏ qua (chưa có dòng thiết bị)",
                        "data", ""));
            }
            if (Boolean.TRUE.equals(enabled) && saved.getFcmToken() != null
                    && !saved.getFcmToken().isEmpty()) {
                sendPendingQuietly(maTaiKhoanBn);
            }
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật trạng thái thông báo thành công",
                    "data", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Lỗi: " + e.getMessage()));
        }
    }

    private Integer toInt(Object v) {
        if (v instanceof Number) {
            return ((Number) v).intValue();
        }
        return v == null ? null : Integer.valueOf(v.toString());
    }

    private String toStr(Object v) {
        if (v == null) {
            return null;
        }
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private Boolean toBool(Object v) {
        if (v instanceof Boolean) {
            return (Boolean) v;
        }
        return v == null ? null : Boolean.parseBoolean(v.toString());
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> removeToken(@RequestBody Map<String, Object> request) {
        try {
            Integer maTaiKhoanBn = toInt(request.get("maTaiKhoanBn"));
            String deviceId = toStr(request.get("deviceId"));
            // App mới gửi (user, deviceId); app cũ gửi (user, fcmToken) -> giữ tương thích.
            if (deviceId != null) {
                deviceTokenService.removeTokenByDevice(maTaiKhoanBn, deviceId);
            } else {
                String fcmToken = toStr(request.get("fcmToken"));
                deviceTokenService.removeToken(maTaiKhoanBn, fcmToken);
            }
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Xóa token thành công"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/remove-all/{maTaiKhoanBn}")
    public ResponseEntity<?> removeAllTokens(@PathVariable Integer maTaiKhoanBn) {
        try {
            deviceTokenService.removeAllTokens(maTaiKhoanBn);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Xóa tất cả token thành công"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Lỗi: " + e.getMessage()
            ));
        }
    }
}