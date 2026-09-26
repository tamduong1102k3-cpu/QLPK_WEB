package com.qlpk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDefaultShiftRequest {
    private Integer maNhanVien;
    private Integer nam;
    private Integer thang;
    private String thu;
    private Integer phong;
    private List<Integer> maCaIds;

    private Boolean updateAllThu = false;
}
