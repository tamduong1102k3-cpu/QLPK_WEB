package com.qlpk.backend.repository;

import com.qlpk.backend.entity.PhieuNhapThuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PhieuNhapThuocRepository extends JpaRepository<PhieuNhapThuoc, Integer> {
}
