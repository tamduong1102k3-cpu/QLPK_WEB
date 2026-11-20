package com.qlpk.backend.service;

import com.qlpk.backend.entity.RefreshToken;
import com.qlpk.backend.entity.TokenRevokeReason;
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
        return saveRefreshToken(token, username, tokenType, expiryDate, null);
    }

    @Transactional
    public RefreshToken saveRefreshToken(String token, String username, String tokenType, LocalDateTime expiryDate, String sessionId) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUsername(username);
        refreshToken.setTokenType(tokenType);
        refreshToken.setStatus(TokenStatus.ACTIVE);
        refreshToken.setExpiryDate(expiryDate);
        refreshToken.setSessionId(sessionId);
        return refreshTokenRepository.save(refreshToken);
    }

    public static class RotationResult {
        public enum Type { REVOKED, GRACE, INVALID }

        public final Type type;
        public final RefreshToken revokedToken;
        public final RefreshToken successorToken;

        private RotationResult(Type type, RefreshToken revokedToken, RefreshToken successorToken) {
            this.type = type;
            this.revokedToken = revokedToken;
            this.successorToken = successorToken;
        }

        public static RotationResult revoked(RefreshToken revokedToken) {
            return new RotationResult(Type.REVOKED, revokedToken, null);
        }

        public static RotationResult grace(RefreshToken revokedToken, RefreshToken successorToken) {
            return new RotationResult(Type.GRACE, revokedToken, successorToken);
        }

        public static RotationResult invalid() {
            return new RotationResult(Type.INVALID, null, null);
        }
    }

    private static final long GRACE_PERIOD_SECONDS = 60;

    @Transactional
    public RotationResult validateAndRevoke(String token) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return RotationResult.invalid();
        }

        RefreshToken refreshToken = tokenOpt.get();

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshToken.setStatus(TokenStatus.EXPIRED);
            refreshToken.setRevokeReason(TokenRevokeReason.ROTATED);
            refreshToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);
            return RotationResult.invalid();
        }

        if (refreshToken.getStatus() != TokenStatus.ACTIVE) {
            if (refreshToken.getRevokeReason() == TokenRevokeReason.ROTATED
                    && refreshToken.getRevokedAt() != null
                    && refreshToken.getRevokedAt().plusSeconds(GRACE_PERIOD_SECONDS).isAfter(LocalDateTime.now())
                    && refreshToken.getReplacedByTokenId() != null) {
                Optional<RefreshToken> successorOpt = refreshTokenRepository.findById(refreshToken.getReplacedByTokenId());
                if (successorOpt.isPresent()) {
                    RefreshToken successor = successorOpt.get();
                    if (successor.getStatus() == TokenStatus.ACTIVE
                            && successor.getExpiryDate().isAfter(LocalDateTime.now())) {
                        return RotationResult.grace(refreshToken, successor);
                    }
                }
            }
            return RotationResult.invalid();
        }

        refreshToken.setStatus(TokenStatus.REVOKED);
        refreshToken.setRevokeReason(TokenRevokeReason.ROTATED);
        refreshToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);

        return RotationResult.revoked(refreshToken);
    }

    @Transactional
    public void revokeAllByUsername(String username, String tokenType, TokenRevokeReason reason) {
        refreshTokenRepository.revokeAllActiveByUsernameAndTokenType(username, tokenType, reason, LocalDateTime.now());
    }

    @Transactional
    public void revokeAllByUsername(String username, TokenRevokeReason reason) {
        refreshTokenRepository.revokeAllActiveByUsername(username, reason, LocalDateTime.now());
    }

    @Transactional
    public void revokeAllByUsername(String username) {
        revokeAllByUsername(username, TokenRevokeReason.ADMIN_REVOKED);
    }

    @Transactional
    public void revokeToken(String token, TokenRevokeReason reason) {
        if (token == null || token.isBlank()) return;
        refreshTokenRepository.findByToken(token).ifPresent(rt -> {
            if (rt.getStatus() == TokenStatus.ACTIVE || rt.getStatus() == TokenStatus.REVOKED) {
                rt.setStatus(TokenStatus.REVOKED);
                rt.setRevokeReason(reason);
                rt.setRevokedAt(LocalDateTime.now());
                refreshTokenRepository.save(rt);
            }
        });
    }
    @Transactional
    public void linkReplacement(Long revokedTokenId, Long successorTokenId) {
        Optional<RefreshToken> revokedOpt = refreshTokenRepository.findById(revokedTokenId);
        if (revokedOpt.isPresent()) {
            RefreshToken revoked = revokedOpt.get();
            revoked.setReplacedByTokenId(successorTokenId);
            refreshTokenRepository.save(revoked);
        }
    }

@org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Optional<RefreshToken> validateSession(String username, String sessionId, String tokenType) {
        if (username == null || sessionId == null || tokenType == null) {
            return Optional.empty();
        }
        Optional<RefreshToken> tokenOpt = refreshTokenRepository
                .findByUsernameAndSessionIdAndTokenTypeAndStatus(username, sessionId, tokenType, TokenStatus.ACTIVE);
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }
        RefreshToken token = tokenOpt.get();
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }
        return Optional.of(token);
    }

    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteRevokedAndExpiredTokens(LocalDateTime.now());
    }

}
