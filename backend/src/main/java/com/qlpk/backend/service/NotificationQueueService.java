package com.qlpk.backend.service;

import java.util.Map;

public interface NotificationQueueService {

    /**
    
     *    - Thành công: SENT + daGuiPush = true
     *    - Thất bại: retry_count < 3 → PENDING (retry sau), >= 3 → FAILED
     *
     * @return Map chứa: processed (số item đã xử lý), sent (số gửi thành công), failed (số lỗi)
     */
    Map<String, Integer> processQueue();
}