package com.qlpk.backend.dto;

import com.qlpk.backend.entity.ChiTietChiDinh;
import com.qlpk.backend.entity.PhieuChiDinh;
import lombok.Data;
import java.util.List;

@Data
public class ReferralRequest {
    private PhieuChiDinh phieuChiDinh;
    private List<ChiTietChiDinh> chiTietList;
}
