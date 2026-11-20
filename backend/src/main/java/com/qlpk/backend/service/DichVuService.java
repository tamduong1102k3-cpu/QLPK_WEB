package com.qlpk.backend.service;

import com.qlpk.backend.entity.DichVu;
import com.qlpk.backend.dto.DichVuRequestDTO;
import java.util.List;

public interface DichVuService {
    List<DichVu> getAll();
    DichVu getById(Integer id);
    DichVu create(DichVuRequestDTO request);
    DichVu update(Integer id, DichVuRequestDTO request);
    void delete(Integer id);
    List<DichVu> getByLoaiDichVu(List<String> loaiDichVu);
    List<DichVu> getByMaChuyenKhoa(Integer maChuyenKhoa);
}
