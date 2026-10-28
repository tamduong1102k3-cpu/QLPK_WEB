package com.qlpk.backend.service;

import com.qlpk.backend.entity.KetQuaXetNghiem;
import com.qlpk.backend.repository.KetQuaXetNghiemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.List;

@Service
public class KetQuaXetNghiemService {

    @Autowired
    private KetQuaXetNghiemRepository repository;

public List<Map<String, Object>> getTodayResults() {
    return repository.findResultsTodayWithPatientInfo();
}

    public KetQuaXetNghiem updateStatus(Integer id, String status) {
        KetQuaXetNghiem kq = repository.findById(id).orElse(null);
        if (kq != null) {
            kq.setTrangThai(status);
            return repository.save(kq);
        }
        return null;
    }
}