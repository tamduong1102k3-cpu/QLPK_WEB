package com.qlpk.backend.service;

import com.qlpk.backend.entity.ChiSoKhamTongHop;
import java.util.List;
import java.util.Optional;

public interface ChiSoKhamTongHopService {
    List<ChiSoKhamTongHop> getAll();
    ChiSoKhamTongHop getById(Integer id);
    ChiSoKhamTongHop create(ChiSoKhamTongHop entity);
    ChiSoKhamTongHop update(Integer id, ChiSoKhamTongHop entity);
    void delete(Integer id);

    ChiSoKhamTongHop saveAndUpdatePhieuKham(ChiSoKhamTongHop body);
    Optional<ChiSoKhamTongHop> findByMaPhieuKham(Integer maPhieuKham);

    List<ChiSoKhamTongHop> findAllByMaPhieuKham(Integer maPhieuKham);
}
