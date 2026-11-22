package com.qlpk.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ThuocRequestDTO {
    @NotBlank(message = "Tên không được để trống")
    @Size(min = 2, max = 200, message = "Tên phải từ 2 đến 200 ký tự")
    private String tenThuoc;

    private String hoatChat;
    private String hamLuong;
    private String dangThuoc;
    private String loaiThuoc;
    private String donViTinh;

    @NotNull(message = "Không được để trống")
    @Min(value = 0, message = "Giá tiền không được âm")
    private BigDecimal donGiaNhap;

    @NotNull(message = "Không được để trống")
    @Min(value = 0, message = "Giá tiền không được âm")
    private BigDecimal donGiaBan;

    private LocalDate ngaySanXuat;
    private LocalDate hanSuDung;
    private String nhaSanXuat;
    private String nuocSanXuat;
    private String ghiChu;
    private Long version;

    public void setTenThuoc(String tenThuoc) {
        this.tenThuoc = tenThuoc == null ? null : tenThuoc.trim();
    }
}
