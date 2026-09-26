package com.qlpk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DoctorScheduleSummaryDTO {
    private Integer maNhanVien;
    private List<String> dsThu;
}
