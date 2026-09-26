package com.qlpk.backend.dto;

import com.qlpk.backend.entity.PhieuChiDinh;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhieuChiDinhChiTietDTO {
    private PhieuChiDinh phieuChiDinh;
    private List<ChiTietDichVuDTO> chiTietDichVu;
}
