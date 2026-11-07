package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.repository.ChuyenKhoaRepository;
import com.qlpk.backend.service.ChuyenKhoaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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
    public ChuyenKhoa create(ChuyenKhoa entity) {
        return repository.save(entity);
    }

    @Override
    public ChuyenKhoa update(Integer id, ChuyenKhoa entity) {
        if (repository.existsById(id)) {
            entity.setMaChuyenKhoa(id);
            return repository.save(entity);
        }
        return null;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }
}