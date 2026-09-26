package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiTietPhieuChiDinh;
import java.util.List;

public interface ChiTietPhieuChiDinhService {
    List<ChiTietPhieuChiDinh> getAll();
    ChiTietPhieuChiDinh getById(Integer id);
    ChiTietPhieuChiDinh create(ChiTietPhieuChiDinh entity);
    ChiTietPhieuChiDinh update(Integer id, ChiTietPhieuChiDinh entity);
    void delete(Integer id);
}
