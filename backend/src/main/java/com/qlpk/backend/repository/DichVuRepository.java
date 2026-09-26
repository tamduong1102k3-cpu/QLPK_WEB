package com.qlpk.backend.repository;

import com.qlpk.backend.entity.DichVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DichVuRepository extends JpaRepository<DichVu, Integer> {
    List<DichVu> findByLoaiDichVuIn(List<String> loaiDichVuList);
}
