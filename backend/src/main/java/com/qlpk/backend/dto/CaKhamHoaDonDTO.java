package com.qlpk.backend.dto;

import com.qlpk.backend.entity.HoaDon;
import com.qlpk.backend.entity.ChiTietHoaDon;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaKhamHoaDonDTO {
    private HoaDon hoaDon;
    private List<ChiTietHoaDon> chiTietHoaDon;
}
