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

    private static final long GRACE_PERIOD_SECONDS = 60;

    @Transactional
    public Optional<RefreshToken> validateAndRevoke(String token) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }

        RefreshToken refreshToken = tokenOpt.get();

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshToken.setStatus(TokenStatus.EXPIRED);
            refreshTokenRepository.save(refreshToken);
            return Optional.empty();
        }

        if (refreshToken.getStatus() != TokenStatus.ACTIVE) {

            if (refreshToken.getCreatedAt() != null &&
                    refreshToken.getCreatedAt().plusSeconds(GRACE_PERIOD_SECONDS).isAfter(LocalDateTime.now())) {

                refreshToken.setStatus(TokenStatus.REVOKED);
                refreshTokenRepository.save(refreshToken);
                return Optional.of(refreshToken);
            }
            return Optional.empty();
        }

        refreshToken.setStatus(TokenStatus.REVOKED);
        refreshTokenRepository.save(refreshToken);

        return Optional.of(refreshToken);
    }

    @Transactional
    public void revokeAllByUsername(String username) {
        refreshTokenRepository.revokeAllActiveByUsername(username);
    }

    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteRevokedAndExpiredTokens(LocalDateTime.now());
    }
}
