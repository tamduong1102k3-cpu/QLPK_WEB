package com.qlpk.backend.service;

import com.qlpk.backend.entity.DanhMucBenhLy;

import java.util.List;

public interface DanhMucBenhLyService {

    List<DanhMucBenhLy> getAll();

    List<DanhMucBenhLy> getBenhByChuyenKhoa(Integer maChuyenKhoa);
}
