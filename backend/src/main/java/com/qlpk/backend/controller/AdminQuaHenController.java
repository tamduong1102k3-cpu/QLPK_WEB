package com.qlpk.backend.controller;

import com.qlpk.backend.repository.BenhNhanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// API admin quản trị số lần vắng (quá hẹn)
// quyền check = ROLE_QUAN_TRI_VIEN (filter tự thêm prefix ROLE_)
@RestController
@RequestMapping("/api/admin/qua-hen")
public class AdminQuaHenController {

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    // reset tay tất cả về 0 khi scheduler đầu tháng bị miss
    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<?> resetManual() {
        int rows = benhNhanRepository.resetAllSoLanQuaHen();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "resetCount", rows
        ));
    }
}
