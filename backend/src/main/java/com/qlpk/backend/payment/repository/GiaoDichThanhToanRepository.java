package com.qlpk.backend.payment.repository;

import com.qlpk.backend.payment.entity.GiaoDichThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GiaoDichThanhToanRepository extends JpaRepository<GiaoDichThanhToan, Integer> {
    Optional<GiaoDichThanhToan> findByOrderId(String orderId);
}
