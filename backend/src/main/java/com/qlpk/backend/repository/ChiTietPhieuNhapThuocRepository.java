package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiTietPhieuNhapThuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChiTietPhieuNhapThuocRepository extends JpaRepository<ChiTietPhieuNhapThuoc, Integer> {
    List<ChiTietPhieuNhapThuoc> findByMaPhieuNhapThuoc(Integer maPhieuNhapThuoc);
}
