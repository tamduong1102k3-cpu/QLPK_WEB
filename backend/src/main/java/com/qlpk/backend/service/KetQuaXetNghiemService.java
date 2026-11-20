package com.qlpk.backend.service;

import com.qlpk.backend.entity.KetQuaXetNghiem;
import com.qlpk.backend.entity.ChiTietChiDinh;
import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.service.ClsResultAuthorizationService;
import com.qlpk.backend.repository.KetQuaXetNghiemRepository;
import com.qlpk.backend.util.TimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Service
public class KetQuaXetNghiemService {

    @Autowired
    private KetQuaXetNghiemRepository repository;

    @Autowired
    private ClsResultAuthorizationService clsResultAuthorizationService;

public List<Map<String, Object>> getTodayResults() {
    LocalDate today = TimeUtil.today();
    LocalDateTime start = today.atStartOfDay();
    LocalDateTime end = today.plusDays(1).atStartOfDay();
    return repository.findResultsTodayWithPatientInfo(start, end);
}

    @Transactional
    public KetQuaXetNghiem updateStatus(Integer id, String status) {
        NhanVien doctor = clsResultAuthorizationService.requireClsDoctor();
        KetQuaXetNghiem kq = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kết quả xét nghiệm"));
        Integer latestResultId = repository
                .findFirstByMaChiTietChiDinhOrderByNgayThucHienDescIdDesc(kq.getMaChiTietChiDinh())
                .map(KetQuaXetNghiem::getId)
                .orElse(null);
        if (!id.equals(latestResultId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Kết quả không còn là bản ghi hiện hành của chi tiết chỉ định.");
        }
        ChiTietChiDinh detail = clsResultAuthorizationService.requireAuthorizedClsDetail(
                kq.getMaChiTietChiDinh(), doctor, "CLS_XET_NGHIEM");
        if (!"DA_DUYET".equals(status) || !"CHO_DUYET".equals(kq.getTrangThai())
                || !"DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kết quả không ở trạng thái chờ duyệt");
        }
        clsResultAuthorizationService.requireDoctorOwnsPendingResult(
                doctor.getMaNhanVien(), kq.getTrangThai(), kq.getMaBsKetLuan());
        kq.setTrangThai("DA_DUYET");
        kq.setMaBsKetLuan(doctor.getMaNhanVien());
        return repository.save(kq);
    }
}