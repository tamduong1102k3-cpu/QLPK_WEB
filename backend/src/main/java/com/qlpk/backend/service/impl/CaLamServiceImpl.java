package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.CaLam;
import com.qlpk.backend.repository.CaLamRepository;
import com.qlpk.backend.service.CaLamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

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
        validate(entity);
        return repository.save(entity);
    }

    @Override
    public CaLam update(Integer id, CaLam entity) {
        if (!repository.existsById(id)) {
            return null;
        }
        entity.setId(id);
        validate(entity);
        return repository.save(entity);
    }

    @Override
    public void delete(Integer id) {
        try {
            repository.deleteById(id);
        } catch (DataIntegrityViolationException e) {

            throw new RuntimeException("Không thể xóa: ca này đang được sử dụng trong lịch phân công. Vui lòng gỡ khỏi lịch trước.");
        }
    }

    private void validate(CaLam entity) {
        if (entity.getTenCa() == null || entity.getTenCa().isBlank()) {
            throw new RuntimeException("Tên ca không được để trống");
        }
        if (entity.getGioBatDau() == null || entity.getGioKetThuc() == null) {
            throw new RuntimeException("Giờ bắt đầu và giờ kết thúc không được để trống");
        }
        if (!entity.getGioBatDau().isBefore(entity.getGioKetThuc())) {
            throw new RuntimeException("Giờ bắt đầu phải раньше giờ kết thúc");
        }

        if (repository.existsByGioBatDauAndGioKetThuc(entity.getGioBatDau(), entity.getGioKetThuc())) {
            throw new RuntimeException("Đã tồn tại ca với giờ bắt đầu và giờ kết thúc này");
        }
    }
}
