package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.DeviceToken;
import com.qlpk.backend.repository.DeviceTokenRepository;
import com.qlpk.backend.service.DeviceTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DeviceTokenServiceImpl implements DeviceTokenService {

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    @Override
    public DeviceToken registerToken(Integer maTaiKhoanBn, String fcmToken, String deviceType) {
        Optional<DeviceToken> existing = deviceTokenRepository.findByMaTaiKhoanBnAndFcmToken(maTaiKhoanBn, fcmToken);
        if (existing.isPresent()) {
            return existing.get();
        }
        DeviceToken token = new DeviceToken();
        token.setMaTaiKhoanBn(maTaiKhoanBn);
        token.setFcmToken(fcmToken);
        token.setDeviceType(deviceType != null ? deviceType : "android");
        return deviceTokenRepository.save(token);
    }

    @Override
    public void removeToken(Integer maTaiKhoanBn, String fcmToken) {
        deviceTokenRepository.deleteByMaTaiKhoanBnAndFcmToken(maTaiKhoanBn, fcmToken);
    }

    @Override
    public void removeAllTokens(Integer maTaiKhoanBn) {
        deviceTokenRepository.deleteByMaTaiKhoanBn(maTaiKhoanBn);
    }

    @Override
    public List<DeviceToken> getTokensByUser(Integer maTaiKhoanBn) {
        return deviceTokenRepository.findByMaTaiKhoanBn(maTaiKhoanBn);
    }

    @Override
    public List<String> getActiveFcmTokens(Integer maTaiKhoanBn) {
        return deviceTokenRepository.findByMaTaiKhoanBn(maTaiKhoanBn)
                .stream()
                .map(DeviceToken::getFcmToken)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAllActiveFcmTokens() {
        return deviceTokenRepository.findAll()
                .stream()
                .map(DeviceToken::getFcmToken)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeviceToken> getAllTokens() {
        return deviceTokenRepository.findAll();
    }

    @Override
    public List<String> getAllFcmTokensPreview() {
        return deviceTokenRepository.findAll()
                .stream()
                .map(t -> t.getFcmToken().length() > 30 
                    ? t.getFcmToken().substring(0, 30) + "..." 
                    : t.getFcmToken())
                .collect(Collectors.toList());
    }
}
