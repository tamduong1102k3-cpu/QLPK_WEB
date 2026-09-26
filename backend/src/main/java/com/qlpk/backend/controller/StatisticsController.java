package com.qlpk.backend.controller;

import com.qlpk.backend.service.ThongKeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/thong-ke")
public class StatisticsController {

    @Autowired private ThongKeService thongKeService;

    @GetMapping("/theo-nam")
    public ResponseEntity<List<Map<String, Object>>> thongKeTheoNam(
            @RequestParam(defaultValue = "2026") int nam) {
        return ResponseEntity.ok(thongKeService.thongKeTheoNam(nam));
    }

    @GetMapping("/nam-co-du-lieu")
    public ResponseEntity<List<Integer>> namCoDuLieu() {
        return ResponseEntity.ok(thongKeService.namCoDuLieu());
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        return ResponseEntity.ok(thongKeService.getDashboardSummary());
    }
}
