package com.qlpk.backend.service;

import com.qlpk.backend.entity.Thuoc;
import java.util.List;

public interface ThuocService {
    List<Thuoc> getAll();
    Thuoc getById(Integer id);
    Thuoc create(Thuoc entity);
    Thuoc update(Integer id, Thuoc entity);
    void delete(Integer id);
}