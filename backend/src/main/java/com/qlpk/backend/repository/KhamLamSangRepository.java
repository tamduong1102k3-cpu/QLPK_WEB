package com.qlpk.backend.repository;

import com.qlpk.backend.entity.KhamLamSang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface KhamLamSangRepository extends JpaRepository<KhamLamSang, Integer> {
    Optional<KhamLamSang> findByMaPhieuKham(Integer maPhieuKham);

    @Query("SELECT k FROM KhamLamSang k WHERE k.maPhieuKham IN (SELECT p.maPhieuKham FROM PhieuKham p WHERE p.maBenhNhan = :maBenhNhan) ORDER BY k.maPhieuKham DESC")
    List<KhamLamSang> findByMaBenhNhan(@Param("maBenhNhan") Integer maBenhNhan);
}
