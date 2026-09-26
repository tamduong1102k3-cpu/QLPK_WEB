package com.qlpk.backend.controller;

import com.qlpk.backend.dto.LichThangDTO;
import com.qlpk.backend.dto.DoctorScheduleSummaryDTO;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lich-bac-si")
public class LichBacSiController {

    @Autowired
    private BangPhanCongCaLamService bangPhanCongService;

    @GetMapping("/thang")
    public ResponseEntity<LichThangDTO> getLichThang(
            @RequestParam Integer maNhanVien,
            @RequestParam int nam,
            @RequestParam int thang) {
        try {
            LichThangDTO result = bangPhanCongService.getLichThangChoBenhNhan(maNhanVien, nam, thang);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/summary-tuan")
    public ResponseEntity<List<DoctorScheduleSummaryDTO>> getSummaryTuan(
            @RequestParam List<Integer> maNhanViens,
            @RequestParam List<String> dsThu) {
        try {
            return ResponseEntity.ok(bangPhanCongService.getSummaryTuan(maNhanViens, dsThu));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
}
