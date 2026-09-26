package com.qlpk.backend.service;

public interface PushNotificationService {
    void sendNotification(String token, String title, String body);
    void sendNotificationToUser(Integer maTaiKhoanBn, String title, String body);

    int sendBatchNotification(java.util.List<String> tokens, String title, String body);

    boolean sendFcmToUser(Integer maTaiKhoanBn, String title, String body, String referenceType, Long referenceId);
}
