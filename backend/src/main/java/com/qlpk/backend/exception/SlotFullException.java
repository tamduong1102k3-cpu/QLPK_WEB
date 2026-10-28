package com.qlpk.backend.exception;

/**
 * Exception nghiệp vụ: chuyên khoa đã hết lượt khám trong ngày.
 * Được xử lý bởi GlobalExceptionHandler → trả HTTP 409 kèm errorCode = "SLOT_FULL".
 */
public class SlotFullException extends RuntimeException {

    public SlotFullException(String message) {
        super(message);
    }
}