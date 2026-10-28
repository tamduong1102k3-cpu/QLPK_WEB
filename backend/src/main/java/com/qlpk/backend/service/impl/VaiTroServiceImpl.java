package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.VaiTro;
import com.qlpk.backend.repository.VaiTroRepository;
import com.qlpk.backend.service.VaiTroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VaiTroServiceImpl implements VaiTroService {

    @Autowired
    private VaiTroRepository repository;

    @Override
    public List<VaiTro> getAll() {
        return repository.findAll();
    }

    @Override
    public VaiTro getById(String id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public VaiTro create(VaiTro entity) {
        return repository.save(entity);
    }

    @Override
    public VaiTro update(String id, VaiTro entity) {
        if (repository.existsById(id)) {
            return repository.save(entity);
        }
        return null;
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }
}