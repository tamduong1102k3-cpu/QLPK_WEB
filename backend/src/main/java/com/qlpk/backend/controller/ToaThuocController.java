package com.qlpk.backend.controller;

import com.qlpk.backend.dto.PrescriptionRequest;
import com.qlpk.backend.entity.ChiTietToaThuoc;
import com.qlpk.backend.entity.ToaThuoc;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.service.ChiTietToaThuocService;
import com.qlpk.backend.service.ToaThuocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/toa-thuoc")
public class ToaThuocController {

    @Autowired
    private ToaThuocService toaThuocService;

    @Autowired
    private ChiTietToaThuocService chiTietService;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PrescriptionRequest request) {
        try {
            ToaThuoc savedToa = toaThuocService.createPrescription(request);
            if (savedToa != null) {
                webSocketPublisher.publishToaThuocChange("CREATED", savedToa.getMaPhieuKham());
            }
            return ResponseEntity.ok(savedToa);
        } catch (ObjectOptimisticLockingFailureException e) {

            throw e;
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/phieu-kham/{maPhieuKham}")
    public ResponseEntity<?> getByPhieuKham(@PathVariable Integer maPhieuKham) {
        return ResponseEntity.ok(toaThuocService.findByMaPhieuKham(maPhieuKham));
    }

    @GetMapping("/benh-nhan/{maBenhNhan}")
    public ResponseEntity<?> getByBenhNhan(@PathVariable Integer maBenhNhan) {
        return ResponseEntity.ok(toaThuocService.findByMaBenhNhan(maBenhNhan));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getDetails(@PathVariable Integer id) {

        return ResponseEntity.ok(chiTietService.findByMaToaThuoc(id));
    }

    @DeleteMapping("/phieu-kham/{maPhieuKham}")
    public ResponseEntity<?> deleteByPhieuKham(@PathVariable Integer maPhieuKham) {
        try {
            toaThuocService.deleteByMaPhieuKham(maPhieuKham);
            webSocketPublisher.publishToaThuocChange("DELETED", maPhieuKham);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa toa thuốc và hoàn lại số lượng đã giữ"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }
}
