package com.qlpk.backend.dto;

import com.qlpk.backend.entity.KhamLamSang;
import com.qlpk.backend.entity.ChiSoKhamTongHop;
import lombok.Data;

@Data
public class KhamLamSangAndVitalsDTO {
    private KhamLamSang khamLamSang;
    private ChiSoKhamTongHop chiSoKhamTongHop;
}
