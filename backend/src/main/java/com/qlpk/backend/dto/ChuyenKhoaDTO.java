package com.qlpk.backend.dto;

import com.qlpk.backend.entity.ChuyenKhoa;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChuyenKhoaDTO {
    private Integer maChuyenKhoa;
    private String tenChuyenKhoa;
    private String moTa;
    private Integer soLuongToiDa;

    public void setTenChuyenKhoa(String tenChuyenKhoa) {
        this.tenChuyenKhoa = tenChuyenKhoa != null ? tenChuyenKhoa : "";
    }

    public static ChuyenKhoaDTO fromEntity(ChuyenKhoa ck) {
        if (ck == null) return null;
        return new ChuyenKhoaDTO(
                ck.getMaChuyenKhoa(),
                ck.getTenChuyenKhoa(),
                ck.getMoTa(),
                ck.getSoLuongToiDa());
    }
}
