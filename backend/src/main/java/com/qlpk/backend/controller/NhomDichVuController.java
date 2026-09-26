package com.qlpk.backend.controller;

import com.qlpk.backend.entity.NhomDichVu;
import com.qlpk.backend.repository.NhomDichVuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nhom-dich-vu")
public class NhomDichVuController {

    @Autowired
    private NhomDichVuRepository repository;

    @GetMapping
    public List<NhomDichVu> getAll() {
        return repository.findAll();
    }
}
