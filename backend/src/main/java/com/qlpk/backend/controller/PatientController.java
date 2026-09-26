package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.dto.LinkPatientRequest;
import com.qlpk.backend.entity.BenhNhan;
import com.qlpk.backend.service.PatientService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private JwtUtils jwtUtils;

    private Integer getMaTaiKhoanBnFromToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            return jwtUtils.getMaTaiKhoanBnFromToken(token);
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<?> createPatient(HttpServletRequest request, @RequestBody BenhNhan benhNhan) {
        Integer maTaiKhoanBn = getMaTaiKhoanBnFromToken(request);
        if (maTaiKhoanBn == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Token không hợp lệ hoặc không được cung cấp!"));
        }

        try {
            BenhNhan created = patientService.createPatientAndLink(maTaiKhoanBn, benhNhan);
            return ResponseEntity.ok(Map.of(
                    "message", "Tạo hồ sơ bệnh nhân và liên kết thành công!",
                    "maBenhNhan", created.getMaBenhNhan(),
                    "data", created
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/link")
    public ResponseEntity<?> linkExistingPatient(HttpServletRequest request, @RequestBody LinkPatientRequest linkRequest) {
        Integer maTaiKhoanBn = getMaTaiKhoanBnFromToken(request);
        if (maTaiKhoanBn == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Token không hợp lệ hoặc không được cung cấp!"));
        }

        if (linkRequest.getHoTen() == null || linkRequest.getSoDienThoai() == null || linkRequest.getCccd() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Vui lòng cung cấp đầy đủ thông tin: họ tên, số điện thoại, CCCD!"
            ));
        }

        try {
            BenhNhan linked = patientService.linkExistingPatient(
                    maTaiKhoanBn,
                    linkRequest.getHoTen(),
                    linkRequest.getSoDienThoai(),
                    linkRequest.getCccd()
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Liên kết hồ sơ bệnh nhân thành công!",
                    "maBenhNhan", linked.getMaBenhNhan(),
                    "data", linked
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
