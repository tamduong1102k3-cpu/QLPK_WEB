package com.qlpk.backend.repository;

import com.qlpk.backend.entity.Thuoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ThuocRepository extends JpaRepository<Thuoc, Integer> {
}
