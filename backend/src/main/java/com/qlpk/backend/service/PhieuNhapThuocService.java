package com.qlpk.backend.service;

import com.qlpk.backend.entity.PhieuNhapThuoc;
import com.qlpk.backend.dto.PhieuNhapRequestDTO;
import java.util.List;

public interface PhieuNhapThuocService {
    List<PhieuNhapThuoc> getAll();
    PhieuNhapThuoc getById(Integer id);
    PhieuNhapThuoc create(PhieuNhapThuoc entity);
    PhieuNhapThuoc update(Integer id, PhieuNhapThuoc entity);
    void delete(Integer id);

    PhieuNhapThuoc createPhieuNhap(PhieuNhapRequestDTO request) throws Exception;
}