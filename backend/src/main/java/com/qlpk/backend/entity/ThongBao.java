package com.qlpk.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "thong_bao")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThongBao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Bảng thong_bao lưu theo ma_tai_khoan (ma_tai_khoan của tài khoản bệnh nhân)
    @Column(name = "ma_tai_khoan", nullable = false)
    private Integer maTaiKhoan;

    @Column(name = "loai_nguoi_nhan", nullable = false, length = 50)
    private String loaiNguoiNhan;

    @Column(name = "tieu_de", nullable = false, length = 255)
    private String tieuDe;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id", length = 50)
    private String referenceId;

    /**
     * Loại sự kiện của thông báo (chuẩn hóa).
     * Ví dụ: LICH_KHAM_CREATED, PAYMENT_SUCCESS, SYSTEM_NOTIFICATION, ...
     * Dùng để phân biệt các sự kiện khác nhau trên cùng referenceType + referenceId.
     */
    @Column(name = "event_type", length = 50)
    private String eventType;

    @Column(name = "da_doc", nullable = false)
    private Boolean daDoc = false;

    /**
     * Trạng thái đã gửi Push Notification.
     * 0 = Chưa từng gửi Push (chưa có FCM token hoặc gửi thất bại).
     * 1 = Đã gửi Push Notification thành công.
     */
    @Column(name = "da_gui_push", nullable = false)
    private Boolean daGuiPush = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}