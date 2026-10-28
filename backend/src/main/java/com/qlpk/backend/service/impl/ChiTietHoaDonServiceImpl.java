package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChiTietHoaDon;
import com.qlpk.backend.repository.ChiTietHoaDonRepository;
import com.qlpk.backend.service.ChiTietHoaDonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChiTietHoaDonServiceImpl implements ChiTietHoaDonService {

    @Autowired
    private ChiTietHoaDonRepository repository;

    @Override
    public List<ChiTietHoaDon> getAll() {
        return repository.findAll();
    }

    @Override
    public ChiTietHoaDon getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public ChiTietHoaDon create(ChiTietHoaDon entity) {
        return repository.save(entity);
    }

    @Override
    public ChiTietHoaDon update(Integer id, ChiTietHoaDon entity) {
        if (repository.existsById(id)) {
            return repository.save(entity);
        }
        return null;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<ChiTietHoaDon> findByMaHoaDon(Integer maHoaDon) {
        return repository.findByMaHoaDon(maHoaDon);
    }
}