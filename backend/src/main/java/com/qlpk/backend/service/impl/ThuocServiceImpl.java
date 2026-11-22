package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.dto.ThuocRequestDTO;
import com.qlpk.backend.exception.DuplicateFieldException;
import com.qlpk.backend.repository.ThuocRepository;
import com.qlpk.backend.service.ThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ThuocServiceImpl implements ThuocService {

    @Autowired
    private ThuocRepository repository;

    @Override
    public List<Thuoc> getAll() {
        return repository.findAll();
    }

    @Override
    public Thuoc getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Thuoc create(ThuocRequestDTO request) {
        Thuoc entity = toEntity(request);
        validateUniqueName(entity, null);
        return repository.save(entity);
    }

    @Override
    @Transactional
    public Thuoc update(Integer id, ThuocRequestDTO request) {
        return repository.findById(id).map(existing -> {
            Thuoc entity = toEntity(request);
            validateUniqueName(entity, id);
            // Optimistic Lock: so sánh version gửi từ client với version hiện tại trong DB.
            // Nếu lệch (đã có người khác cập nhật trước) -> ném exception để trả về HTTP 409.
            if (entity.getVersion() != null && !entity.getVersion().equals(existing.getVersion())) {
                throw new ObjectOptimisticLockingFailureException(Thuoc.class, id);
            }
        
            existing.setTenThuoc(entity.getTenThuoc());
            existing.setHoatChat(entity.getHoatChat());
            existing.setHamLuong(entity.getHamLuong());
            existing.setDangThuoc(entity.getDangThuoc());
            existing.setLoaiThuoc(entity.getLoaiThuoc());
            existing.setDonViTinh(entity.getDonViTinh());
            existing.setDonGiaNhap(entity.getDonGiaNhap());
            existing.setDonGiaBan(entity.getDonGiaBan());
            existing.setNgaySanXuat(entity.getNgaySanXuat());
            existing.setHanSuDung(entity.getHanSuDung());
            existing.setNhaSanXuat(entity.getNhaSanXuat());
            existing.setNuocSanXuat(entity.getNuocSanXuat());
            existing.setGhiChu(entity.getGhiChu());
            return repository.save(existing);
        }).orElse(null);
    }

    private void validateUniqueName(Thuoc entity, Integer idToExclude) {
        String name = entity.getTenThuoc() == null ? null : entity.getTenThuoc().trim();
        if (name == null || name.isBlank()) {
            return;
        }
        boolean duplicate = idToExclude == null
                ? repository.existsByTenThuocIgnoreCase(name)
                : repository.existsByTenThuocIgnoreCaseAndMaThuocNot(name, idToExclude);
        if (duplicate) {
            Map<String, String> fieldErrors = new LinkedHashMap<>();
            fieldErrors.put("tenThuoc", "Tên thuốc đã tồn tại");
            throw new DuplicateFieldException(fieldErrors);
        }
        entity.setTenThuoc(name);
    }

    private Thuoc toEntity(ThuocRequestDTO request) {
        Thuoc entity = new Thuoc();
        entity.setTenThuoc(request.getTenThuoc());
        entity.setHoatChat(request.getHoatChat());
        entity.setHamLuong(request.getHamLuong());
        entity.setDangThuoc(request.getDangThuoc());
        entity.setLoaiThuoc(request.getLoaiThuoc());
        entity.setDonViTinh(request.getDonViTinh());
        entity.setDonGiaNhap(request.getDonGiaNhap());
        entity.setDonGiaBan(request.getDonGiaBan());
        entity.setNgaySanXuat(request.getNgaySanXuat());
        entity.setHanSuDung(request.getHanSuDung());
        entity.setNhaSanXuat(request.getNhaSanXuat());
        entity.setNuocSanXuat(request.getNuocSanXuat());
        entity.setGhiChu(request.getGhiChu());
        entity.setVersion(request.getVersion());
        return entity;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
       
    }
}