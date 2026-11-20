package com.qlpk.backend.service;

import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.dto.ThuocRequestDTO;
import java.util.List;

public interface ThuocService {
    List<Thuoc> getAll();
    Thuoc getById(Integer id);
    Thuoc create(ThuocRequestDTO request);
    Thuoc update(Integer id, ThuocRequestDTO request);
    void delete(Integer id);
}