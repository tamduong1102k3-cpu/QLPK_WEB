package com.qlpk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClsRoomOptionDTO {
    private Integer maPhong;
    private String tenPhong;
    private Integer soLuongToiDa;
    private long soBenhNhanDangCho;
}
