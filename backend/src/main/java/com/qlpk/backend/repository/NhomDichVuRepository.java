package com.qlpk.backend.repository;

import com.qlpk.backend.entity.NhomDichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NhomDichVuRepository extends JpaRepository<NhomDichVu, Integer> {
    List<NhomDichVu> findByMaChuyenKhoa(Integer maChuyenKhoa);
}