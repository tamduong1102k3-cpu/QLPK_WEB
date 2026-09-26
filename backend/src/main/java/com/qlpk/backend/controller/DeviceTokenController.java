package com.qlpk.backend.controller;

import com.qlpk.backend.entity.DeviceToken;
import com.qlpk.backend.service.DeviceTokenService;
import com.qlpk.backend.service.ThongBaoService;
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
            Integer maTaiKhoanBn = (Integer) request.get("maTaiKhoanBn");
            String fcmToken = (String) request.get("fcmToken");
            String deviceType = (String) request.get("deviceType");
            DeviceToken token = deviceTokenService.registerToken(maTaiKhoanBn, fcmToken, deviceType);

            if (maTaiKhoanBn != null) {
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

    @DeleteMapping("/remove")
    public ResponseEntity<?> removeToken(@RequestBody Map<String, Object> request) {
        try {
            Integer maTaiKhoanBn = (Integer) request.get("maTaiKhoanBn");
            String fcmToken = (String) request.get("fcmToken");
            deviceTokenService.removeToken(maTaiKhoanBn, fcmToken);
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
