package com.qlpk.backend.service;

import com.qlpk.backend.dto.CreateDangKyKhamBenhRequest;
import com.qlpk.backend.entity.DangKyKhamBenh;
import java.util.List;
import java.util.Map;

public interface DangKyKhamBenhService {
    List<DangKyKhamBenh> getAll();
    DangKyKhamBenh getById(Integer id);
    DangKyKhamBenh create(CreateDangKyKhamBenhRequest request);
    DangKyKhamBenh update(Integer id, DangKyKhamBenh entity);
    void delete(Integer id);

    List<Map<String, Object>> getTodayRegistrationsDetailed();
    List<Map<String, Object>> getTodayRegistrationsDetailedWithSearch(String keyword);
    DangKyKhamBenh updateStatus(Integer id, String status);
}
