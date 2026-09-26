package com.qlpk.backend.repository;

import com.qlpk.backend.entity.DanhMucBenhLy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DanhMucBenhLyRepository extends JpaRepository<DanhMucBenhLy, Integer> {

    List<DanhMucBenhLy> findByChuyenKhoaLienQuan_MaChuyenKhoa(Integer maChuyenKhoa);
}
