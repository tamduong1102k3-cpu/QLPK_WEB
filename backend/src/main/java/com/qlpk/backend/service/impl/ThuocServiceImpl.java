package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.repository.ThuocRepository;
import com.qlpk.backend.service.ThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    public Thuoc create(Thuoc entity) {
        return repository.save(entity);
    }

    @Override
    @Transactional
    public Thuoc update(Integer id, Thuoc entity) {
        return repository.findById(id).map(existing -> {

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

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);

    }
}
