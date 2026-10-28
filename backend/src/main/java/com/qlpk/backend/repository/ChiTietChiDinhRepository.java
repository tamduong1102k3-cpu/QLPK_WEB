package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiTietChiDinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChiTietChiDinhRepository extends JpaRepository<ChiTietChiDinh, Integer> {
    List<ChiTietChiDinh> findByMaPhieuChiDinh(Integer maPhieuChiDinh);
}
