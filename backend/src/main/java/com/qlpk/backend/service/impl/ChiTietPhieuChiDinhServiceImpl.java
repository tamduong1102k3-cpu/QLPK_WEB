package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChiTietPhieuChiDinh;
import com.qlpk.backend.repository.ChiTietPhieuChiDinhRepository;
import com.qlpk.backend.service.ChiTietPhieuChiDinhService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChiTietPhieuChiDinhServiceImpl implements ChiTietPhieuChiDinhService {

    @Autowired
    private ChiTietPhieuChiDinhRepository repository;

    @Override
    public List<ChiTietPhieuChiDinh> getAll() {
        return repository.findAll();
    }

    @Override
    public ChiTietPhieuChiDinh getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public ChiTietPhieuChiDinh create(ChiTietPhieuChiDinh entity) {
        return repository.save(entity);
    }

    @Override
    public ChiTietPhieuChiDinh update(Integer id, ChiTietPhieuChiDinh entity) {
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
