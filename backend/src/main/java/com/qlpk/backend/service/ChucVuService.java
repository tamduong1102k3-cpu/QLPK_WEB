package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChucVu;
import java.util.List;

public interface ChucVuService {
    List<ChucVu> getAll();
    ChucVu getById(Integer id);
    ChucVu create(ChucVu entity);
    ChucVu update(Integer id, ChucVu entity);
    void delete(Integer id);
}