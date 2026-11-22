package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.CaLam;
import com.qlpk.backend.exception.DuplicateFieldException;
import com.qlpk.backend.repository.CaLamRepository;
import com.qlpk.backend.service.CaLamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CaLamServiceImpl implements CaLamService {

    @Autowired
    private CaLamRepository repository;

    @Override
    public List<CaLam> getAll() {
        return repository.findAll();
    }

    @Override
    public CaLam getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CaLam create(CaLam entity) {
        validate(entity, null);
        return repository.save(entity);
    }

    @Override
    public CaLam update(Integer id, CaLam entity) {
        if (!repository.existsById(id)) {
            return null;
        }
        entity.setId(id);
        validate(entity, id);
        return repository.save(entity);
    }

    @Override
    public void delete(Integer id) {
        try {
            repository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            // FK constraint violation
            throw new RuntimeException("Không thể xóa: ca này đang được sử dụng trong lịch phân công. Vui lòng gỡ khỏi lịch trước.");
        }
    }

    private void validate(CaLam entity, Integer idToExclude) {
        if (entity.getTenCa() == null || entity.getTenCa().isBlank()) {
            throw new RuntimeException("Tên ca không được để trống");
        }
        if (entity.getGioBatDau() == null || entity.getGioKetThuc() == null) {
            throw new RuntimeException("Giờ bắt đầu và giờ kết thúc không được để trống");
        }
        if (!entity.getGioBatDau().isBefore(entity.getGioKetThuc())) {
            throw new RuntimeException("Giờ bắt đầu phải раньше giờ kết thúc");
        }
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        String tenCa = entity.getTenCa().trim();
        boolean duplicateName = idToExclude == null
                ? repository.existsByTenCaIgnoreCase(tenCa)
                : repository.existsByTenCaIgnoreCaseAndIdNot(tenCa, idToExclude);
        if (duplicateName) {
            fieldErrors.put("tenCa", "Tên ca đã tồn tại");
        }

        boolean duplicateTime = idToExclude == null
                ? repository.existsByGioBatDauAndGioKetThuc(entity.getGioBatDau(), entity.getGioKetThuc())
                : repository.existsByGioBatDauAndGioKetThucAndIdNot(
                        entity.getGioBatDau(), entity.getGioKetThuc(), idToExclude);
        if (duplicateTime) {
            fieldErrors.put("gioBatDau", "Đã tồn tại ca có khung giờ này");
            fieldErrors.put("gioKetThuc", "Đã tồn tại ca có khung giờ này");
        }
        if (!fieldErrors.isEmpty()) {
            throw new DuplicateFieldException(fieldErrors);
        }
    }
}