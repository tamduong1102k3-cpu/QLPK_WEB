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

    /**
     * Lấy danh sách chỉ số xét nghiệm theo mã dịch vụ, sắp xếp theo thứ tự
     */
    public List<ChiTietXetNghiem> getByMaDichVu(Integer maDichVu) {
        return repository.findByMaDichVuOrderByThuTuAsc(maDichVu);
    }

    /**
     * Lấy tất cả chỉ số xét nghiệm
     */
    public List<ChiTietXetNghiem> getAll() {
        return repository.findAll();
    }

    /**
     * Lấy một chỉ số xét nghiệm theo mã
     */
    public ChiTietXetNghiem getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    /**
     * Tạo mới chỉ số xét nghiệm
     */
    public ChiTietXetNghiem create(ChiTietXetNghiem entity) {
        return repository.save(entity);
    }

    /**
     * Cập nhật chỉ số xét nghiệm
     */
    @Transactional
    public ChiTietXetNghiem update(Integer id, ChiTietXetNghiem entity) {
        if (repository.existsById(id)) {
            entity.setMaChiTiet(id);
            return repository.save(entity);
        }
        return null;
    }

    /**
     * Xóa chỉ số xét nghiệm
     */
    public void delete(Integer id) {
        repository.deleteById(id);
    }
}