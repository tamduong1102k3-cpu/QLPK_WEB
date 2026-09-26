package com.qlpk.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LinkPatientRequest {
    private String hoTen;
    private String soDienThoai;
    private String cccd;
}
