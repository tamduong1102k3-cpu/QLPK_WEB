package com.qlpk.backend.repository;

import com.qlpk.backend.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    Optional<DeviceToken> findByMaTaiKhoanBnAndFcmToken(Integer maTaiKhoanBn, String fcmToken);

    List<DeviceToken> findByMaTaiKhoanBn(Integer maTaiKhoanBn);

    void deleteByMaTaiKhoanBnAndFcmToken(Integer maTaiKhoanBn, String fcmToken);

    void deleteByMaTaiKhoanBn(Integer maTaiKhoanBn);

    List<DeviceToken> findAll();
}
