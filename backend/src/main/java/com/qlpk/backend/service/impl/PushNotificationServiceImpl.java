package com.qlpk.backend.service.impl;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import com.qlpk.backend.entity.DeviceToken;
import com.qlpk.backend.service.DeviceTokenService;
import com.qlpk.backend.service.PushNotificationService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Optional;

/**
 * dịch vụ gửi thông báo đẩy (push notification) qua Firebase Cloud
 * Messaging (FCM) tới thiết bị của bệnh nhân.
 *
 * 
 * - Firebase được khởi tạo lười (lazy) khi ứng dụng khởi động thông qua
 *   {@link #initialize()}; nếu không tìm thấy file service account hoặc khởi tạo
 *   thất bại thì dịch vụ vẫn khởi động bình thường, chỉ ghi log cảnh báo.
 * - Khi {@code firebase.enabled=false} (mặc định), mọi lệnh gửi đều bị bỏ qua
 *   và ghi log cảnh báo, giúp môi trường phát triển chạy được mà không cần
 *   cấu hình Firebase.
 * -mỗi bệnh nhân chỉ nhận
 *   thông báo trên máy có {@code last_login_at} mới nhất, không fallback sang máy cũ.
 * - Phân loại lỗi gửi thành token chết ({@code TOKEN_DEAD}) và lỗi tạm thời
 *

 */
@Service
public class PushNotificationServiceImpl implements PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationServiceImpl.class);

    @Autowired
    private DeviceTokenService deviceTokenService;

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @Value("${firebase.config.file:classpath:firebase-service-account.json}")
    private String firebaseConfigPath;

    @PostConstruct
    public void initialize() {
        if (!firebaseEnabled) {
            log.warn("Firebase is disabled. Push notifications will not be sent.");
            return;
        }
        try {
            // Lấy file service account từ resources
            ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
            if (!resource.exists()) {
                log.error("Firebase service account file not found at: {}. Push notifications disabled.", 
                         "resources/firebase-service-account.json");
                return;
            }
            
            InputStream serviceAccount = resource.getInputStream();
            
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

            // Kiểm tra nếu FirebaseApp đã được khởi tạo trước đó
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully!");
            } else {
                log.info("Firebase Admin SDK already initialized.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase Admin SDK: {}", e.getMessage());
        }
    }

    /**
     * Gửi một thông báo đẩy tới một thiết bị cụ thể qua FCM.
     *
     * Phương thức không ném lỗi ra ngoài: nếu Firebase đang tắt, token rỗng hoặc
     * gửi thất bại thì chỉ ghi log
     *
     * @param token  token FCM của thiết bị nhận thông báo; bị bỏ qua nếu {@code null} hoặc rỗng.
     * @param title  tiêu đề thông báo hiển thị trên thiết bị.
     * @param body   nội dung thông báo hiển thị trên thiết bị.
     */
    @Override
    public void sendNotification(String token, String title, String body) {
        if (!firebaseEnabled) {
            log.warn("Firebase is disabled. Cannot send notification to token: {}...",
                     preview(token));
            return;
        }
        if (token == null || token.isEmpty()) {
            log.info("Bỏ qua gửi push vì token null/rỗng.");
            return;
        }
        try {
            Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

            Message message = Message.builder()
                .setToken(token)
                .setNotification(notification)
                .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Notification sent successfully. Response: {}", response);
        } catch (Exception e) {
            log.error("Failed to send notification to token: {}. Error: {}",
                     preview(token),
                     e.getMessage());
        }
    }

    /**
     * Rút gọn token FCM để ghi log mà không làm lộ toàn bộ token.
     *
     * @param token
     * @return
     */
    private String preview(String token) {
        if (token == null) {
            return "(null)";
        }
        return token.length() > 20 ? token.substring(0, 20) + "..." : token;
    }

    /**
     * Gửi thông báo đẩy tới thiết bị đang hoạt động của bệnh nhân.
     *

     *
     * @param maTaiKhoanBn mã tài khoản bệnh nhân nhận thông báo.
     * @param title        tiêu đề thông báo.
     * @param body         nội dung thông báo.
     */
    @Override
    public void sendNotificationToUser(Integer maTaiKhoanBn, String title, String body) {
        sendFcmToUser(maTaiKhoanBn, title, body, null, null);
    }

    /**
     * Gửi thông báo đẩy hàng loạt tới nhiều thiết bị.

     *
     * @param tokens 
     * @param title  
     * @param body   
     * @return
     */
    @Override
    public int sendBatchNotification(List<String> tokens, String title, String body) {
        if (!firebaseEnabled) {
            log.warn("Firebase is disabled. Cannot send batch notification to {} tokens",
                    tokens == null ? 0 : tokens.size());
            return 0;
        }
        if (tokens == null || tokens.isEmpty()) {
            return 0;
        }
        int successCount = 0;
        for (String token : tokens) {
            if (token == null || token.isEmpty()) {
                continue;
            }
            if (sendSingle(token, title, body) == SendResult.SENT) {
                successCount++;
            }
        }
        log.info("Batch notification completed. Success: {}, Failed: {}", successCount, tokens.size() - successCount);
        return successCount;
    }

    /**
     * Kết quả phân loại của một lần gửi tới một token, dùng để phân biệt lỗi
     * khiến token không còn dùng được với lỗi tạm thời có thể gửi lại.
     */
    private enum SendResult {
        /** Gửi thành công. */
        SENT,
        /** Token không còn hợp lệ (đã bị thu hồi, sai định dạng hoặc sai project). */
        TOKEN_DEAD,
        /** Lỗi tạm thời (mạng, quá tải...), nên giữ token và thử gửi lại sau. */
        TRANSIENT
    }

    /**
     * Gửi thông báo tới một token và phân loại kết quả.
     *

     * @param token token FCM của thiết bị nhận thông báo.
     * @param title tiêu đề thông báo.
     * @param body  nội dung thông báo.
     * @return 
     *        
     */
    private SendResult sendSingle(String token, String title, String body) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();
            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(notification)
                    .build();
            FirebaseMessaging.getInstance().send(message);
            return SendResult.SENT;
        } catch (FirebaseMessagingException e) {
            MessagingErrorCode code = e.getMessagingErrorCode();
            log.error("Failed to send batch notification to token: {} ({})", preview(token), code);
            if (code == MessagingErrorCode.UNREGISTERED
                    || code == MessagingErrorCode.INVALID_ARGUMENT
                    || code == MessagingErrorCode.SENDER_ID_MISMATCH) {
                return SendResult.TOKEN_DEAD;
            }
            return SendResult.TRANSIENT;
        } catch (Exception e) {
            log.error("Failed to send batch notification to token: {}", e.getMessage());
            return SendResult.TRANSIENT;
        }
    }

    /**
     * Gửi thông báo đẩy FCM tới thiết bị đang hoạt động của một bệnh nhân.
     *
    
     *  chỉ máy có {@code last_login_at} mới nhất được nhận thông báo. Nếu máy đó đang tắt
     * thông báo hoặc thiếu token thì không gửi và không fallback sang
     * máy cũ.
     *

     *
     * Khi phát hiện token chết, dòng thiết bị tương ứng được giữ lại nhưng bị
     * xóa token và tắt cờ thông báo, để ứng dụng đăng ký lại token khi mở lại.
     *
     * @param maTaiKhoanBn 
     * @param title   
     * @param body      
     * @param referenceType
     * @param referenceId
     * @return 
     */
    @Override
    public boolean sendFcmToUser(Integer maTaiKhoanBn, String title, String body, String referenceType, Long referenceId) {
        if (!firebaseEnabled) {
            log.warn("Firebase is disabled. Cannot send FCM to user: {}", maTaiKhoanBn);
            return false;
        }

        // chỉ máy last_login_at mới nhất được nhận.
        // Máy đó enabled=false / token null -> KHÔNG gửi, KHÔNG fallback máy cũ.
        Optional<DeviceToken> target = deviceTokenService.getTargetDevice(maTaiKhoanBn);
        if (target.isEmpty()) {
            log.info("No device tokens found for user: {}. daGuiPush sẽ giữ = false để gửi bù sau.", maTaiKhoanBn);
            return false;
        }
        DeviceToken device = target.get();
        if (!Boolean.TRUE.equals(device.getNotificationsEnabled())
                || device.getFcmToken() == null || device.getFcmToken().isEmpty()) {
            log.info("Máy active của user {} đang tắt thông báo hoặc thiếu token -> không gửi, giữ daGuiPush=false.",
                    maTaiKhoanBn);
            return false;
        }
        SendResult result = sendSingle(device.getFcmToken(), title, body);
        if (result == SendResult.SENT) {
            return true;
        }
        if (result == SendResult.TOKEN_DEAD) {
            // Token chết: giữ dòng (còn thông tin máy active), chỉ null token + tắt cờ.
            // App sẽ đăng ký lại token khi mở lại. daGuiPush giữ false để gửi bù sau.
            log.warn("Token chết, vô hiệu hóa dòng device user={} để app đăng ký lại.",
                    device.getMaTaiKhoanBn());
            try {
                deviceTokenService.updateNotificationStatus(
                        device.getMaTaiKhoanBn(), device.getDeviceId(), false, null);
            } catch (Exception saveErr) {
                log.warn("Không lưu được trạng thái token chết: {}", saveErr.getMessage());
            }
        }
        // Trả true chỉ khi có ít nhất 1 lần gửi thật sự thành công.
        return false;
    }
}