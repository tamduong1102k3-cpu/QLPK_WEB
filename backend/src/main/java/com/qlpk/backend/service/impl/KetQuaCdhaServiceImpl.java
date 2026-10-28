package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.HinhAnhKetQuaCdha;
import com.qlpk.backend.entity.KetQuaCdha;
import com.qlpk.backend.repository.HinhAnhKetQuaCdhaRepository;
import com.qlpk.backend.repository.KetQuaCdhaRepository;
import com.qlpk.backend.service.KetQuaCdhaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class KetQuaCdhaServiceImpl implements KetQuaCdhaService {

    @Autowired
    private KetQuaCdhaRepository repository;

    @Autowired
    private HinhAnhKetQuaCdhaRepository hinhAnhKetQuaCdhaRepository;

    @Override
    public List<KetQuaCdha> getAll() {
        List<KetQuaCdha> list = repository.findAll();
        list.forEach(this::fillAnh);
        return list;
    }

    @Override
    public KetQuaCdha getById(Integer id) {
        KetQuaCdha kq = repository.findById(id).orElse(null);
        if (kq != null) fillAnh(kq);
        return kq;
    }

    @Override
    @Transactional
    public KetQuaCdha create(KetQuaCdha entity) {
        KetQuaCdha saved = repository.save(entity);
        // Đồng bộ ảnh từ transient (FE mới gửi danhSachAnh, FE cũ gửi duongDanAnh1/2)
        syncAnh(saved.getId(), entity.getDanhSachAnh(), entity.getDuongDanAnh1(), entity.getDuongDanAnh2(), true);
        fillAnh(saved);
        return saved;
    }

    @Override
    @Transactional
    public KetQuaCdha update(Integer id, KetQuaCdha entity) {
        if (repository.existsById(id)) {
            entity.setId(id); // FIX BUG: update không set id từ path
            KetQuaCdha saved = repository.save(entity);
            syncAnh(saved.getId(), entity.getDanhSachAnh(), entity.getDuongDanAnh1(), entity.getDuongDanAnh2(), true);
            fillAnh(saved);
            return saved;
        }
        return null;
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        hinhAnhKetQuaCdhaRepository.deleteByMaKetQuaCdha(id);
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
            KetQuaCdha saved = repository.save(entity);
            fillAnh(saved);
            return saved;
        }
        return null;
    }

    private void fillAnh(KetQuaCdha kq) {
        if (kq == null || kq.getId() == null) return;
        List<String> urls = hinhAnhKetQuaCdhaRepository.findByMaKetQuaCdhaOrderByThuTuAsc(kq.getId())
                .stream().map(HinhAnhKetQuaCdha::getDuongDanAnh)
                .filter(u -> u != null && !u.trim().isEmpty()).toList();
        kq.setDuongDanAnh1(urls.size() > 0 ? urls.get(0) : null);
        kq.setDuongDanAnh2(urls.size() > 1 ? urls.get(1) : null);
        kq.setDanhSachAnh(urls);
    }

    private void syncAnh(Integer maKetQua, List<String> danhSachAnh, String a1, String a2, boolean replace) {
        List<String> urls = new java.util.ArrayList<>();
        if (danhSachAnh != null) {
            for (String s : danhSachAnh) if (s != null && !s.trim().isEmpty()) urls.add(s.trim());
        }
        if (urls.isEmpty()) {
            if (a1 != null && !a1.trim().isEmpty()) urls.add(a1.trim());
            if (a2 != null && !a2.trim().isEmpty()) urls.add(a2.trim());
        }
        if (replace) hinhAnhKetQuaCdhaRepository.deleteByMaKetQuaCdha(maKetQua);
        List<HinhAnhKetQuaCdha> ds = new java.util.ArrayList<>();
        int thuTu = 0;
        for (String u : urls) {
            HinhAnhKetQuaCdha h = new HinhAnhKetQuaCdha();
            h.setMaKetQuaCdha(maKetQua);
            h.setDuongDanAnh(u);
            h.setThuTu(thuTu++);
            h.setNgayTao(java.time.LocalDateTime.now());
            ds.add(h);
        }
        if (!ds.isEmpty()) hinhAnhKetQuaCdhaRepository.saveAll(ds);
    }
}