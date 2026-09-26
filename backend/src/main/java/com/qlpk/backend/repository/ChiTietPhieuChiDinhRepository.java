package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiTietPhieuChiDinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChiTietPhieuChiDinhRepository extends JpaRepository<ChiTietPhieuChiDinh, Integer> {
    List<ChiTietPhieuChiDinh> findByMaPhieuChiDinh(Integer maPhieuChiDinh);
}
