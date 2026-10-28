package com.qlpk.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity quản lý hạn mức khám bệnh theo ngày cho từng phòng chức năng.
 *
 * Không giữ chỗ khi tạo lịch hẹn. Slot chỉ được tăng khi tạo một đăng ký khám bệnh
 * mới trong cùng transaction, với kiểm tra chống race condition theo (ma_phong, ngay).
 */
@Entity
@IdClass(HanMucNgayId.class)
@Table(name = "han_muc_ngay")
public class HanMucNgay {

    @Id
    @Column(name = "ma_phong", nullable = false)
    private Integer maPhong;

    @Id
    @Column(name = "ngay", nullable = false)
    private LocalDate ngay;

    @Column(name = "so_da_dat", nullable = false)
    private Integer soDaDat = 0;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    @PrePersist
    protected void onCreate() {
        ngayCapNhat = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
    }

    public Integer getMaPhong() {
        return maPhong;
    }

    public void setMaPhong(Integer maPhong) {
        this.maPhong = maPhong;
    }

    public LocalDate getNgay() {
        return ngay;
    }

    public void setNgay(LocalDate ngay) {
        this.ngay = ngay;
    }

    public Integer getSoDaDat() {
        return soDaDat;
    }

    public void setSoDaDat(Integer soDaDat) {
        this.soDaDat = soDaDat;
    }

    public LocalDateTime getNgayCapNhat() {
        return ngayCapNhat;
    }

    public void setNgayCapNhat(LocalDateTime ngayCapNhat) {
        this.ngayCapNhat = ngayCapNhat;
    }
}