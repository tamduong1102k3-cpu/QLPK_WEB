package com.qlpk.backend.dto;

import java.util.List;

public record KetQuaLichSuDTO(
        String loaiKetQua,
        String chuanDoanSoBo,
        String khamLamSang,
        String loiDanBacSi,
        String ketLuan,
        String ghiChuThem,
        String moTaHinhAnh,
        String deNghi,
        String tenNhanVien,
        Integer maBacSiThucHien,
        List<String> hinhAnh) {
}
