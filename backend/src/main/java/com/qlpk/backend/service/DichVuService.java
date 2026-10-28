package com.qlpk.backend.service;

import com.qlpk.backend.entity.DichVu;
import java.util.List;

public interface DichVuService {
    List<DichVu> getAll();
    DichVu getById(Integer id);
    DichVu create(DichVu entity);
    DichVu update(Integer id, DichVu entity);
    void delete(Integer id);
    List<DichVu> getByLoaiDichVu(List<String> loaiDichVu);
}
