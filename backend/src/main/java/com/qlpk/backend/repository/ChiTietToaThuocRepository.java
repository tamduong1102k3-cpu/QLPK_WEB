package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiTietToaThuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChiTietToaThuocRepository extends JpaRepository<ChiTietToaThuoc, Integer> {
    List<ChiTietToaThuoc> findByMaToaThuoc(Integer maToaThuoc);
}
