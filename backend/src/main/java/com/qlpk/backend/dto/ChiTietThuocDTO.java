package com.qlpk.backend.dto;

import com.qlpk.backend.entity.ChiTietToaThuoc;
import com.qlpk.backend.entity.Thuoc;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietThuocDTO {
    private ChiTietToaThuoc chiTietToaThuoc;
    private Thuoc thuoc;
}
