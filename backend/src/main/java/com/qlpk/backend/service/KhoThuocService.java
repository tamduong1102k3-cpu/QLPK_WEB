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

    /**
     * Lấy danh sách tồn kho kèm trạng thái cảnh báo
     * Trả về: maThuoc, tenThuoc, soLuongTon, trangThai (BÌNH_THƯỜNG/SẮP_HẾT/CẢNH_BÁO/HẾT_HÀNG)
     */
    List<Map<String, Object>> getAllWithAlertStatus();

    /**
     * Lấy danh sách thuốc đang có cảnh báo (soLuongTon < 50)
     */
    List<Map<String, Object>> getAlertList();
}