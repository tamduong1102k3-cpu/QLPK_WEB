package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.dto.ChuyenKhoaRequestDTO;
import com.qlpk.backend.exception.DuplicateFieldException;
import com.qlpk.backend.repository.ChuyenKhoaRepository;
import com.qlpk.backend.service.ChuyenKhoaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ChuyenKhoaServiceImpl implements ChuyenKhoaService {

    @Autowired
    private ChuyenKhoaRepository repository;

    @Override
    public List<ChuyenKhoa> getAll() {
        return repository.findAll();
    }

    @Override
    public ChuyenKhoa getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public ChuyenKhoa create(ChuyenKhoaRequestDTO request) {
        ChuyenKhoa entity = toEntity(request);
        validateUniqueName(entity, null);
        return repository.save(entity);
    }

    @Override
    public ChuyenKhoa update(Integer id, ChuyenKhoaRequestDTO request) {
        if (repository.existsById(id)) {
            ChuyenKhoa entity = toEntity(request);
            entity.setMaChuyenKhoa(id);
            validateUniqueName(entity, id);
            return repository.save(entity);
        }
        return null;
    }

    private void validateUniqueName(ChuyenKhoa entity, Integer idToExclude) {
        String name = entity.getTenChuyenKhoa() == null ? null : entity.getTenChuyenKhoa().trim();
        if (name == null || name.isBlank()) {
            return;
        }
        boolean duplicate = idToExclude == null
                ? repository.existsByTenChuyenKhoaIgnoreCase(name)
                : repository.existsByTenChuyenKhoaIgnoreCaseAndMaChuyenKhoaNot(name, idToExclude);
        if (duplicate) {
            Map<String, String> fieldErrors = new LinkedHashMap<>();
            fieldErrors.put("tenChuyenKhoa", "Tên chuyên khoa đã tồn tại");
            throw new DuplicateFieldException(fieldErrors);
        }
        entity.setTenChuyenKhoa(name);
    }

    private ChuyenKhoa toEntity(ChuyenKhoaRequestDTO request) {
        ChuyenKhoa entity = new ChuyenKhoa();
        entity.setTenChuyenKhoa(request.getTenChuyenKhoa());
        entity.setMoTa(request.getMoTa());
        entity.setSoLuongToiDa(request.getSoLuongToiDa());
        return entity;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }
}