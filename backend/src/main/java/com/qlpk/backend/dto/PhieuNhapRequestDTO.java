package com.qlpk.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PhieuNhapRequestDTO {
    @NotNull(message = "Nhân viên nhập không được để trống")
    private Integer maNhanVienNhap;

    @NotNull(message = "Nhà cung cấp không được để trống")
    private Integer maNhaCungCap;

    private BigDecimal tongTienNhap;
    private String ghiChu;

    @NotEmpty(message = "Phiếu nhập phải có ít nhất một loại thuốc")
    @Valid
    private List<ChiTietPhieuNhapRequestDTO> chiTiet;

    @Data
    public static class ChiTietPhieuNhapRequestDTO {
        @NotNull(message = "Thuốc không được để trống")
        private Integer maThuoc;

        @NotNull(message = "Không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        private Integer soLuongNhap;

        @NotNull(message = "Không được để trống")
        @Min(value = 0, message = "Giá tiền không được âm")
        private BigDecimal donGiaNhap;

        private Integer maNcc;
    }
}
