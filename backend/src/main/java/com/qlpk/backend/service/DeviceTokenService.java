package com.qlpk.backend.service;

import com.qlpk.backend.entity.DeviceToken;

import java.util.List;

public interface DeviceTokenService {
    DeviceToken registerToken(Integer maTaiKhoanBn, String fcmToken, String deviceType);
    void removeToken(Integer maTaiKhoanBn, String fcmToken);
    void removeAllTokens(Integer maTaiKhoanBn);
    List<DeviceToken> getTokensByUser(Integer maTaiKhoanBn);
    List<String> getActiveFcmTokens(Integer maTaiKhoanBn);
    List<String> getAllActiveFcmTokens();
    List<String> getAllFcmTokensPreview();
    List<DeviceToken> getAllTokens();
}
