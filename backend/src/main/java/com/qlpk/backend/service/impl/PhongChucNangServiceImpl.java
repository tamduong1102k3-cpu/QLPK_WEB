package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.ChuyenKhoa;
import com.qlpk.backend.entity.PhongChucNang;
import com.qlpk.backend.exception.DuplicateFieldException;
import com.qlpk.backend.exception.PhongChucNangValidationException;
import com.qlpk.backend.repository.ChuyenKhoaRepository;
import com.qlpk.backend.repository.PhongChucNangRepository;
import com.qlpk.backend.service.PhongChucNangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class PhongChucNangServiceImpl implements PhongChucNangService {

    private static final List<Integer> TECHNICIAN_POSITION_IDS = List.of(13, 15);

    @Autowired
    private PhongChucNangRepository repository;

    @Autowired
    private ChuyenKhoaRepository chuyenKhoaRepository;

    @Override
    public List<PhongChucNang> getAll() {
        return repository.findAll();
    }

    @Override
    public List<String> getDistinctTenPhong() {
        return repository.findDistinctTenPhong();
    }

    @Override
    public PhongChucNang getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public PhongChucNang create(PhongChucNang entity) {
        validateUniqueName(entity, null);
        validateTotalRoomCapacity(entity, null);
        return repository.save(entity);
    }

    @Override
    public PhongChucNang update(Integer id, PhongChucNang entity) {
        if (repository.existsById(id)) {
            entity.setMaPhong(id);
            validateUniqueName(entity, id);
            validateTotalRoomCapacity(entity, id);
            return repository.save(entity);
        }
        return null;
    }

    private void validateUniqueName(PhongChucNang room, Integer roomId) {
        String tenPhong = room.getTenPhong() == null ? null : room.getTenPhong().trim();
        if (tenPhong == null || tenPhong.isBlank()) {
            return;
        }
        boolean duplicate = roomId == null
                ? repository.existsByTenPhongIgnoreCase(tenPhong)
                : repository.existsByTenPhongIgnoreCaseAndMaPhongNot(tenPhong, roomId);
        if (duplicate) {
            Map<String, String> fieldErrors = new LinkedHashMap<>();
            fieldErrors.put("tenPhong", "Tên phòng đã tồn tại");
            throw new DuplicateFieldException(fieldErrors);
        }
        room.setTenPhong(tenPhong);
    }

    private void validateTotalRoomCapacity(PhongChucNang room, Integer roomIdToExclude) {
        if (room.getMaChuyenKhoa() == null
            || !TECHNICIAN_POSITION_IDS.contains(room.getMaChucVu())) {
            return;
        }

        ChuyenKhoa specialty = chuyenKhoaRepository.findById(room.getMaChuyenKhoa())
            .orElseThrow(() -> new RuntimeException("Chuyên khoa không tồn tại"));
        Integer specialtyLimit = specialty.getSoLuongToiDa();
        if (specialtyLimit == null) {
            return;
        }

        long currentTotal = repository.sumKtvQuotaByChuyenKhoa(
            room.getMaChuyenKhoa(),
            roomIdToExclude,
            TECHNICIAN_POSITION_IDS
        );
        long totalAfterSave = currentTotal
            + (room.getSoLuongToiDa() != null ? room.getSoLuongToiDa() : 0);
        if (totalAfterSave > specialtyLimit) {
            throw new PhongChucNangValidationException(
                "Tổng số lượng của các phòng KTV (" + totalAfterSave
                    + ") vượt quá giới hạn của chuyên khoa (" + specialtyLimit + ")."
            );
        }
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<PhongChucNang> findByMaChucVu(Integer maChucVu) {
        return repository.findByMaChucVu(maChucVu);
    }

    @Override
    public List<PhongChucNang> findByMaChuyenKhoa(Integer maChuyenKhoa) {
        return repository.findByMaChuyenKhoa(maChuyenKhoa);
    }
}