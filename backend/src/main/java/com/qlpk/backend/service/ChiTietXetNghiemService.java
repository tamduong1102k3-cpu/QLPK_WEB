package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiTietXetNghiem;
import com.qlpk.backend.repository.ChiTietXetNghiemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChiTietXetNghiemService {

    @Autowired
    private ChiTietXetNghiemRepository repository;

    public List<ChiTietXetNghiem> getByMaDichVu(Integer maDichVu) {
        return repository.findByMaDichVuOrderByThuTuAsc(maDichVu);
    }

    public List<ChiTietXetNghiem> getAll() {
        return repository.findAll();
    }

    public ChiTietXetNghiem getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    public ChiTietXetNghiem create(ChiTietXetNghiem entity) {
        return repository.save(entity);
    }

    @Transactional
    public ChiTietXetNghiem update(Integer id, ChiTietXetNghiem entity) {
        if (repository.existsById(id)) {
            entity.setMaChiTiet(id);
            return repository.save(entity);
        }
        return null;
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }
}
