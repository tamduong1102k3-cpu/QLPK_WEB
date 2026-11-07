package com.qlpk.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Map;

/**
 * DTO đăng ký / cập nhật thiết bị FCM (chính sách single-active-device).
 * fcmToken được phép null (quyền tắt). loginEvent=true chỉ khi login.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDeviceRequest {
    private Integer maTaiKhoanBn;
    private String fcmToken;
    private String deviceType;
    private String deviceId;
    private String deviceName;
    private String osVersion;
    private String appVersion;
    private Boolean notificationsEnabled;
    private Boolean loginEvent;

    public static RegisterDeviceRequest fromMap(Map<String, Object> map) {
        RegisterDeviceRequest r = new RegisterDeviceRequest();
        if (map == null)
            return r;
        Object u = map.get("maTaiKhoanBn");
        if (u instanceof Number) {
            r.setMaTaiKhoanBn(((Number) u).intValue());
        }
        Object t = map.get("fcmToken");
        if (t != null) {
            String s = t.toString().trim();
            r.setFcmToken(s.isEmpty() ? null : s);
        }
        Object dt = map.get("deviceType");
        if (dt != null)
            r.setDeviceType(dt.toString());
        Object did = map.get("deviceId");
        if (did != null) {
            String s = did.toString().trim();
            r.setDeviceId(s.isEmpty() ? null : s);
        }
        Object dn = map.get("deviceName");
        if (dn != null)
            r.setDeviceName(dn.toString());
        Object osv = map.get("osVersion");
        if (osv != null)
            r.setOsVersion(osv.toString());
        Object av = map.get("appVersion");
        if (av != null)
            r.setAppVersion(av.toString());
        Object ne = map.get("notificationsEnabled");
        if (ne instanceof Boolean) {
            r.setNotificationsEnabled((Boolean) ne);
        } else if (ne != null) {
            r.setNotificationsEnabled(Boolean.parseBoolean(ne.toString()));
        }
        Object le = map.get("loginEvent");
        if (le instanceof Boolean) {
            r.setLoginEvent((Boolean) le);
        } else if (le != null) {
            r.setLoginEvent(Boolean.parseBoolean(le.toString()));
        }
        return r;
    }
}
