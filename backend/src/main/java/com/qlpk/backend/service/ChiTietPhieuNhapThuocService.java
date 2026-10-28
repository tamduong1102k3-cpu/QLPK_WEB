package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiTietPhieuNhapThuoc;
import java.util.List;

public interface ChiTietPhieuNhapThuocService {
    List<ChiTietPhieuNhapThuoc> getAll();
    ChiTietPhieuNhapThuoc getById(Integer id);
    ChiTietPhieuNhapThuoc create(ChiTietPhieuNhapThuoc entity);
    ChiTietPhieuNhapThuoc update(Integer id, ChiTietPhieuNhapThuoc entity);
    void delete(Integer id);

    List<ChiTietPhieuNhapThuoc> findByMaPhieuNhapThuoc(Integer id);
}