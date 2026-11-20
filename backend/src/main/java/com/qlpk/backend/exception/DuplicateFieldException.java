package com.qlpk.backend.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class DuplicateFieldException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public DuplicateFieldException(Map<String, String> fieldErrors) {
        super("Dữ liệu đã tồn tại, vui lòng kiểm tra lại.");
        this.fieldErrors = Collections.unmodifiableMap(new LinkedHashMap<>(fieldErrors));
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
