package com.qlpk.backend.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "giao_dich_thanh_toan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiaoDichThanhToan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_giao_dich")
    private Integer maGiaoDich;

    @Column(name = "ma_hoa_don", nullable = false)
    private Integer maHoaDon;

    @Column(name = "provider", length = 20)
    private String provider;

    @Column(name = "order_id", length = 100)
    private String orderId;

    @Column(name = "request_id", length = 100)
    private String requestId;

    @Column(name = "trans_id", length = 100)
    private String transId;

    @Column(name = "so_tien", precision = 15, scale = 2)
    private BigDecimal soTien;

    @Column(name = "trang_thai", length = 30)
    private String trangThai;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
