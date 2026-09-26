package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.PhongChucNang;
import com.qlpk.backend.repository.PhongChucNangRepository;
import com.qlpk.backend.service.PhongChucNangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PhongChucNangServiceImpl implements PhongChucNangService {

    @Autowired
    private PhongChucNangRepository repository;

    @Override
    public List<PhongChucNang> getAll() {
        return repository.findAll();
    }

    @Override
    public PhongChucNang getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public PhongChucNang create(PhongChucNang entity) {
        return repository.save(entity);
    }

    @Override
    public PhongChucNang update(Integer id, PhongChucNang entity) {
        if (repository.existsById(id)) {
            entity.setMaPhong(id);
            return repository.save(entity);
        }
        return null;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<PhongChucNang> findByMaChucVu(Integer maChucVu) {
        return repository.findByMaChucVu(maChucVu);
    }
}
