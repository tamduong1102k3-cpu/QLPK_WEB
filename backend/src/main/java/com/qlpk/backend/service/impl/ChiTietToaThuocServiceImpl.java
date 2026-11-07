package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChiTietToaThuoc;
import com.qlpk.backend.repository.ChiTietToaThuocRepository;
import com.qlpk.backend.service.ChiTietToaThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChiTietToaThuocServiceImpl implements ChiTietToaThuocService {

    @Autowired
    private ChiTietToaThuocRepository repository;

    @Override
    public List<ChiTietToaThuoc> getAll() {
        return repository.findAll();
    }

    @Override
    public ChiTietToaThuoc getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public ChiTietToaThuoc create(ChiTietToaThuoc entity) {
        return repository.save(entity);
    }

    @Override
    public ChiTietToaThuoc update(Integer id, ChiTietToaThuoc entity) {
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
    public List<ChiTietToaThuoc> findByMaToaThuoc(Integer maToaThuoc) {
        return repository.findByMaToaThuoc(maToaThuoc);
    }
}