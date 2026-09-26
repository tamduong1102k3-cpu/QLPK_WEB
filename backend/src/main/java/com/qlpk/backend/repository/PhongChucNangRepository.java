package com.qlpk.backend.repository;

import com.qlpk.backend.entity.PhongChucNang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhongChucNangRepository extends JpaRepository<PhongChucNang, Integer> {
    List<PhongChucNang> findByMaChucVu(Integer maChucVu);
}
