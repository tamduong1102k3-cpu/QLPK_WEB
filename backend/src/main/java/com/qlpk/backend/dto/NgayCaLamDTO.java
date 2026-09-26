package com.qlpk.backend.dto;

import com.qlpk.backend.entity.BangPhanCongCaLam;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class NgayCaLamDTO {
    private String ngay;            
    private String thu;             
    private List<BangPhanCongCaLam> macDinh = new ArrayList<>();
    private List<BangPhanCongCaLam> theoNgay = new ArrayList<>();
    private List<BangPhanCongCaLam> resolved = new ArrayList<>();
}
