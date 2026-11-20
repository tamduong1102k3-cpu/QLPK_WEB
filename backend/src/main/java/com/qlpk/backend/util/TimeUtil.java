package com.qlpk.backend.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

/**
 * Utility class tập trung xử lý thời gian.
 * 
 * ⚠️ TUYỆT ĐỐI KHÔNG dùng LocalDate.now() trực tiếp trong business logic.
 * Luôn gọi qua class này để đảm bảo nhất quán timezone.
 */
public final class TimeUtil {
    
    private static final ZoneId ZONE_ID = ZoneId.of("Asia/Ho_Chi_Minh");
    
    private TimeUtil() {
        // Private constructor, không cho khởi tạo
    }
    
    /**
     * Lấy ngày hiện tại theo giờ Việt Nam.
     * Dùng cho mọi nơi cần lấy ngày hiện tại.
     */
    public static LocalDate today() {
        return LocalDate.now(ZONE_ID);
    }
    
    /**
     * Lấy thời điểm hiện tại theo giờ Việt Nam.
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE_ID);
    }

    /**
     * Lấy giờ hiện tại theo giờ Việt Nam.
     */
    public static LocalTime nowTime() {
        return LocalTime.now(ZONE_ID);
    }
}