package com.qlpk.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.YearMonth;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhanCaMacDinhDenCuoiNamRequest {
    private Integer maNhanVien;

    @JsonFormat(pattern = "yyyy-MM")
    private YearMonth thangBatDau;

    private String thu;
    private Integer phong;
    private List<Integer> danhSachMaCa;
}
