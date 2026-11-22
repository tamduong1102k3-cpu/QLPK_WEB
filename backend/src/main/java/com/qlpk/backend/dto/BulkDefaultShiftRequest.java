package com.qlpk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDefaultShiftRequest {
    private Integer maNhanVien;
    private Integer nam;
    private Integer thang;
    private String thu;
    private Integer phong;
    private List<Integer> maCaIds;

    /**
     * Cờ bật/tắt chế độ cập nhật HÀNG LOẠT (toàn bộ ca mặc định cùng thứ trong tháng).
     * - updateAllThu = true  → áp dụng thay đổi cho TẤT CẢ bản ghi MAC_DINH cùng thứ trong tháng
     * - updateAllThu = null/false → chỉ thực hiện hành động nếu có cờ này mới được phép batch
     */
    private Boolean updateAllThu = false;
}
