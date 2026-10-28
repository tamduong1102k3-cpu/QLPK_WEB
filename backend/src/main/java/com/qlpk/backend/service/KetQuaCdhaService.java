package com.qlpk.backend.service;

import com.qlpk.backend.entity.KetQuaCdha;

import java.util.Map;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.qlpk.backend.repository.KetQuaCdhaRepository;

public interface KetQuaCdhaService {
    List<KetQuaCdha> getAll();
    KetQuaCdha getById(Integer id);
    KetQuaCdha create(KetQuaCdha entity);
    KetQuaCdha update(Integer id, KetQuaCdha entity);
    void delete(Integer id);
    List<Map<String, Object>> getTodayResults();
    List<Map<String, Object>> getTodayResultsByDoctorId(Integer maBacSi);
    KetQuaCdha updateStatus(Integer id, String status);
}