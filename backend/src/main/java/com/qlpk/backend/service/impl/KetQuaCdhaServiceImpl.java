package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.KetQuaCdha;
import com.qlpk.backend.repository.KetQuaCdhaRepository;
import com.qlpk.backend.service.KetQuaCdhaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class KetQuaCdhaServiceImpl implements KetQuaCdhaService {

    @Autowired
    private KetQuaCdhaRepository repository;

    @Override
    public List<KetQuaCdha> getAll() {
        return repository.findAll();
    }

    @Override
    public KetQuaCdha getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public KetQuaCdha create(KetQuaCdha entity) {
        return repository.save(entity);
    }

    @Override
    public KetQuaCdha update(Integer id, KetQuaCdha entity) {
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
    public List<Map<String, Object>> getTodayResults() {
        return repository.findResultsTodayWithPatientInfo();
    }

    @Override
    public List<Map<String, Object>> getTodayResultsByDoctorId(Integer maBacSi) {
        return repository.findResultsTodayWithPatientInfoByDoctorId(maBacSi);
    }

    @Override
    public KetQuaCdha updateStatus(Integer id, String status) {
        KetQuaCdha entity = repository.findById(id).orElse(null);
        if (entity != null) {
            entity.setTrangThai(status);
            return repository.save(entity);
        }
        return null;
    }
}
