package com.qlpk.backend.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

public final class TimeUtil {

    private static final ZoneId ZONE_ID = ZoneId.of("Asia/Ho_Chi_Minh");

    private TimeUtil() {

    }

    public static LocalDate today() {
        return LocalDate.now(ZONE_ID);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE_ID);
    }

    public static LocalTime nowTime() {
        return LocalTime.now(ZONE_ID);
    }
}
