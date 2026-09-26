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

    @Column(name = "event_type", length = 50)
    private String eventType;

    @Column(name = "da_doc", nullable = false)
    private Boolean daDoc = false;

    @Column(name = "da_gui_push", nullable = false)
    private Boolean daGuiPush = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
