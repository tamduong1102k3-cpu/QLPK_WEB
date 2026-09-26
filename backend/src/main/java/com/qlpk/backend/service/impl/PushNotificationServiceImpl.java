package com.qlpk.backend.service.impl;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
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

    @Override
    public void sendNotification(String token, String title, String body) {
        if (!firebaseEnabled) {
            log.warn("Firebase is disabled. Cannot send notification to token: {}...", 
                     token.length() > 20 ? token.substring(0, 20) : token);
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
                     token.length() > 20 ? token.substring(0, 20) + "..." : token, 
                     e.getMessage());
        }
    }

    @Override
    public void sendNotificationToUser(Integer maTaiKhoanBn, String title, String body) {
        sendFcmToUser(maTaiKhoanBn, title, body, null, null);
    }

    @Override
    public int sendBatchNotification(List<String> tokens, String title, String body) {
        if (!firebaseEnabled) {
            log.warn("Firebase is disabled. Cannot send batch notification to {} tokens", tokens.size());
            return 0;
        }
        int successCount = 0;
        for (String token : tokens) {
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
                successCount++;
            } catch (Exception e) {
                log.error("Failed to send batch notification to token: {}", e.getMessage());
            }
        }
        log.info("Batch notification completed. Success: {}, Failed: {}", successCount, tokens.size() - successCount);
        return successCount;
    }

    @Override
    public boolean sendFcmToUser(Integer maTaiKhoanBn, String title, String body, String referenceType, Long referenceId) {
        if (!firebaseEnabled) {
            log.warn("Firebase is disabled. Cannot send FCM to user: {}", maTaiKhoanBn);
            return false;
        }

        List<String> tokens = deviceTokenService.getActiveFcmTokens(maTaiKhoanBn);
        if (tokens.isEmpty()) {
            log.info("No device tokens found for user: {}. daGuiPush sẽ giữ = false để gửi bù sau.", maTaiKhoanBn);
            return false;
        }
        int sent = sendBatchNotification(tokens, title, body);

        return sent > 0;
    }
}
