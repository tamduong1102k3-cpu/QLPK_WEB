package com.qlpk.backend.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class LichThangDTO {
    private Integer maNhanVien;
    private int nam;
    private int thang;
    private List<NgayCaLamDTO> days = new ArrayList<>();
}
