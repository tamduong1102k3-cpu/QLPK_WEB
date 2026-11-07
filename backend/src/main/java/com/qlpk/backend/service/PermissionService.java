package com.qlpk.backend.service;

/**
 * Service kiểm tra quyền real-time từ database
 * Dùng cho các tác vụ nhạy cảm (thanh toán, thay đổi quyền...)
 * Tránh tình trạng dùng role cũ từ JWT chưa hết hạn
 */
public interface PermissionService {

    /**
     * Kiểm tra user có role hợp lệ từ database hay không
     * @param username tên đăng nhập
     * @param allowedRoles danh sách role được phép (vd: "THU_NGAN", "QUAN_TRI_VIEN")
     * @return true nếu role hiện tại trong DB nằm trong danh sách allowedRoles
     */
    boolean hasRole(String username, String... allowedRoles);

    /**
     * Lấy role hiện tại của user từ database
     * @param username tên đăng nhập
     * @return role string (vd: "THU_NGAN", "QUAN_TRI_VIEN") hoặc null nếu không tìm thấy
     */
    String getCurrentRole(String username);
}