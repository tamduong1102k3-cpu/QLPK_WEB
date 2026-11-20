package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChucVu;
import com.qlpk.backend.repository.ChucVuRepository;
import com.qlpk.backend.service.ChucVuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChucVuServiceImpl implements ChucVuService {

    @Autowired
    private ChucVuRepository repository;

    @Override
    public List<ChucVu> getAll() {
        return repository.findAll();
    }

    @Override
    public ChucVu getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public ChucVu create(ChucVu entity) {
        return repository.save(entity);
    }

    @Override
    public ChucVu update(Integer id, ChucVu entity) {
        if (repository.existsById(id)) {
            return repository.save(entity);
        }
        return null;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }
}