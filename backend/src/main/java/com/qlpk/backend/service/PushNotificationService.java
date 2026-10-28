package com.qlpk.backend.service;

public interface PushNotificationService {
    void sendNotification(String token, String title, String body);
    void sendNotificationToUser(Integer maTaiKhoanBn, String title, String body);

    /**
     * Gửi batch notification. Trả về số token gửi thành công.
     */
    int sendBatchNotification(java.util.List<String> tokens, String title, String body);
    
    /**
     * Chỉ gửi FCM push notification đến thiết bị của user, KHÔNG lưu DB.
     * Việc lưu DB được xử lý bởi ThongBaoService.createThongBao().
     *
     * @return true nếu có device token và gửi FCM thành công; false nếu không có token hoặc lỗi.
     */
    boolean sendFcmToUser(Integer maTaiKhoanBn, String title, String body, String referenceType, Long referenceId);
}
