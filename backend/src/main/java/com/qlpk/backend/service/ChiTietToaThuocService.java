package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiTietToaThuoc;
import java.util.List;

public interface ChiTietToaThuocService {
    List<ChiTietToaThuoc> getAll();
    ChiTietToaThuoc getById(Integer id);
    ChiTietToaThuoc create(ChiTietToaThuoc entity);
    ChiTietToaThuoc update(Integer id, ChiTietToaThuoc entity);
    void delete(Integer id);

    List<ChiTietToaThuoc> findByMaToaThuoc(Integer maToaThuoc);
}