package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChiTietChiDinh;
import com.qlpk.backend.repository.ChiTietChiDinhRepository;
import com.qlpk.backend.service.ChiTietChiDinhService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChiTietChiDinhServiceImpl implements ChiTietChiDinhService {

    @Autowired
    private ChiTietChiDinhRepository repository;

    @Override
    public List<ChiTietChiDinh> getAll() {
        return repository.findAll();
    }

    @Override
    public ChiTietChiDinh getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public ChiTietChiDinh create(ChiTietChiDinh entity) {
        return repository.save(entity);
    }

    @Override
    public ChiTietChiDinh update(Integer id, ChiTietChiDinh entity) {
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
