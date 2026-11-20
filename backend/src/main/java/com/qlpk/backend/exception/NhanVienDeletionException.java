package com.qlpk.backend.exception;

public class NhanVienDeletionException extends RuntimeException {
    public NhanVienDeletionException(String message) {
        super(message);
    }

    public NhanVienDeletionException(String message, Throwable cause) {
        super(message, cause);
    }
}
