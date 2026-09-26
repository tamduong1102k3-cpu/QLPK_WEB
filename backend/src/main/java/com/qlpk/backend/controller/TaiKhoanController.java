package com.qlpk.backend.controller;

import com.qlpk.backend.config.CookieUtil;
import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.entity.OtpVerification;
import com.qlpk.backend.entity.RefreshToken;
import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.repository.OtpVerificationRepository;
import com.qlpk.backend.service.EmailService;
import com.qlpk.backend.service.RefreshTokenService;
import com.qlpk.backend.service.TaiKhoanService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/taikhoan")
public class TaiKhoanController {

    @Autowired
    private TaiKhoanService taiKhoanService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private CookieUtil cookieUtil;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiryMs;

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

        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu refresh token!"));
        }

        if (!mobile && !hasCsrfHeader(httpRequest)) {
            return ResponseEntity.status(403).body(Map.of("message", "Yêu cầu không hợp lệ (thiếu CSRF header)!"));
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

        TaiKhoan account = taiKhoanService.findByUsername(username);

        if (account == null) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Tài khoản không tồn tại. Vui lòng đăng nhập lại!"
            ));
        }

        Map<String, Object> ckInfo = taiKhoanService.getChuyenKhoaInfo(account.getMaNhanVien());
        Integer maChuyenKhoa = ckInfo.get("maChuyenKhoa") != null
            ? ((Number) ckInfo.get("maChuyenKhoa")).intValue()
            : null;

        String newToken = jwtUtils.generateToken(
            username,
            account.getMaNhanVien(),
            role,
            account.getEmail(),
            account.getMaTaiKhoan(),
            maChuyenKhoa
        );
        String newRefreshToken = jwtUtils.generateEmployeeRefreshToken(
            username,
            account.getMaNhanVien(),
            role,
            account.getEmail(),
            account.getMaTaiKhoan(),
            maChuyenKhoa
        );

        LocalDateTime expiryDate = LocalDateTime.ofInstant(
            Instant.ofEpochMilli(System.currentTimeMillis() + refreshExpiryMs),
            ZoneId.systemDefault()
        );
        refreshTokenService.saveRefreshToken(newRefreshToken, username, "EMPLOYEE", expiryDate);

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
    public List<TaiKhoan> getAll() {
        return taiKhoanService.getAllTaiKhoan();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaiKhoan> getById(@PathVariable Integer id) {
        TaiKhoan taiKhoan = taiKhoanService.getTaiKhoanById(id);
        if (taiKhoan != null) {
            return ResponseEntity.ok(taiKhoan);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public TaiKhoan create(@RequestBody TaiKhoan taiKhoan) {

        if (taiKhoan.getMatKhau() != null && !taiKhoan.getMatKhau().isBlank()) {
            taiKhoan.setMatKhau(passwordEncoder.encode(taiKhoan.getMatKhau()));
        }
        taiKhoan.setLanDauDangNhap(true);
        return taiKhoanService.createTaiKhoan(taiKhoan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaiKhoan> update(@PathVariable Integer id, @RequestBody TaiKhoan taiKhoanDetails) {

        if (taiKhoanDetails.getMatKhau() != null && !taiKhoanDetails.getMatKhau().isBlank()) {
            taiKhoanDetails.setMatKhau(passwordEncoder.encode(taiKhoanDetails.getMatKhau()));
        }
        TaiKhoan updatedTaiKhoan = taiKhoanService.updateTaiKhoan(id, taiKhoanDetails);
        if (updatedTaiKhoan != null) {
            return ResponseEntity.ok(updatedTaiKhoan);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        taiKhoanService.deleteTaiKhoan(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody com.qlpk.backend.dto.LoginRequest loginRequest,
                                   HttpServletRequest httpRequest,
                                   HttpServletResponse httpResponse) {
        if (loginRequest.getIdentity() == null || loginRequest.getIdentity().trim().isEmpty() ||
            loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ Email/Username và Mật khẩu"));
        }

        boolean mobile = isMobileClient(httpRequest);

        String identity = loginRequest.getIdentity();
        TaiKhoan account = taiKhoanService.findByEmail(identity);
        if (account == null) {
            account = taiKhoanService.findByUsername(identity);
        }

        if (account == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Email hoặc tên đăng nhập không tồn tại trong hệ thống!"));
        }

        if (!passwordEncoder.matches(loginRequest.getPassword(), account.getMatKhau())) {
            return ResponseEntity.status(401).body(Map.of("message", "Mật khẩu không chính xác!"));
        }

        Map<String, Object> ckInfo = taiKhoanService.getChuyenKhoaInfo(account.getMaNhanVien());
        Integer maChuyenKhoa = ckInfo.get("maChuyenKhoa") != null
            ? ((Number) ckInfo.get("maChuyenKhoa")).intValue()
            : null;

        String token = jwtUtils.generateToken(account.getUsername(), account.getMaNhanVien(), account.getVaiTro(), account.getEmail(), account.getMaTaiKhoan(), maChuyenKhoa);

        String refreshToken = jwtUtils.generateEmployeeRefreshToken(account.getUsername(), account.getMaNhanVien(), account.getVaiTro(), account.getEmail(), account.getMaTaiKhoan(), maChuyenKhoa);

        refreshTokenService.revokeAllByUsername(account.getUsername());

        LocalDateTime expiryDate = LocalDateTime.ofInstant(
            Instant.ofEpochMilli(System.currentTimeMillis() + refreshExpiryMs),
            ZoneId.systemDefault()
        );
        refreshTokenService.saveRefreshToken(refreshToken, account.getUsername(), "EMPLOYEE", expiryDate);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", account.getUsername());
        response.put("email", account.getEmail());
        response.put("maTaiKhoan", account.getMaTaiKhoan());
        response.put("role", account.getVaiTro());
        response.put("maNhanVien", account.getMaNhanVien());
        response.put("maChuyenKhoa", ckInfo.get("maChuyenKhoa") != null ? ckInfo.get("maChuyenKhoa") : "");
        response.put("tenChuyenKhoa", ckInfo.get("tenChuyenKhoa"));

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

        TaiKhoan taiKhoan = taiKhoanService.findByEmail(email);
        if (taiKhoan == null) {
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
        otpRecord.setRole(taiKhoan.getVaiTro());
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

        TaiKhoan taiKhoan = taiKhoanService.findByEmail(email);
        if (taiKhoan != null && taiKhoan.getVaiTro() != null) {
            otpRecord.setRole(taiKhoan.getVaiTro());
        }

        otpRecord.setUsed(true);
        otpVerificationRepository.save(otpRecord);

        return ResponseEntity.ok(Map.of("message", "Xác thực OTP thành công!"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");
        try {
            boolean isSuccess = taiKhoanService.doiMatKhauTheoEmail(email, newPassword);
            if (!isSuccess) {
                return ResponseEntity.badRequest().body(Map.of("message", "Lỗi đổi mật khẩu hoặc email không tồn tại"));
            }
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi server: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        if (oldPassword == null || oldPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập mật khẩu hiện tại!"));
        }
        if (newPassword == null || newPassword.length() < 5) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu mới phải có ít nhất 5 ký tự!"));
        }

        try {
            boolean isSuccess = taiKhoanService.changePassword(id, oldPassword, newPassword);
            if (!isSuccess) {
                return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy tài khoản!"));
            }
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/first-time-change-password")
    public ResponseEntity<?> firstTimeChangePassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");
        try {
            boolean isSuccess = taiKhoanService.doiMatKhauLanDau(email, newPassword);
            if (!isSuccess) {
                return ResponseEntity.badRequest().body(Map.of("message", "Lỗi đổi mật khẩu hoặc email không tồn tại"));
            }
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công. Xin vui lòng đăng nhập lại!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi server: " + e.getMessage()));
        }
    }
}
