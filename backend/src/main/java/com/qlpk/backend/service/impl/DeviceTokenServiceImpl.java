package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.RegisterDeviceRequest;
import com.qlpk.backend.entity.DeviceToken;
import com.qlpk.backend.repository.DeviceTokenRepository;
import com.qlpk.backend.service.DeviceTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class DeviceTokenServiceImpl implements DeviceTokenService {

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    private static final Logger log = LoggerFactory.getLogger(DeviceTokenServiceImpl.class);


    /**
     * Kết quả đăng ký thiết bị: gồm bản ghi device token vừa lưu
     * và cờ cho biết có cần gửi lại các thông báo đang chờ hay không.
     */
    public static class RegisterOutcome {
        private final DeviceToken device;
        private final boolean shouldSendPendingPush;

        /** Khởi tạo kết quả đăng ký với bản ghi device và cờ gửi thông báo chờ */
        public RegisterOutcome(DeviceToken device, boolean flag) {
            this.device = device;
            this.shouldSendPendingPush = flag;
        }

        /** Lấy bản ghi device token vừa được lưu (null nếu không có bản ghi nào) */
        public DeviceToken getDevice() { return device; }

        /** Kiểm tra có cần gửi lại các thông báo đang chờ hay không */
        public boolean isShouldSendPendingPush() { return shouldSendPendingPush; }
    }

    /** Đăng ký device token theo dạng rút gọn (không có deviceId) */
    @Override
    public DeviceToken registerToken(Integer maTaiKhoanBn, String fcmToken, String deviceType) {
        RegisterDeviceRequest req = new RegisterDeviceRequest();
        req.setMaTaiKhoanBn(maTaiKhoanBn);
        req.setFcmToken(fcmToken);
        req.setDeviceType(deviceType);
        return registerDeviceWithOutcome(req).getDevice();
    }

    /** Đăng ký thiết bị và lưu device token của bệnh nhân */
    @Override
    @Transactional
    public DeviceToken registerDevice(RegisterDeviceRequest request) {
        return registerDeviceWithOutcome(request).getDevice();
    }

    /** Đăng ký thiết bị, trả về cả bản ghi device lẫn cờ báo có cần gửi thông báo đang chờ */
    @Transactional
    public RegisterOutcome registerDeviceWithOutcome(RegisterDeviceRequest request) {
        if (request == null || request.getMaTaiKhoanBn() == null) {
            throw new IllegalArgumentException("Thieu maTaiKhoanBn");
        }
   
        if (request.getDeviceId() == null) {
            return registerLegacy(request);
        }
        try {
            return upsertByDeviceId(request);
        } catch (DataIntegrityViolationException race) {
            log.warn("Race khi upsert device user={}", request.getMaTaiKhoanBn());
            Optional<DeviceToken> retry = deviceTokenRepository
                    .findByMaTaiKhoanBnAndDeviceId(request.getMaTaiKhoanBn(), request.getDeviceId());
            if (retry.isPresent()) {
                DeviceToken existing = retry.get();
                String oldToken = existing.getFcmToken();
                Boolean oldEnabled = existing.getNotificationsEnabled();
                boolean changed = applyFields(existing, request);
                if (Boolean.TRUE.equals(request.getLoginEvent())) {
                    existing.setLastLoginAt(LocalDateTime.now());
                    deviceTokenRepository.deleteOtherDevices(
                            request.getMaTaiKhoanBn(), request.getDeviceId());
                    changed = true;
                }
                DeviceToken saved = deviceTokenRepository.save(existing);
                return new RegisterOutcome(saved, needPush(saved, changed, oldToken, oldEnabled));
            }
            throw race;
        }
    }

    /** Đăng ký/cập nhật thiết bị theo deviceId (upsert), chỉ tạo bản ghi mới khi có sự kiện đăng nhập */
    private RegisterOutcome upsertByDeviceId(RegisterDeviceRequest request) {
        boolean loginEvent = Boolean.TRUE.equals(request.getLoginEvent());
        Optional<DeviceToken> existingOpt = deviceTokenRepository
                .findByMaTaiKhoanBnAndDeviceId(request.getMaTaiKhoanBn(), request.getDeviceId());
        if (existingOpt.isPresent()) {
            DeviceToken existing = existingOpt.get();
            String oldToken = existing.getFcmToken();
            Boolean oldEnabled = existing.getNotificationsEnabled();
            boolean changed = applyFields(existing, request);
            if (loginEvent) {
                existing.setLastLoginAt(LocalDateTime.now());
                deviceTokenRepository.deleteOtherDevices(
                        request.getMaTaiKhoanBn(), request.getDeviceId());
                changed = true;
            }
            DeviceToken saved = deviceTokenRepository.save(existing);
            return new RegisterOutcome(saved, needPush(saved, changed, oldToken, oldEnabled));
        }
        // Chua co dong: chi loginEvent=true moi duoc INSERT.
        if (!loginEvent) {
            log.info("Bo qua register loginEvent=false vi chua co dong user={}",
                    request.getMaTaiKhoanBn());
            return new RegisterOutcome(null, false);
        }
        DeviceToken token = new DeviceToken();
        token.setMaTaiKhoanBn(request.getMaTaiKhoanBn());
        token.setFcmToken(request.getFcmToken());
        token.setDeviceType(request.getDeviceType() != null ? request.getDeviceType() : "android");
        token.setDeviceId(request.getDeviceId());
        token.setDeviceName(request.getDeviceName());
        token.setOsVersion(request.getOsVersion());
        token.setAppVersion(request.getAppVersion());
        token.setNotificationsEnabled(
                request.getNotificationsEnabled() != null ? request.getNotificationsEnabled() : true);
        token.setLastLoginAt(LocalDateTime.now());
        DeviceToken saved = deviceTokenRepository.save(token);
        deviceTokenRepository.deleteOtherDevices(request.getMaTaiKhoanBn(), request.getDeviceId());
        return new RegisterOutcome(saved, needPush(saved, true, null, null));
    }

    /** Đăng ký thiết bị theo dạng cũ (chỉ có fcmToken, không có deviceId) */
    private RegisterOutcome registerLegacy(RegisterDeviceRequest request) {
        String fcmToken = request.getFcmToken();
        if (fcmToken == null) {
            log.warn("Bo qua register legacy vi thieu ca deviceId va fcmToken user={}",
                    request.getMaTaiKhoanBn());
            return new RegisterOutcome(null, false);
        }
        Optional<DeviceToken> existing = deviceTokenRepository
                .findByMaTaiKhoanBnAndFcmToken(request.getMaTaiKhoanBn(), fcmToken);
        if (existing.isPresent()) {
            return new RegisterOutcome(existing.get(), false);
        }
        DeviceToken token = new DeviceToken();
        token.setMaTaiKhoanBn(request.getMaTaiKhoanBn());
        token.setFcmToken(fcmToken);
        token.setDeviceType(request.getDeviceType() != null ? request.getDeviceType() : "android");
        token.setNotificationsEnabled(
                request.getNotificationsEnabled() != null ? request.getNotificationsEnabled() : true);
        token.setLastLoginAt(LocalDateTime.now());
        DeviceToken saved = deviceTokenRepository.save(token);
        return new RegisterOutcome(saved, isPushable(saved));
    }

    /** Xóa device token của bệnh nhân theo fcmToken */
    @Override
    @Transactional
    public void removeToken(Integer maTaiKhoanBn, String fcmToken) {
        deviceTokenRepository.deleteByMaTaiKhoanBnAndFcmToken(maTaiKhoanBn, fcmToken);
    }

    /** Xóa device token của bệnh nhân theo deviceId */
    @Override
    @Transactional
    public void removeTokenByDevice(Integer maTaiKhoanBn, String deviceId) {
        deviceTokenRepository.deleteByMaTaiKhoanBnAndDeviceId(maTaiKhoanBn, deviceId);
    }

    /** Xóa toàn bộ device token của bệnh nhân */
    @Override
    @Transactional
    public void removeAllTokens(Integer maTaiKhoanBn) {
        deviceTokenRepository.deleteByMaTaiKhoanBn(maTaiKhoanBn);
    }

    /** Máy nhận push duy nhất: dòng có last_login_at mới nhất của user */
    @Override
    public Optional<DeviceToken> getTargetDevice(Integer maTaiKhoanBn) {
        List<DeviceToken> rows = deviceTokenRepository.findByMaTaiKhoanBn(maTaiKhoanBn);
        if (rows == null || rows.isEmpty()) {
            return Optional.empty();
        }
        rows.sort(Comparator.comparing(DeviceToken::getLastLoginAt,
                Comparator.nullsFirst(Comparator.naturalOrder())).reversed());
        return Optional.of(rows.get(0));
    }

    /** Lấy danh sách device token của một bệnh nhân */
    @Override
    public List<DeviceToken> getTokensByUser(Integer maTaiKhoanBn) {
        return deviceTokenRepository.findByMaTaiKhoanBn(maTaiKhoanBn);
    }

    /** Lấy fcmToken đang hoạt động của máy nhận push chính của bệnh nhân */
    @Override
    public List<String> getActiveFcmTokens(Integer maTaiKhoanBn) {
        Optional<DeviceToken> target = getTargetDevice(maTaiKhoanBn);
        if (target.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        DeviceToken d = target.get();
        if (Boolean.TRUE.equals(d.getNotificationsEnabled())
                && d.getFcmToken() != null && !d.getFcmToken().isEmpty()) {
            return java.util.Collections.singletonList(d.getFcmToken());
        }
        return java.util.Collections.emptyList();
    }

    /** Lấy toàn bộ fcmToken đang hoạt động của tất cả thiết bị */
    @Override
    public List<String> getAllActiveFcmTokens() {
        return deviceTokenRepository.findAll()
                .stream()
                .map(DeviceToken::getFcmToken)
                .filter(t -> t != null && !t.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }

    /** Lấy toàn bộ bản ghi device token */
    @Override
    public List<DeviceToken> getAllTokens() {
        return deviceTokenRepository.findAll();
    }

    /** Lấy danh sách fcmToken rút gọn (30 ký tự đầu) để hiển thị */
    @Override
    public List<String> getAllFcmTokensPreview() {
        return deviceTokenRepository.findAll()
                .stream()
                .map(t -> {
                    String fcm = t.getFcmToken();
                    if (fcm == null) {
                        return "(null)";
                    }
                    return fcm.length() > 30 ? fcm.substring(0, 30) + "..." : fcm;
                })
                .collect(java.util.stream.Collectors.toList());
    }

    /** Cập nhật trạng thái thông báo của thiết bị, không có bản ghi (user, deviceId) thì bỏ qua, không insert */
    @Override
    @Transactional
    public DeviceToken updateNotificationStatus(Integer maTaiKhoanBn, String deviceId,
            Boolean notificationsEnabled, String fcmToken) {
        if (maTaiKhoanBn == null || deviceId == null) {
            throw new IllegalArgumentException("Thieu maTaiKhoanBn/deviceId");
        }
        Optional<DeviceToken> existing = deviceTokenRepository
                .findByMaTaiKhoanBnAndDeviceId(maTaiKhoanBn, deviceId);
        if (existing.isEmpty()) {
            log.info("Bo qua update notification-status vi chua co dong user={}", maTaiKhoanBn);
            return null;
        }
        DeviceToken target = existing.get();
        if (notificationsEnabled != null) {
            target.setNotificationsEnabled(notificationsEnabled);
        }
        if (fcmToken != null && !fcmToken.isEmpty()) {
            target.setFcmToken(fcmToken);
        } else if (Boolean.FALSE.equals(notificationsEnabled)) {
            target.setFcmToken(null);
        }
        return deviceTokenRepository.save(target);
    }

    /** Áp dụng các thuộc tính của request lên bản ghi device, trả về true nếu có thay đổi */
    private boolean applyFields(DeviceToken target, RegisterDeviceRequest request) {
        boolean changed = false;
        String nextToken = request.getFcmToken();
        if (nextToken != null || Boolean.FALSE.equals(request.getNotificationsEnabled())) {
            if (!eq(target.getFcmToken(), nextToken)) {
                target.setFcmToken(nextToken);
                changed = true;
            }
        }
        if (request.getDeviceType() != null && !request.getDeviceType().equals(target.getDeviceType())) {
            target.setDeviceType(request.getDeviceType());
            changed = true;
        }
        if (request.getDeviceName() != null && !request.getDeviceName().equals(target.getDeviceName())) {
            target.setDeviceName(request.getDeviceName());
            changed = true;
        }
        if (request.getOsVersion() != null && !request.getOsVersion().equals(target.getOsVersion())) {
            target.setOsVersion(request.getOsVersion());
            changed = true;
        }
        if (request.getAppVersion() != null && !request.getAppVersion().equals(target.getAppVersion())) {
            target.setAppVersion(request.getAppVersion());
            changed = true;
        }
        if (request.getNotificationsEnabled() != null
                && !request.getNotificationsEnabled().equals(target.getNotificationsEnabled())) {
            target.setNotificationsEnabled(request.getNotificationsEnabled());
            changed = true;
        }
        return changed;
    }

    /** So sánh hai giá trị có bằng nhau hay không, xử lý cả trường hợp null */
    private boolean eq(Object a, Object b) {
        return a == null ? b == null : a.equals(b);
    }

    /** Kiểm tra thiết bị có nhận được push hay không (đã bật thông báo và có fcmToken) */
    private boolean isPushable(DeviceToken d) {
        return d != null && Boolean.TRUE.equals(d.getNotificationsEnabled())
                && d.getFcmToken() != null && !d.getFcmToken().isEmpty();
    }

    /** Chỉ gửi push khi dòng pushable và (dòng mới / token đổi / enabled false->true) */
    private boolean needPush(DeviceToken saved, boolean changed, String oldToken, Boolean oldEnabled) {
        if (!changed || !isPushable(saved)) {
            return false;
        }
        if (oldToken == null && oldEnabled == null) {
            return true;
        }
        if (!eq(oldToken, saved.getFcmToken())) {
            return true;
        }
        return Boolean.FALSE.equals(oldEnabled)
                && Boolean.TRUE.equals(saved.getNotificationsEnabled());
    }
}
