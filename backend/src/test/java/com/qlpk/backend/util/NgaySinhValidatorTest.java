package com.qlpk.backend.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class NgaySinhValidatorTest {

    private static final String REQUIRED_ERROR = "Vui lòng chọn ngày sinh.";
    private static final String CURRENT_DATE_ERROR = "Ngày sinh phải nhỏ hơn ngày hiện tại.";
    private static final String INVALID_DATE_ERROR =
            "Ngày sinh không hợp lệ (năm sinh phải từ 1900 trở về sau).";

    @Test
    void requiresBirthDateWhenConfigured() {
        assertEquals(REQUIRED_ERROR,
                NgaySinhValidator.validate(null, true, LocalDate.of(2026, 11, 22)));
        assertNull(NgaySinhValidator.validate(null, false, LocalDate.of(2026, 11, 22)));
    }

    @Test
    void rejectsTodayAndFutureButAcceptsYesterday() {
        LocalDate today = LocalDate.of(2026, 11, 22);
        assertEquals(CURRENT_DATE_ERROR, NgaySinhValidator.validate(today, true, today));
        assertEquals(CURRENT_DATE_ERROR, NgaySinhValidator.validate(today.plusDays(1), true, today));
        assertNull(NgaySinhValidator.validate(today.minusDays(1), true, today));
    }

    @Test
    void enforcesMinimumYearAndMaximumAge() {
        assertEquals(INVALID_DATE_ERROR,
                NgaySinhValidator.validate(LocalDate.of(1899, 12, 31), true, LocalDate.of(2026, 11, 22)));
        assertNull(NgaySinhValidator.validate(
                LocalDate.of(1901, 1, 2), true, LocalDate.of(2031, 1, 2)));
        assertEquals(INVALID_DATE_ERROR,
                NgaySinhValidator.validate(
                        LocalDate.of(1900, 1, 1), true, LocalDate.of(2031, 1, 2)));
    }
}
