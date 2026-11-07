package com.qlpk.backend.repository;

import com.qlpk.backend.entity.RefreshToken;
import com.qlpk.backend.entity.TokenRevokeReason;
import com.qlpk.backend.entity.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUsernameAndStatus(String username, TokenStatus status);

    List<RefreshToken> findByUsernameAndTokenTypeAndStatus(String username, String tokenType, TokenStatus status);

    Optional<RefreshToken> findByUsernameAndSessionIdAndTokenTypeAndStatus(
            String username, String sessionId, String tokenType, TokenStatus status);

    Optional<RefreshToken> findById(Long id);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.status = 'REVOKED', r.revokeReason = :reason, r.revokedAt = :revokedAt WHERE r.username = :username AND r.tokenType = :tokenType AND r.status = 'ACTIVE'")
    void revokeAllActiveByUsernameAndTokenType(String username, String tokenType, TokenRevokeReason reason, LocalDateTime revokedAt);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.status = 'REVOKED', r.revokeReason = :reason, r.revokedAt = :revokedAt WHERE r.username = :username AND r.status = 'ACTIVE'")
    void revokeAllActiveByUsername(String username, TokenRevokeReason reason, LocalDateTime revokedAt);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiryDate < :now")
    void deleteExpiredTokens(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.status IN (com.qlpk.backend.entity.TokenStatus.REVOKED, com.qlpk.backend.entity.TokenStatus.EXPIRED) OR r.expiryDate < :now")
    void deleteRevokedAndExpiredTokens(LocalDateTime now);
}
