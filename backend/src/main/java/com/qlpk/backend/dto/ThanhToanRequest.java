package com.qlpk.backend.dto;

import java.math.BigDecimal;

public class ThanhToanRequest {
    private Integer maNhanVien;
    private String phuongThuc;
    private BigDecimal soTienNhan;

    public Integer getMaNhanVien() { return maNhanVien; }
    public void setMaNhanVien(Integer maNhanVien) { this.maNhanVien = maNhanVien; }
    public String getPhuongThuc() { return phuongThuc; }
    public void setPhuongThuc(String phuongThuc) { this.phuongThuc = phuongThuc; }
    public BigDecimal getSoTienNhan() { return soTienNhan; }
    public void setSoTienNhan(BigDecimal soTienNhan) { this.soTienNhan = soTienNhan; }
}