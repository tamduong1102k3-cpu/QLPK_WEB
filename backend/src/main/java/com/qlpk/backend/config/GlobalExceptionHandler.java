package com.qlpk.backend.config;

import com.qlpk.backend.dto.ErrorResponse;
import com.qlpk.backend.exception.DuplicateFieldException;
import com.qlpk.backend.exception.BenhNhanValidationException;
import com.qlpk.backend.exception.DichVuValidationException;
import com.qlpk.backend.exception.NhanVienDeletionException;
import com.qlpk.backend.exception.NhanVienValidationException;
import com.qlpk.backend.exception.PhongChucNangValidationException;
import com.qlpk.backend.exception.SlotFullException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.LockTimeoutException;
import jakarta.persistence.PessimisticLockException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DuplicateFieldException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateField(DuplicateFieldException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", ex.getMessage());
        body.put("fieldErrors", ex.getFieldErrors());
        body.put("error", "DUPLICATE_FIELD");
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(BenhNhanValidationException.class)
    public ResponseEntity<ErrorResponse> handleBenhNhanValidation(BenhNhanValidationException ex) {
        log.warn("Patient registration validation failed: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("BENH_NHAN_VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(DichVuValidationException.class)
    public ResponseEntity<ErrorResponse> handleDichVuValidation(DichVuValidationException ex) {
        log.warn("Service validation failed: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("DICH_VU_VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(NhanVienValidationException.class)
    public ResponseEntity<ErrorResponse> handleNhanVienValidation(NhanVienValidationException ex) {
        log.warn("Employee date validation failed: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("NHAN_VIEN_VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(PhongChucNangValidationException.class)
    public ResponseEntity<ErrorResponse> handlePhongChucNangValidation(PhongChucNangValidationException ex) {
        log.warn("Functional room capacity validation failed: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("PHONG_CHUC_NANG_VALIDATION_ERROR", ex.getMessage()));
    }

    @ExceptionHandler(NhanVienDeletionException.class)
    public ResponseEntity<ErrorResponse> handleNhanVienDeletion(NhanVienDeletionException ex) {
        log.warn("Employee deletion rejected: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("NHAN_VIEN_DELETION_CONFLICT", ex.getMessage()));
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String, Object>> handleNullPointer(NullPointerException ex) {
  
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
        body.put("message", "Lỗi hệ thống, vui lòng thử lại sau.");
        body.put("error", "NullPointerException");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(
            Exception ex, HttpServletRequest request, HttpServletResponse response) {

        log.error("Unhandled exception on {} {} (Accept={}, existingResponseContentType={}): [{}]: {}",
                request.getMethod(),
                request.getRequestURI(),
                request.getHeader("Accept"),
                response.getContentType(),
                ex.getClass().getName(),
                ex.getMessage(),
                ex);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Lỗi hệ thống, vui lòng thử lại sau.");
        body.put("error", "Lỗi hệ thống");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

     @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: ", ex);
         return dataIntegrityResponse(ex);
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
        Map<String, String> fieldErrors = getDataIntegrityFieldErrors(ex);
        if (fieldErrors != null) {
            return dataIntegrityResponse(ex);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Lỗi truy xuất dữ liệu. Vui lòng thử lại sau.");
        body.put("error", "DATABASE_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private ResponseEntity<Map<String, Object>> dataIntegrityResponse(Throwable exception) {
        Map<String, Object> body = new HashMap<>();
        Map<String, String> fieldErrors = getDataIntegrityFieldErrors(exception);
        body.put("message", fieldErrors != null
                ? "Dữ liệu đã tồn tại, vui lòng kiểm tra lại."
                : "Dữ liệu không hợp lệ hoặc đã tồn tại.");
        body.put("error", "DATA_INTEGRITY_ERROR");
        if (fieldErrors != null && !fieldErrors.isEmpty()) {
            body.put("fieldErrors", fieldErrors);
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    private Map<String, String> getDataIntegrityFieldErrors(Throwable exception) {
        StringBuilder messages = new StringBuilder();
        Throwable cause = exception;
        while (cause != null) {
            if (cause.getMessage() != null) {
                messages.append(' ').append(cause.getMessage());
            }
            if (cause.getCause() == cause) {
                break;
            }
            cause = cause.getCause();
        }
        if (messages.length() == 0) {
            return null;
        }

        String normalizedCause = messages.toString().toLowerCase(Locale.ROOT);
        boolean constraintFailure = normalizedCause.contains("duplicate")
                || normalizedCause.contains("unique")
                || normalizedCause.contains("uk_")
                || normalizedCause.contains("unq_");
        if (!constraintFailure) {
            return null;
        }

        Map<String, String> fieldErrors = new HashMap<>();
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "cccd",
                "unique_cccd", "unq_cccd", "cccd", "cmnd");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "email",
                "unique_email", "unq_email", "email");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "soDienThoai",
                "unique_sdt", "unq_sdt", "so_dien_thoai", "sdt", "phone");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "username",
                "username", "user_name", "ten_dang_nhap");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "tenCa",
                "uk_ten_ca", "ten_ca");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "tenPhong", "ten_phong");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "tenChuyenKhoa", "ten_chuyen_khoa");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "tenDichVu", "ten_dich_vu");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "tenThuoc", "ten_thuoc");
        addFieldErrorIfMatched(fieldErrors, normalizedCause, "maBenhNhan", "ma_benh_nhan");
        return fieldErrors;
    }

    private void addFieldErrorIfMatched(
            Map<String, String> fieldErrors, String cause, String field, String... tokens) {
        for (String token : tokens) {
            if (cause.contains(token)) {
                fieldErrors.put(field, duplicateMessage(field));
                return;
            }
        }
    }

    private String duplicateMessage(String field) {
        switch (field) {
            case "cccd":
                return "Số CCCD đã tồn tại";
            case "email":
                return "Email đã tồn tại";
            case "soDienThoai":
                return "Số điện thoại đã tồn tại";
            case "username":
                return "Tên đăng nhập đã tồn tại";
            case "tenCa":
                return "Tên ca đã tồn tại";
            case "tenPhong":
                return "Tên phòng đã tồn tại";
            case "tenChuyenKhoa":
                return "Tên chuyên khoa đã tồn tại";
            case "tenDichVu":
                return "Tên dịch vụ đã tồn tại";
            case "tenThuoc":
                return "Tên thuốc đã tồn tại";
            case "maBenhNhan":
                return "Hồ sơ bệnh nhân đã được liên kết với tài khoản khác";
            default:
                return "Dữ liệu đã tồn tại";
        }
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(EntityNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Không tìm thấy dữ liệu yêu cầu");
        body.put("error", "NOT_FOUND");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Dữ liệu không hợp lệ");
        body.put("message", message);
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
        body.put("message", "Tham số không hợp lệ");
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