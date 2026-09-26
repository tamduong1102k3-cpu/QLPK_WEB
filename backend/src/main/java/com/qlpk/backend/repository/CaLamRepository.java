package com.qlpk.backend.repository;

import com.qlpk.backend.entity.CaLam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CaLamRepository extends JpaRepository<CaLam, Integer> {
    boolean existsByGioBatDauAndGioKetThuc(LocalTime gioBatDau, LocalTime gioKetThuc);

    @Query("SELECT c FROM CaLam c WHERE c.gioBatDau <= :now AND :now < c.gioKetThuc")
    Optional<CaLam> findActiveCaLamAt(@Param("now") LocalTime now);

    @Query("SELECT c FROM CaLam c ORDER BY c.id ASC")
    List<CaLam> findAllOrdered();
}
