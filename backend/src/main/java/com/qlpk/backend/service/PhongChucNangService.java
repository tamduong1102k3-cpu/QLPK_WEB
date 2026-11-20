package com.qlpk.backend.service;

import com.qlpk.backend.entity.PhongChucNang;
import java.util.List;

public interface PhongChucNangService {
    List<PhongChucNang> getAll();
    List<String> getDistinctTenPhong();
    PhongChucNang getById(Integer id);
    PhongChucNang create(PhongChucNang entity);
    PhongChucNang update(Integer id, PhongChucNang entity);
    void delete(Integer id);

    List<PhongChucNang> findByMaChucVu(Integer maChucVu);

    List<PhongChucNang> findByMaChuyenKhoa(Integer maChuyenKhoa);
}