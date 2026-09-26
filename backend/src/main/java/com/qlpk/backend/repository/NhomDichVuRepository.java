package com.qlpk.backend.repository;

import com.qlpk.backend.entity.NhomDichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NhomDichVuRepository extends JpaRepository<NhomDichVu, Integer> {
}
