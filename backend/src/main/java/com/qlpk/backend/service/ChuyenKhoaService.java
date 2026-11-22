package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.dto.ChuyenKhoaRequestDTO;
import java.util.List;

public interface ChuyenKhoaService {
    List<ChuyenKhoa> getAll();
    ChuyenKhoa getById(Integer id);
    ChuyenKhoa create(ChuyenKhoaRequestDTO request);
    ChuyenKhoa update(Integer id, ChuyenKhoaRequestDTO request);
    void delete(Integer id);
}