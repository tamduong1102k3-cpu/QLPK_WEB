package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiTietHoaDon;
import java.util.List;

public interface ChiTietHoaDonService {
    List<ChiTietHoaDon> getAll();
    ChiTietHoaDon getById(Integer id);
    ChiTietHoaDon create(ChiTietHoaDon entity);
    ChiTietHoaDon update(Integer id, ChiTietHoaDon entity);
    void delete(Integer id);
    
    List<ChiTietHoaDon> findByMaHoaDon(Integer maHoaDon);
}