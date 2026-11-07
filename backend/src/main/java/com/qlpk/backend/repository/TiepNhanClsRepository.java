package com.qlpk.backend.repository;

import com.qlpk.backend.entity.TiepNhanCls;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TiepNhanClsRepository extends JpaRepository<TiepNhanCls, Integer> {
    List<TiepNhanCls> findByMaPhieuKham(Integer maPhieuKham);
}
