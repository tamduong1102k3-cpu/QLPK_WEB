package com.qlpk.backend.dto;

import com.qlpk.backend.entity.ChiTietToaThuoc;
import com.qlpk.backend.entity.ToaThuoc;
import lombok.Data;
import java.util.List;

@Data
public class PrescriptionRequest {
    private ToaThuoc toaThuoc;
    private List<ChiTietToaThuoc> chiTietList;

    private List<Long> versionThuocList;
}
