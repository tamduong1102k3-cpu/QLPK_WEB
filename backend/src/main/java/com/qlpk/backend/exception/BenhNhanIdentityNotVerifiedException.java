package com.qlpk.backend.exception;

public class BenhNhanIdentityNotVerifiedException extends RuntimeException {
    public BenhNhanIdentityNotVerifiedException() {
        super("Bệnh nhân chưa xác minh danh tính. Vui lòng kiểm tra thông tin và xác minh CCCD trước khi tiếp đón.");
    }
}
