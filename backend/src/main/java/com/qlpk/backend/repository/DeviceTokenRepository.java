package com.qlpk.backend.repository;

import com.qlpk.backend.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    Optional<DeviceToken> findByMaTaiKhoanBnAndFcmToken(Integer maTaiKhoanBn, String fcmToken);

    Optional<DeviceToken> findByMaTaiKhoanBnAndDeviceId(Integer maTaiKhoanBn, String deviceId);

    List<DeviceToken> findByMaTaiKhoanBn(Integer maTaiKhoanBn);

    List<DeviceToken> findByMaTaiKhoanBnOrderByLastLoginAtDesc(Integer maTaiKhoanBn);

    @Query("SELECT d FROM DeviceToken d WHERE d.maTaiKhoanBn = :maTaiKhoanBn "
            + "AND ((:deviceId IS NULL AND d.deviceId IS NULL) OR d.deviceId <> :deviceId "
            + "OR (:deviceId IS NOT NULL AND d.deviceId IS NULL))")
    List<DeviceToken> findOtherDevices(@Param("maTaiKhoanBn") Integer maTaiKhoanBn,
            @Param("deviceId") String deviceId);

    @Transactional
    void deleteByMaTaiKhoanBnAndFcmToken(Integer maTaiKhoanBn, String fcmToken);

    @Transactional
    void deleteByMaTaiKhoanBn(Integer maTaiKhoanBn);

    @Transactional
    void deleteByMaTaiKhoanBnAndDeviceId(Integer maTaiKhoanBn, String deviceId);

    @Transactional
    @Modifying
    @Query("DELETE FROM DeviceToken d WHERE d.maTaiKhoanBn = :maTaiKhoanBn "
            + "AND ((:deviceId IS NULL AND d.deviceId IS NULL) OR d.deviceId <> :deviceId "
            + "OR (:deviceId IS NOT NULL AND d.deviceId IS NULL))")
    void deleteOtherDevices(@Param("maTaiKhoanBn") Integer maTaiKhoanBn,
            @Param("deviceId") String deviceId);

    List<DeviceToken> findAll();
}
