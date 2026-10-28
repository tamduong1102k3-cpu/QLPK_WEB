package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.DanhMucBenhLy;
import com.qlpk.backend.repository.DanhMucBenhLyRepository;
import com.qlpk.backend.service.DanhMucBenhLyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DanhMucBenhLyServiceImpl implements DanhMucBenhLyService {

    @Autowired
    private DanhMucBenhLyRepository danhMucBenhLyRepository;

    @Override
    public List<DanhMucBenhLy> getAll() {
        return danhMucBenhLyRepository.findAll();
    }

    @Override
    public List<DanhMucBenhLy> getBenhByChuyenKhoa(Integer maChuyenKhoa) {
        return danhMucBenhLyRepository.findByChuyenKhoaLienQuan_MaChuyenKhoa(maChuyenKhoa);
    }
}
