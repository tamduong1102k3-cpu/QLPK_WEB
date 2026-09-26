package com.qlpk.backend.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class HanMucNgayId implements Serializable {

    private Integer maPhong;
    private LocalDate ngay;

    public HanMucNgayId() {
    }

    public HanMucNgayId(Integer maPhong, LocalDate ngay) {
        this.maPhong = maPhong;
        this.ngay = ngay;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HanMucNgayId that = (HanMucNgayId) o;
        return Objects.equals(maPhong, that.maPhong) &&
                Objects.equals(ngay, that.ngay);
    }

    @Override
    public int hashCode() {
        return Objects.hash(maPhong, ngay);
    }
}
