package com.qlpk.backend.dto;

import com.qlpk.backend.entity.ToaThuoc;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToaThuocChiTietDTO {
    private ToaThuoc toaThuoc;
    private List<ChiTietThuocDTO> chiTietThuoc;
}
