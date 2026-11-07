package com.qlpk.backend.service;

import com.qlpk.backend.entity.PhieuNhapThuoc;
import java.util.List;
import java.util.Map;

public interface PhieuNhapThuocService {
    List<PhieuNhapThuoc> getAll();
    PhieuNhapThuoc getById(Integer id);
    PhieuNhapThuoc create(PhieuNhapThuoc entity);
    PhieuNhapThuoc update(Integer id, PhieuNhapThuoc entity);
    void delete(Integer id);

    PhieuNhapThuoc createPhieuNhap(Map<String, Object> request) throws Exception;
}