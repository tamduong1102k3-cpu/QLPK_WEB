package com.qlpk.backend.config;

import com.qlpk.backend.dto.ErrorResponse;
import com.qlpk.backend.exception.SlotFullException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.LockTimeoutException;
import jakarta.persistence.PessimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String, Object>> handleNullPointer(NullPointerException ex) {
        // WAVE 2b-4: log chi tiết NPE để debug lần sau (ví dụ getHoSo(100) chỉ có "null").
        // log.error(msg, ex) in full stack trace; thêm dòng message + first 5 frames để grep nhanh.
        StackTraceElement[] st = ex.getStackTrace();
        StringBuilder firstFrames = new StringBuilder();
        if (st != null) {
            for (int i = 0; i < Math.min(5, st.length); i++) {
                firstFrames.append("\n    at ").append(st[i].toString());
            }
        }
        log.error("NPE chi tiết: type=[{}], message=[{}], firstFrames={}",
                ex.getClass().getName(), ex.getMessage(), firstFrames.toString(), ex);
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Lỗi hệ thống không xác định (NullPointer)");
        body.put("error", "NullPointerException");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        // WAVE 2b-4: log full stack trace (trước đây chỉ log message nên NPE "null" không debug được).
        log.error("Unhandled exception [{}]: {}", ex.getClass().getName(), ex.getMessage(), ex);
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Lỗi hệ thống không xác định");
        body.put("error", ex.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Lỗi dữ liệu: " + (ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage()));
        body.put("error", "DATA_INTEGRITY_ERROR");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(SlotFullException.class)
    public ResponseEntity<ErrorResponse> handleSlotFull(SlotFullException ex) {
        log.warn("Slot full conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("SLOT_FULL", ex.getMessage()));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLocking(ObjectOptimisticLockingFailureException ex) {
        log.warn("Optimistic locking conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("VERSION_CONFLICT",
                        "Dữ liệu đã được người dùng khác cập nhật. Vui lòng tải lại dữ liệu mới nhất."));
    }

    // lock timeout (quá 3000ms): trả 409 + message thân thiện, ko trả 500 chung
    @ExceptionHandler({PessimisticLockException.class, LockTimeoutException.class})
    public ResponseEntity<ErrorResponse> handleLockTimeout(Exception ex) {
        log.warn("Pessimistic lock timeout: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("LOCK_TIMEOUT",
                        "Lịch khám đang được người khác chỉnh sửa, vui lòng thử lại."));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDataAccessException(DataAccessException ex) {
        log.error("Database access error: ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Lỗi truy xuất dữ liệu: " + (ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage()));
        body.put("error", "DATABASE_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(EntityNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Không tìm thấy dữ liệu yêu cầu");
        body.put("error", "NOT_FOUND");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Dữ liệu không hợp lệ");
        body.put("error", "VALIDATION_ERROR");
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> 
            fieldErrors.put(err.getField(), err.getDefaultMessage())
        );
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage() != null ? ex.getMessage() : "Tham số không hợp lệ");
        body.put("error", "BAD_REQUEST");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Request thiếu param bắt buộc → 400 (thay vì 500).
     * VD: /api/benh-nhan/exact-match thiếu cccd.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(
            MissingServletRequestParameterException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                "message", "Thiếu tham số: " + ex.getParameterName(),
                "error", "MISSING_PARAMETER"
            ));
    }

    /**
     * Param sai kiểu (String → Integer) → 400 (thay vì 500).
     * VD: /api/benh-nhan/abc (id phải Integer).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                "message", "Tham số không hợp lệ: " + ex.getName(),
                "error", "INVALID_PARAMETER_TYPE"
            ));
    }

    /**
     * Xử lý request vào path không tồn tại (404 thay vì 500).
     * Nguyên nhân: catch-all Exception.class nuốt NoResourceFoundException.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResource(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of(
                "message", "Endpoint không tồn tại",
                "error", "NOT_FOUND"
            ));
    }
}