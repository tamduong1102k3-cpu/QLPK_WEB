package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChiTietPhieuNhapThuoc;
import com.qlpk.backend.repository.ChiTietPhieuNhapThuocRepository;
import com.qlpk.backend.service.ChiTietPhieuNhapThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChiTietPhieuNhapThuocServiceImpl implements ChiTietPhieuNhapThuocService {

    @Autowired
    private ChiTietPhieuNhapThuocRepository repository;

    @Override
    public List<ChiTietPhieuNhapThuoc> getAll() {
        return repository.findAll();
    }

    @Override
    public ChiTietPhieuNhapThuoc getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public ChiTietPhieuNhapThuoc create(ChiTietPhieuNhapThuoc entity) {
        return repository.save(entity);
    }

    @Override
    public ChiTietPhieuNhapThuoc update(Integer id, ChiTietPhieuNhapThuoc entity) {
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
    public List<ChiTietPhieuNhapThuoc> findByMaPhieuNhapThuoc(Integer id) {
        return repository.findByMaPhieuNhapThuoc(id);
    }
}