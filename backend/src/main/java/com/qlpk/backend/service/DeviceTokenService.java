package com.qlpk.backend.service;

import com.qlpk.backend.dto.RegisterDeviceRequest;
import com.qlpk.backend.entity.DeviceToken;

import java.util.List;

public interface DeviceTokenService {
    DeviceToken registerToken(Integer maTaiKhoanBn, String fcmToken, String deviceType);

    DeviceToken registerDevice(RegisterDeviceRequest request);

    void removeToken(Integer maTaiKhoanBn, String fcmToken);
    void removeTokenByDevice(Integer maTaiKhoanBn, String deviceId);
    void removeAllTokens(Integer maTaiKhoanBn);
    List<DeviceToken> getTokensByUser(Integer maTaiKhoanBn);
    java.util.Optional<DeviceToken> getTargetDevice(Integer maTaiKhoanBn);
    List<String> getActiveFcmTokens(Integer maTaiKhoanBn);
    List<String> getAllActiveFcmTokens();
    List<String> getAllFcmTokensPreview();
    List<DeviceToken> getAllTokens();
    DeviceToken updateNotificationStatus(Integer maTaiKhoanBn, String deviceId,
            Boolean notificationsEnabled, String fcmToken);
}
