package com.qlpk.backend.payment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent {
    private Integer maHoaDon;
    private String trangThai;
    private String message;

    public PaymentEvent(Integer maHoaDon, String trangThai) {
        this.maHoaDon = maHoaDon;
        this.trangThai = trangThai;
    }
}