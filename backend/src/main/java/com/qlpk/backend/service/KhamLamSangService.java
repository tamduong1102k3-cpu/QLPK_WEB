package com.qlpk.backend.service;

import com.qlpk.backend.entity.KhamLamSang;
import com.qlpk.backend.dto.KhamLamSangAndVitalsDTO;
import java.util.List;
import java.util.Optional;

public interface KhamLamSangService {
    List<KhamLamSang> getAll();
    KhamLamSang getById(Integer id);
    KhamLamSang create(KhamLamSang entity);
    KhamLamSang update(Integer id, KhamLamSang entity);
    void delete(Integer id);

    KhamLamSang saveAndUpdateStatus(KhamLamSang body);
    Optional<KhamLamSang> findByMaPhieuKham(Integer maPhieuKham);
    List<KhamLamSang> findByMaBenhNhan(Integer maBenhNhan);
    KhamLamSangAndVitalsDTO saveKhamLamSangAndVitals(KhamLamSangAndVitalsDTO dto);
}