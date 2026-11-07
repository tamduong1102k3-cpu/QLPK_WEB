package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChuyenKhoa;
import java.util.List;

public interface ChuyenKhoaService {
    List<ChuyenKhoa> getAll();
    ChuyenKhoa getById(Integer id);
    ChuyenKhoa create(ChuyenKhoa entity);
    ChuyenKhoa update(Integer id, ChuyenKhoa entity);
    void delete(Integer id);
}