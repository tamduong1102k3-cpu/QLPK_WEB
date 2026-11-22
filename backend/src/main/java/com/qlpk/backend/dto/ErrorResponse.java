package com.qlpk.backend.dto;

/**
 * Cấu trúc response lỗi nghiệp vụ dùng chung.
 * Serialize thành JSON: { "errorCode": "...", "message": "..." } (Jackson mặc định camelCase).
 */
public record ErrorResponse(String errorCode, String message) {
}