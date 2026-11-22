package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.DichVu;
import com.qlpk.backend.entity.NhomDichVu;
import com.qlpk.backend.dto.DichVuRequestDTO;
import com.qlpk.backend.repository.DichVuRepository;
import com.qlpk.backend.repository.NhomDichVuRepository;
import com.qlpk.backend.exception.DichVuValidationException;
import com.qlpk.backend.exception.DuplicateFieldException;
import com.qlpk.backend.service.DichVuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class DichVuServiceImpl implements DichVuService {

    @Autowired
    private DichVuRepository repository;

    @Autowired
    private NhomDichVuRepository nhomDichVuRepository;

    private static final String INVALID_NHOM_MESSAGE =
            "Nhóm dịch vụ không thuộc chuyên khoa đã chọn.";

    private void validateNhomDichVu(DichVu entity) {
        if (entity.getMaNhomDichVu() == null) {
            return;
        }

        NhomDichVu nhomDichVu = nhomDichVuRepository.findById(entity.getMaNhomDichVu())
                .orElseThrow(() -> new DichVuValidationException(INVALID_NHOM_MESSAGE));
        if (nhomDichVu.getMaChuyenKhoa() == null
                || !Objects.equals(nhomDichVu.getMaChuyenKhoa(), entity.getMaChuyenKhoa())) {
            throw new DichVuValidationException(INVALID_NHOM_MESSAGE);
        }
    }

    @Override
    public List<DichVu> getAll() {
        return repository.findAll();
    }

    @Override
    public DichVu getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public DichVu create(DichVuRequestDTO request) {
        DichVu entity = toEntity(request);
        validateUniqueName(entity, null);
        validateNhomDichVu(entity);
        return repository.save(entity);
    }

    @Override
    @Transactional
    public DichVu update(Integer id, DichVuRequestDTO request) {
        if (repository.existsById(id)) {
            DichVu entity = toEntity(request);
            entity.setMaDichVu(id);
            validateUniqueName(entity, id);
            validateNhomDichVu(entity);
            return repository.save(entity);
        }
        return null;
    }

    private void validateUniqueName(DichVu entity, Integer idToExclude) {
        String name = entity.getTenDichVu() == null ? null : entity.getTenDichVu().trim();
        if (name == null || name.isBlank()) {
            return;
        }
        boolean duplicate = idToExclude == null
                ? repository.existsByTenDichVuIgnoreCase(name)
                : repository.existsByTenDichVuIgnoreCaseAndMaDichVuNot(name, idToExclude);
        if (duplicate) {
            Map<String, String> fieldErrors = new LinkedHashMap<>();
            fieldErrors.put("tenDichVu", "Tên dịch vụ đã tồn tại");
            throw new DuplicateFieldException(fieldErrors);
        }
        entity.setTenDichVu(name);
    }

    private DichVu toEntity(DichVuRequestDTO request) {
        DichVu entity = new DichVu();
        entity.setTenDichVu(request.getTenDichVu());
        entity.setDonGia(request.getDonGia());
        entity.setLoaiDichVu(request.getLoaiDichVu());
        entity.setMaChuyenKhoa(request.getMaChuyenKhoa());
        entity.setMaNhomDichVu(request.getMaNhomDichVu());
        entity.setVersion(request.getVersion());
        return entity;
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<DichVu> getByLoaiDichVu(List<String> loaiDichVu) {
        return repository.findByLoaiDichVuIn(loaiDichVu);
    }

    @Override
    public List<DichVu> getByMaChuyenKhoa(Integer maChuyenKhoa) {
        return repository.findByMaChuyenKhoa(maChuyenKhoa);
    }
}
