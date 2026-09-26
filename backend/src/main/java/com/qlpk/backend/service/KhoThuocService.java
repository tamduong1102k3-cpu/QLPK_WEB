package com.qlpk.backend.service;

import com.qlpk.backend.entity.KhoThuoc;
import java.util.List;
import java.util.Map;

public interface KhoThuocService {
    List<KhoThuoc> getAll();
    KhoThuoc getById(Integer id);
    KhoThuoc create(KhoThuoc entity);
    KhoThuoc update(Integer id, KhoThuoc entity);
    void delete(Integer id);

    List<Map<String, Object>> getSapHet(Integer threshold);

    List<Map<String, Object>> getAllWithAlertStatus();

    List<Map<String, Object>> getAlertList();
}
