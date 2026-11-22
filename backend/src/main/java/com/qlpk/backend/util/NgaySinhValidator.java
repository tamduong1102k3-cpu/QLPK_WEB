package com.qlpk.backend.util;

import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;

public final class NgaySinhValidator {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate EARLIEST_BIRTH_DATE = LocalDate.of(1900, 1, 1);

    private NgaySinhValidator() {
    }

    public static String validate(LocalDate ngaySinh, boolean required) {
        return validate(ngaySinh, required, LocalDate.now(VIETNAM_ZONE));
    }

    static String validate(LocalDate ngaySinh, boolean required, LocalDate today) {
        if (ngaySinh == null) {
            return required ? "Vui lòng chọn ngày sinh." : null;
        }

        if (!ngaySinh.isBefore(today)) {
            return "Ngày sinh phải nhỏ hơn ngày hiện tại.";
        }
        if (ngaySinh.isBefore(EARLIEST_BIRTH_DATE)
                || Period.between(ngaySinh, today).getYears() > 130) {
            return "Ngày sinh không hợp lệ (năm sinh phải từ 1900 trở về sau).";
        }
        return null;
    }
}
