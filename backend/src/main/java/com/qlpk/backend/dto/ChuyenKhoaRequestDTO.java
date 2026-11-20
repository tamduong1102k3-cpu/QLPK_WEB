package com.qlpk.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChuyenKhoaRequestDTO {
    @NotBlank(message = "Tên không được để trống")
    @Size(min = 2, max = 200, message = "Tên phải từ 2 đến 200 ký tự")
    private String tenChuyenKhoa;

    private String moTa;

    @Min(value = 0, message = "Số lượng tối đa không được âm")
    private Integer soLuongToiDa;

    public void setTenChuyenKhoa(String tenChuyenKhoa) {
        this.tenChuyenKhoa = tenChuyenKhoa == null ? null : tenChuyenKhoa.trim();
    }
}
