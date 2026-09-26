package com.qlpk.backend.controller;

import com.qlpk.backend.entity.BangPhanCongCaLam;
import com.qlpk.backend.entity.KieuPhanCong;
import com.qlpk.backend.repository.BangPhanCongCaLamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/phan-cong/cleanup")
public class CleanupController {

    @Autowired
    private BangPhanCongCaLamRepository repository;

    @DeleteMapping("/remove-duplicates")
    public ResponseEntity<?> removeDuplicates() {
        try {
            List<BangPhanCongCaLam> allDefaults = repository.findAll().stream()
                    .filter(s -> s.getKieuPhanCong() == KieuPhanCong.MAC_DINH)
                    .toList();

            Map<String, BangPhanCongCaLam> uniqueMap = new HashMap<>();
            List<BangPhanCongCaLam> toDelete = new ArrayList<>();

            for (BangPhanCongCaLam shift : allDefaults) {
                String key = shift.getMaNhanVien() + "|" + shift.getThu() + "|" + shift.getMaCa();

                if (!uniqueMap.containsKey(key)) {

                    uniqueMap.put(key, shift);
                } else {

                    BangPhanCongCaLam existing = uniqueMap.get(key);
                    if (shift.getId() < existing.getId()) {

                        toDelete.add(existing);
                        uniqueMap.put(key, shift);
                    } else {

                        toDelete.add(shift);
                    }
                }
            }

            repository.deleteAll(toDelete);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Xóa duplicates thành công");
            response.put("deleted_count", toDelete.size());
            response.put("remaining_count", allDefaults.size() - toDelete.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            List<BangPhanCongCaLam> allDefaults = repository.findAll().stream()
                    .filter(s -> s.getKieuPhanCong() == KieuPhanCong.MAC_DINH)
                    .toList();

            Map<String, Integer> duplicateCount = new HashMap<>();
            int totalDefaults = allDefaults.size();
            int uniqueCount = 0;
            int duplicateTotal = 0;

            for (BangPhanCongCaLam shift : allDefaults) {
                String key = shift.getMaNhanVien() + "|" + shift.getThu() + "|" + shift.getMaCa();
                int count = duplicateCount.getOrDefault(key, 0) + 1;
                duplicateCount.put(key, count);
            }

            for (int count : duplicateCount.values()) {
                uniqueCount++;
                if (count > 1) {
                    duplicateTotal += (count - 1);
                }
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("total_defaults", totalDefaults);
            stats.put("unique_shifts", uniqueCount);
            stats.put("duplicate_count", duplicateTotal);
            stats.put("details", duplicateCount);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
