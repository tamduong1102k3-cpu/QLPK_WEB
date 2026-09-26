package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiTietXetNghiem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietXetNghiemRepository extends JpaRepository<ChiTietXetNghiem, Integer> {
    List<ChiTietXetNghiem> findByMaDichVuOrderByThuTuAsc(Integer maDichVu);
}
