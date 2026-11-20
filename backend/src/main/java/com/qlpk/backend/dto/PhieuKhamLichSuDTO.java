package com.qlpk.backend.dto;

import java.time.LocalDateTime;

public record PhieuKhamLichSuDTO(Integer maPhieuKham, LocalDateTime ngayKham, String trangThai) {
}
