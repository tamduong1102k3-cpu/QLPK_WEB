package com.qlpk.backend.repository;

import com.qlpk.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByEmailAndUsedOrderByExpiryTimeDesc(String email, Boolean used);
    void deleteByEmail(String email);
}
