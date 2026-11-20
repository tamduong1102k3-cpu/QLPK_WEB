package com.qlpk.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DichVuRequestDTO {
    @NotBlank(message = "Tên không được để trống")
    @Size(min = 2, max = 200, message = "Tên phải từ 2 đến 200 ký tự")
    private String tenDichVu;

    @NotNull(message = "Không được để trống")
    @Min(value = 0, message = "Giá tiền không được âm")
    private BigDecimal donGia;

    private String loaiDichVu;
    private Integer maChuyenKhoa;
    private Integer maNhomDichVu;
    private Long version;

    public void setTenDichVu(String tenDichVu) {
        this.tenDichVu = tenDichVu == null ? null : tenDichVu.trim();
    }
}
