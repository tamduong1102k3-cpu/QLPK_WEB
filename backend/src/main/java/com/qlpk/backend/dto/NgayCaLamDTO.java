package com.qlpk.backend.dto;

import com.qlpk.backend.entity.BangPhanCongCaLam;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class NgayCaLamDTO {
    private String ngay;            // yyyy-MM-dd
    private String thu;             // "Thứ 2" ... "Chủ Nhật"
    private List<BangPhanCongCaLam> macDinh = new ArrayList<>();
    private List<BangPhanCongCaLam> theoNgay = new ArrayList<>();
    private List<BangPhanCongCaLam> resolved = new ArrayList<>();
}
