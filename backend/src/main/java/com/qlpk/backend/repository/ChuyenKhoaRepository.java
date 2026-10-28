package com.qlpk.backend.repository;

import com.qlpk.backend.entity.ChuyenKhoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChuyenKhoaRepository extends JpaRepository<ChuyenKhoa, Integer> {
    java.util.Optional<ChuyenKhoa> findByTenChuyenKhoa(String tenChuyenKhoa);
}
