package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChiTietKetQuaXn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietKetQuaXnRepository extends JpaRepository<ChiTietKetQuaXn, Integer> {
    List<ChiTietKetQuaXn> findByMaKetQuaXn(Integer maKetQuaXn);
    void deleteByMaKetQuaXn(Integer maKetQuaXn);
}
