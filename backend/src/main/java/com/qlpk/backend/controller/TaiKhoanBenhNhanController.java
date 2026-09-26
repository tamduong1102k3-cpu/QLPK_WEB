package com.qlpk.backend.controller;

import com.qlpk.backend.config.CookieUtil;
import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.entity.OtpVerification;
import com.qlpk.backend.entity.RefreshToken;
import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.OtpVerificationRepository;
import com.qlpk.backend.service.EmailService;
import com.qlpk.backend.service.RefreshTokenService;
import com.qlpk.backend.service.TaiKhoanBenhNhanService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tai-khoan-benh-nhan")
public class TaiKhoanBenhNhanController {

    @Autowired
    private TaiKhoanBenhNhanService taiKhoanBenhNhanService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Autowired
    private CookieUtil cookieUtil;

    private boolean isMobileClient(HttpServletRequest request) {
        return "mobile".equalsIgnoreCase(request.getHeader("X-Client"));
    }

    private boolean hasCsrfHeader(HttpServletRequest request) {
        return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest httpRequest,
                                          HttpServletResponse httpResponse,
                                          @RequestBody(required = false) Map<String, String> request) {
        boolean mobile = isMobileClient(httpRequest);

        String refreshToken = cookieUtil.getRefreshTokenFromCookie(httpRequest);
        if (refreshToken == null && request != null) {
            refreshToken = request.get("refreshToken");
        }

        if (!mobile && refreshToken != null && !hasCsrfHeader(httpRequest)) {
            return ResponseEntity.status(403).body(Map.of("message", "Yêu cầu không hợp lệ (thiếu CSRF header)!"));
        }

        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu refresh token!"));
        }

        if (!jwtUtils.validateToken(refreshToken)) {
            return ResponseEntity.status(401).body(Map.of("message", "Refresh token không hợp lệ hoặc đã hết hạn!"));
        }

        if (!jwtUtils.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không phải là refresh token!"));
        }

        Optional<RefreshToken> storedTokenOpt = refreshTokenService.validateAndRevoke(refreshToken);
        if (storedTokenOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "Refresh token đã bị thu hồi hoặc không tồn tại. Vui lòng đăng nhập lại!"
            ));
        }

        String username = jwtUtils.getUsernameFromToken(refreshToken);
        String role = jwtUtils.getRoleFromToken(refreshToken);
        Integer maTaiKhoanBn = jwtUtils.getMaTaiKhoanBnFromToken(refreshToken);
        Integer maBenhNhan = jwtUtils.getMaBenhNhanFromToken(refreshToken);

        if (username != null) {
            Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanService.findByUsername(username);
            if (accountOpt.isEmpty()) {
                accountOpt = taiKhoanBenhNhanService.findByEmail(username);
            }
            if (accountOpt.isPresent() && accountOpt.get().getMaBenhNhan() != null) {
                maBenhNhan = accountOpt.get().getMaBenhNhan();
            }
        }

        String newToken = jwtUtils.generatePatientTokenWithMaBenhNhan(
                username, maTaiKhoanBn, role, maBenhNhan, ""
        );
        String newRefreshToken = jwtUtils.generateRefreshToken(
                username, maTaiKhoanBn, role, maBenhNhan, ""
        );

        long refreshExpiryMs = 604800000L; 
        LocalDateTime expiryDate = LocalDateTime.ofInstant(
            Instant.ofEpochMilli(System.currentTimeMillis() + refreshExpiryMs),
            ZoneId.systemDefault()
        );
        refreshTokenService.saveRefreshToken(newRefreshToken, username, "PATIENT", expiryDate);

        Map<String, Object> response = new HashMap<>();
        response.put("token", newToken);
        response.put("message", "Làm mới token thành công!");

        if (mobile) {

            response.put("refreshToken", newRefreshToken);
            return ResponseEntity.ok(response);
        }

        ResponseCookie cookie = cookieUtil.createRefreshTokenCookie(newRefreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest httpRequest,
                                    HttpServletResponse httpResponse,
                                    @RequestBody(required = false) Map<String, String> request) {
        boolean mobile = isMobileClient(httpRequest);

        String refreshToken = cookieUtil.getRefreshTokenFromCookie(httpRequest);
        if (refreshToken == null && request != null) {
            refreshToken = request.get("refreshToken");
        }

        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu refresh token!"));
        }

        if (!mobile && !hasCsrfHeader(httpRequest)) {
            return ResponseEntity.status(403).body(Map.of("message", "Yêu cầu không hợp lệ (thiếu CSRF header)!"));
        }

        try {
            String username = jwtUtils.getUsernameFromToken(refreshToken);
            refreshTokenService.revokeAllByUsername(username);
        } catch (Exception e) {

        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Đăng xuất thành công!");

        if (mobile) {
            return ResponseEntity.ok(response);
        }

        ResponseCookie clearCookie = cookieUtil.createClearCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(response);
    }

    @GetMapping
    public List<TaiKhoanBenhNhan> getAll() {
        return taiKhoanBenhNhanService.getAllTaiKhoanBenhNhan();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaiKhoanBenhNhan> getById(@PathVariable Integer id) {
        Optional<TaiKhoanBenhNhan> taiKhoanBenhNhan = taiKhoanBenhNhanService.getTaiKhoanBenhNhanById(id);
        return taiKhoanBenhNhan.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TaiKhoanBenhNhan taiKhoanBenhNhan) {

        String email = taiKhoanBenhNhan.getEmail() != null ? taiKhoanBenhNhan.getEmail().trim() : null;
        if (email != null) {
            if (taiKhoanBenhNhanService.existsByEmail(email)
                    || benhNhanRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Email này đã được sử dụng. Vui lòng dùng email khác!"
                ));
            }
        }

        String soDienThoai = taiKhoanBenhNhan.getSoDienThoai() != null ? taiKhoanBenhNhan.getSoDienThoai().trim() : null;
        if (soDienThoai != null && !soDienThoai.isBlank()
                && taiKhoanBenhNhanService.existsBySoDienThoai(soDienThoai)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại đã được sử dụng!"));
        }

        TaiKhoanBenhNhan created = taiKhoanBenhNhanService.createTaiKhoanBenhNhan(taiKhoanBenhNhan);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody TaiKhoanBenhNhan taiKhoanBenhNhanDetails) {
        TaiKhoanBenhNhan updated = taiKhoanBenhNhanService.updateTaiKhoanBenhNhan(id, taiKhoanBenhNhanDetails);
        if (updated != null) {

            if (updated.getMaBenhNhan() != null) {
                String username = updated.getUsername() != null ? updated.getUsername() : updated.getEmail();
                String newToken = jwtUtils.generatePatientTokenWithMaBenhNhan(
                    username,
                    updated.getMaTaiKhoanBn(),
                    updated.getVaiTro(),
                    updated.getMaBenhNhan(),
                    updated.getEmail()
                );
                Map<String, Object> response = new HashMap<>();
                response.put("token", newToken);
                response.put("maTaiKhoanBn", updated.getMaTaiKhoanBn());
                response.put("maBenhNhan", updated.getMaBenhNhan());
                response.put("username", updated.getUsername());
                response.put("email", updated.getEmail());
                response.put("soDienThoai", updated.getSoDienThoai());
                response.put("emailVerified", updated.getEmailVerified());
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/link-patient")
    public ResponseEntity<?> linkPatient(@PathVariable Integer id,
                                          @RequestBody Map<String, Integer> request) {
        Integer maBenhNhan = request.get("maBenhNhan");
        if (maBenhNhan == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu mã bệnh nhân!"));
        }

        TaiKhoanBenhNhan updated = taiKhoanBenhNhanService.linkPatient(id, maBenhNhan);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        String username = updated.getUsername() != null ? updated.getUsername() : updated.getEmail();
        String newToken = jwtUtils.generatePatientTokenWithMaBenhNhan(
            username,
            updated.getMaTaiKhoanBn(),
            updated.getVaiTro(),
            updated.getMaBenhNhan(),
            updated.getEmail()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("token", newToken);
        response.put("maTaiKhoanBn", updated.getMaTaiKhoanBn());
        response.put("maBenhNhan", updated.getMaBenhNhan());
        response.put("username", updated.getUsername());
        response.put("email", updated.getEmail());
        response.put("soDienThoai", updated.getSoDienThoai());
        response.put("emailVerified", updated.getEmailVerified());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        taiKhoanBenhNhanService.deleteTaiKhoanBenhNhan(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request,
                                   HttpServletRequest httpRequest,
                                   HttpServletResponse httpResponse) {
        String identity = request.get("identity");
        String password = request.get("password");
        boolean mobile = isMobileClient(httpRequest);

        if (identity == null || identity.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ CCCD/Email và Mật khẩu"));
        }

        TaiKhoanBenhNhan account = taiKhoanBenhNhanService.login(identity, password);
        if (account == null) {
            return ResponseEntity.status(401).body(Map.of("message", "CCCD/Email hoặc mật khẩu không chính xác!"));
        }

        String username = account.getUsername() != null ? account.getUsername() : account.getEmail();
        String token = jwtUtils.generatePatientTokenWithMaBenhNhan(
                username,
                account.getMaTaiKhoanBn(),
                account.getVaiTro(),
                account.getMaBenhNhan(),
                account.getEmail()
        );

        String refreshToken = jwtUtils.generateRefreshToken(
                username,
                account.getMaTaiKhoanBn(),
                account.getVaiTro(),
                account.getMaBenhNhan(),
                account.getEmail()
        );

        refreshTokenService.revokeAllByUsername(username);

        long refreshExpiryMs = 604800000L; 
        LocalDateTime expiryDate = LocalDateTime.ofInstant(
            Instant.ofEpochMilli(System.currentTimeMillis() + refreshExpiryMs),
            ZoneId.systemDefault()
        );
        refreshTokenService.saveRefreshToken(refreshToken, username, "PATIENT", expiryDate);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("maTaiKhoanBn", account.getMaTaiKhoanBn());
        response.put("username", account.getUsername());
        response.put("email", account.getEmail());
        response.put("soDienThoai", account.getSoDienThoai());
        response.put("maBenhNhan", account.getMaBenhNhan());
        response.put("vaiTro", account.getVaiTro());
        response.put("emailVerified", account.getEmailVerified());
        response.put("message", "Đăng nhập thành công!");

        if (mobile) {

            response.put("refreshToken", refreshToken);
            return ResponseEntity.ok(response);
        }

        ResponseCookie cookie = cookieUtil.createRefreshTokenCookie(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        Optional<TaiKhoanBenhNhan> taiKhoanOpt = taiKhoanBenhNhanService.findByEmail(email);
        if (taiKhoanOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không tồn tại trong hệ thống!"));
        }

        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append((int) (Math.random() * 10));
        }
        String generatedOTP = code.toString();

        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        OtpVerification otpRecord = new OtpVerification();
        otpRecord.setEmail(email);
        otpRecord.setOtp(generatedOTP);
        otpRecord.setExpiryTime(expiry);
        otpRecord.setUsed(false);
        String role = taiKhoanOpt.get().getVaiTro();
        otpRecord.setRole(role != null ? role : "BENH_NHAN");
        otpVerificationRepository.save(otpRecord);

        String subject = "Mã xác nhận lấy lại mật khẩu - PHÒNG KHÁM";
        String body = "Chào bạn,\n\nMã xác nhận của bạn là: " + generatedOTP + "\n\nMã có hiệu lực trong 5 phút.";
        boolean emailSent = emailService.sendEmail(email, subject, body);

        Map<String, Object> response = new HashMap<>();
        if (emailSent) {
            response.put("message", "Đã gửi mã xác nhận thành công");
        } else {
            System.err.println("Không thể gửi email qua Brevo tới " + email);
            response.put("message", "Không thể gửi email. Vui lòng thử lại sau.");
        } 
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu email hoặc mã OTP"));
        }

        var otpRecordOpt = otpVerificationRepository.findTopByEmailAndUsedOrderByExpiryTimeDesc(email, false);
        if (otpRecordOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy mã OTP cho email này. Vui lòng yêu cầu mã mới."));
        }

        OtpVerification otpRecord = otpRecordOpt.get();

        if (otpRecord.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."));
        }

        if (!otpRecord.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã xác nhận không đúng!"));
        }

        Optional<TaiKhoanBenhNhan> taiKhoanOpt = taiKhoanBenhNhanService.findByEmail(email);
        if (taiKhoanOpt.isPresent() && taiKhoanOpt.get().getVaiTro() != null) {
            otpRecord.setRole(taiKhoanOpt.get().getVaiTro());
        } else {
            otpRecord.setRole("BENH_NHAN");
        }

        otpRecord.setUsed(true);
        otpVerificationRepository.save(otpRecord);

        return ResponseEntity.ok(Map.of("message", "Xác thực OTP thành công!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        if (email == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập email và mật khẩu mới"));
        }

        boolean isSuccess = taiKhoanBenhNhanService.doiMatKhau(email, newPassword);
        if (!isSuccess) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không tồn tại!"));
        }
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
    }

    @PostMapping("/verify-email/send-otp")
    public ResponseEntity<?> sendOtpVerifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập email!"));
        }
        email = email.trim();

        Optional<TaiKhoanBenhNhan> taiKhoanOpt = taiKhoanBenhNhanService.findByEmail(email);
        if (taiKhoanOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không tồn tại trong hệ thống!"));
        }

        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append((int) (Math.random() * 10));
        }
        String generatedOTP = code.toString();

        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        OtpVerification otpRecord = new OtpVerification();
        otpRecord.setEmail(email);
        otpRecord.setOtp(generatedOTP);
        otpRecord.setExpiryTime(expiry);
        otpRecord.setUsed(false);
        String role = taiKhoanOpt.get().getVaiTro();
        otpRecord.setRole(role != null ? role : "BENH_NHAN");
        otpVerificationRepository.save(otpRecord);

        String subject = "Xác thực email - PHÒNG KHÁM";
        String body = "Chào bạn,\n\nMã xác nhận email của bạn là: " + generatedOTP + "\n\nMã có hiệu lực trong 5 phút.";
        boolean emailSent = emailService.sendEmail(email, subject, body);

        Map<String, Object> response = new HashMap<>();
        if (emailSent) {
            response.put("message", "Đã gửi mã xác nhận email thành công");
        } else {
            System.err.println("Không thể gửi email qua Brevo tới " + email);
            response.put("message", "Không thể gửi email. Vui lòng thử lại sau.");
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email/confirm-otp")
    public ResponseEntity<?> confirmOtpVerifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu email hoặc mã OTP"));
        }
        email = email.trim();

        var otpRecordOpt = otpVerificationRepository.findTopByEmailAndUsedOrderByExpiryTimeDesc(email, false);
        if (otpRecordOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy mã OTP cho email này. Vui lòng yêu cầu mã mới."));
        }

        OtpVerification otpRecord = otpRecordOpt.get();

        if (otpRecord.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."));
        }

        if (!otpRecord.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã xác nhận không đúng!"));
        }

        Optional<TaiKhoanBenhNhan> taiKhoanOpt = taiKhoanBenhNhanService.findByEmail(email);
        if (taiKhoanOpt.isPresent() && taiKhoanOpt.get().getVaiTro() != null) {
            otpRecord.setRole(taiKhoanOpt.get().getVaiTro());
        } else {
            otpRecord.setRole("BENH_NHAN");
        }

        otpRecord.setUsed(true);
        otpVerificationRepository.save(otpRecord);

        boolean emailMarked = taiKhoanBenhNhanService.emailVerified(email);
        if (!emailMarked) {
            return ResponseEntity.status(500).body(Map.of(
                "message", "Xác thực OTP thành công, mais impossible de marquer email_verified. Vui lòng contacter le support."
            ));
        }

        return ResponseEntity.ok(Map.of("message", "Xác thực email thành công!"));
    }

    @GetMapping("/by-username")
    public ResponseEntity<?> findByUsername(@RequestParam String username) {
        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanService.findByUsername(username);
        return accountOpt.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-email")
    public ResponseEntity<?> findByEmail(@RequestParam String email) {
        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanService.findByEmail(email);
        return accountOpt.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-ma-benh-nhan")
    public ResponseEntity<?> findByMaBenhNhan(@RequestParam Integer maBenhNhan) {
        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanService.findByMaBenhNhan(maBenhNhan);
        return accountOpt.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/check-ma-benh-nhan")
    public ResponseEntity<?> checkMaBenhNhan(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ!"));
        }

        String token = authHeader.substring(7);
        if (!jwtUtils.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ!"));
        }

        String username = jwtUtils.getUsernameFromToken(token);
        Optional<TaiKhoanBenhNhan> accountOpt = taiKhoanBenhNhanService.findByUsername(username);

        if (accountOpt.isEmpty()) {
            accountOpt = taiKhoanBenhNhanService.findByEmail(username);
        }

        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tài khoản!"));
        }

        TaiKhoanBenhNhan account = accountOpt.get();
        if (account.getMaBenhNhan() != null) {
            return ResponseEntity.ok(Map.of(
                    "hasMaBenhNhan", true,
                    "maBenhNhan", account.getMaBenhNhan()
            ));
        }

        return ResponseEntity.ok(Map.of("hasMaBenhNhan", false));
    }
}
