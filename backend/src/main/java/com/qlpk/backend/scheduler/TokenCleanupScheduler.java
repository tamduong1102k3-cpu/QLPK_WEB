package com.qlpk.backend.scheduler;

import com.qlpk.backend.service.RefreshTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Dọn dẹp các refresh token đã REVOKED / EXPIRED / hết hạn.
 * Ngăn bảng refresh_token tích lũy rác sau mỗi lần login/logout/refresh-token.
 */
@Component
public class TokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);

    @Autowired
    private RefreshTokenService refreshTokenService;

    /**
     * Chạy lúc 3h sáng mỗi ngày (giờ server).
     * Xóa toàn bộ token đã bị REVOKED, EXPIRED hoặc đã quá hạn.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupTokens() {
        try {
            refreshTokenService.cleanupExpiredTokens();
            log.info("TokenCleanupScheduler: Đã dọn dẹp refresh token rác (REVOKED/EXPIRED/hết hạn)");
        } catch (Exception e) {
            log.error("TokenCleanupScheduler: Lỗi dọn dẹp refresh token: {}", e.getMessage(), e);
        }
    }
}