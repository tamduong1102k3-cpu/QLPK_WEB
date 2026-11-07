package com.qlpk.backend.entity;


public enum EventType {
    /** Đặt lịch khám qua app (POST /api/lich-kham) */
    LICH_KHAM_CREATED,

    /** Đổi / cập nhật lịch khám */
    LICH_KHAM_UPDATED,

    /** Hủy lịch khám */
    LICH_KHAM_CANCELLED,

    /** Scheduler nhắc lịch khám (0 0 7 * * ?) */
    LICH_KHAM_REMINDER,

    /** Bác sĩ tạo lịch tái khám (POST /api/appointments) */
    LICH_TAI_KHAM_CREATED,

    /** Thu ngân thanh toán hóa đơn (HoaDonService.thanhToan) */
    PAYMENT_SUCCESS,

    /** Thanh toán thành công qua VNPAY (processPaymentReturn / processPaymentIpn) */
    PAYMENT_VNPAY_SUCCESS,

    /** Có kết quả xét nghiệm / cận lâm sàng mới cho bệnh nhân */
    TEST_RESULT_AVAILABLE,

    /** Thông báo hệ thống tạo qua API (POST /api/thong-bao) */
    SYSTEM_NOTIFICATION
}