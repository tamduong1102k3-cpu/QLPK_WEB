package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiTietChiDinh;
import java.util.List;

public interface ChiTietChiDinhService {
    List<ChiTietChiDinh> getAll();
    ChiTietChiDinh getById(Integer id);
    ChiTietChiDinh create(ChiTietChiDinh entity);
    ChiTietChiDinh update(Integer id, ChiTietChiDinh entity);
    void delete(Integer id);
}
