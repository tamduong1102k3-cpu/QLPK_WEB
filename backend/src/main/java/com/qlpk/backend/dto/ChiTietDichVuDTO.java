package com.qlpk.backend.dto;

import com.qlpk.backend.entity.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietDichVuDTO {
    private ChiTietChiDinh chiTietChiDinh;
    private DichVu dichVu;
    private KetQuaXetNghiem ketQuaXetNghiem;
    private KetQuaCdha ketQuaCdha;

    private String tenBsKetLuan;

    private String tenBsCdha;

    private String tenKyThuatVien;

    private List<Map<String, Object>> chiSoXetNghiem;
}
