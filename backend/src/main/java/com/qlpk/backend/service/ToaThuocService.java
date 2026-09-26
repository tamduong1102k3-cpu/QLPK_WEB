package com.qlpk.backend.service;

import com.qlpk.backend.dto.PrescriptionRequest;
import com.qlpk.backend.entity.ToaThuoc;
import java.util.List;

public interface ToaThuocService {
    List<ToaThuoc> getAll();
    ToaThuoc getById(Integer id);
    ToaThuoc create(ToaThuoc entity);
    ToaThuoc update(Integer id, ToaThuoc entity);
    void delete(Integer id);

    ToaThuoc createPrescription(PrescriptionRequest request) throws Exception;
    List<ToaThuoc> findByMaPhieuKham(Integer maPhieuKham);
    List<ToaThuoc> findByMaBenhNhan(Integer maBenhNhan);

    void deleteByMaPhieuKham(Integer maPhieuKham) throws Exception;
}
