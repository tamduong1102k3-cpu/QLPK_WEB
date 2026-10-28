package com.qlpk.backend.service;

import com.qlpk.backend.entity.RefreshToken;
import com.qlpk.backend.entity.TokenStatus;
import com.qlpk.backend.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    /** Lưu refresh token mới với trạng thái ACTIVE và thời hạn sử dụng */
    @Transactional
    public RefreshToken saveRefreshToken(String token, String username, String tokenType, LocalDateTime expiryDate) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUsername(username);
        refreshToken.setTokenType(tokenType);
        refreshToken.setStatus(TokenStatus.ACTIVE);
        refreshToken.setExpiryDate(expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    /** Thời gian gia hạn 60s: cho phép refresh token vừa bị thu hồi (do rotation làm mất response)
     *  vẫn được cấp token mới, tránh tình trạng mạng yếu làm mất response
     *  → client giữ token cũ (đã bị thu hồi) → 401 → vòng lặp logout/load liên tục */
    private static final long GRACE_PERIOD_SECONDS = 60;

    /** Kiểm tra tính hợp lệ của refresh token và thu hồi nó (rotation) */
    @Transactional
    public Optional<RefreshToken> validateAndRevoke(String token) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }

        RefreshToken refreshToken = tokenOpt.get();

        // Kiểm tra token đã hết hạn chưa
        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshToken.setStatus(TokenStatus.EXPIRED);
            refreshTokenRepository.save(refreshToken);
            return Optional.empty();
        }

        // Kiểm tra token đã bị thu hồi chưa
        if (refreshToken.getStatus() != TokenStatus.ACTIVE) {
            // THỜI GIAN GIA HẠN: nếu token vừa bị thu hồi trong vòng 60s (do rotation trước),
            // cho phép tái sử dụng để lấy token mới thay vì trả 401.
            // Đây là cách khắc phục cho trường hợp response của refresh trước bị mất do mạng yếu.
            if (refreshToken.getCreatedAt() != null &&
                    refreshToken.getCreatedAt().plusSeconds(GRACE_PERIOD_SECONDS).isAfter(LocalDateTime.now())) {
                // Đặt lại trạng thái về REVOKED và thu hồi lại để tạo vòng rotation mới
                refreshToken.setStatus(TokenStatus.REVOKED);
                refreshTokenRepository.save(refreshToken);
                return Optional.of(refreshToken);
            }
            return Optional.empty();
        }

        // Thu hồi token (rotation)
        refreshToken.setStatus(TokenStatus.REVOKED);
        refreshTokenRepository.save(refreshToken);

        return Optional.of(refreshToken);
    }

    /** Thu hồi toàn bộ refresh token đang hoạt động của một tài khoản */
    @Transactional
    public void revokeAllByUsername(String username) {
        refreshTokenRepository.revokeAllActiveByUsername(username);
    }

    /** Xóa các refresh token đã bị thu hồi hoặc đã hết hạn */
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteRevokedAndExpiredTokens(LocalDateTime.now());
    }
}
