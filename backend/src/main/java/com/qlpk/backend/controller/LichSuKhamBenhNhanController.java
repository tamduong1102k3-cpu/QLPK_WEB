package com.qlpk.backend.controller;

import com.qlpk.backend.config.JwtUtils;
import com.qlpk.backend.dto.ChuyenKhoaLichSuDTO;
import com.qlpk.backend.dto.KetQuaLichSuDTO;
import com.qlpk.backend.dto.PhieuKhamLichSuDTO;
import com.qlpk.backend.entity.PhieuKham;
import com.qlpk.backend.repository.HinhAnhKetQuaCdhaRepository;
import com.qlpk.backend.repository.KetQuaCdhaRepository;
import com.qlpk.backend.repository.KetQuaCdhaLichSuProjection;
import com.qlpk.backend.repository.KetQuaXetNghiemRepository;
import com.qlpk.backend.repository.KetQuaXetNghiemLichSuProjection;
import com.qlpk.backend.repository.KhamLamSangRepository;
import com.qlpk.backend.repository.LichSuKhamRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/benh-nhan/lich-su-kham")
public class LichSuKhamBenhNhanController {

    private final JwtUtils jwtUtils;
    private final LichSuKhamRepository lichSuKhamRepository;
    private final PhieuKhamRepository phieuKhamRepository;
    private final KhamLamSangRepository khamLamSangRepository;
    private final KetQuaXetNghiemRepository ketQuaXetNghiemRepository;
    private final KetQuaCdhaRepository ketQuaCdhaRepository;
    private final HinhAnhKetQuaCdhaRepository hinhAnhKetQuaCdhaRepository;

    public LichSuKhamBenhNhanController(
            JwtUtils jwtUtils,
            LichSuKhamRepository lichSuKhamRepository,
            PhieuKhamRepository phieuKhamRepository,
            KhamLamSangRepository khamLamSangRepository,
            KetQuaXetNghiemRepository ketQuaXetNghiemRepository,
            KetQuaCdhaRepository ketQuaCdhaRepository,
            HinhAnhKetQuaCdhaRepository hinhAnhKetQuaCdhaRepository) {
        this.jwtUtils = jwtUtils;
        this.lichSuKhamRepository = lichSuKhamRepository;
        this.phieuKhamRepository = phieuKhamRepository;
        this.khamLamSangRepository = khamLamSangRepository;
        this.ketQuaXetNghiemRepository = ketQuaXetNghiemRepository;
        this.ketQuaCdhaRepository = ketQuaCdhaRepository;
        this.hinhAnhKetQuaCdhaRepository = hinhAnhKetQuaCdhaRepository;
    }

    @GetMapping("/chuyen-khoa")
    public List<ChuyenKhoaLichSuDTO> getChuyenKhoaDaKham(
            @RequestHeader("Authorization") String authorization,
            @RequestParam Integer maBenhNhan) {
        validatePatient(authorization, maBenhNhan);
        return lichSuKhamRepository.findDistinctChuyenKhoa(maBenhNhan);
    }

    @GetMapping("/phieu-kham")
    public List<PhieuKhamLichSuDTO> getPhieuKhamTheoChuyenKhoa(
            @RequestHeader("Authorization") String authorization,
            @RequestParam Integer maBenhNhan,
            @RequestParam Integer maChuyenKhoa) {
        validatePatient(authorization, maBenhNhan);
        return lichSuKhamRepository.findPhieuKham(maBenhNhan, maChuyenKhoa);
    }

    @GetMapping("/ket-qua")
    public List<KetQuaLichSuDTO> getKetQuaKham(
            @RequestHeader("Authorization") String authorization,
            @RequestParam Integer maBenhNhan,
            @RequestParam Integer maPhieuKham) {
        validatePatient(authorization, maBenhNhan);

        PhieuKham phieuKham = phieuKhamRepository.findById(maPhieuKham)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiếu khám"));
        if (!maBenhNhan.equals(phieuKham.getMaBenhNhan())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Phiếu khám không thuộc về bệnh nhân này");
        }

        List<KetQuaLichSuDTO> ketQua = new ArrayList<>();
        khamLamSangRepository.findByMaPhieuKham(maPhieuKham).ifPresent(khamLamSang ->
                ketQua.add(new KetQuaLichSuDTO(
                        "KHAM_LAM_SANG",
                        khamLamSang.getChanDoanSoBo(),
                        khamLamSang.getKhamLamSang(),
                        khamLamSang.getLoiDanBacSi(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        List.of())));

        List<KetQuaXetNghiemLichSuProjection> ketQuaXetNghiem =
                ketQuaXetNghiemRepository.findLichSuDetailsByMaBenhNhanAndMaPhieuKham(maBenhNhan, maPhieuKham);
        for (KetQuaXetNghiemLichSuProjection ketQuaXN : ketQuaXetNghiem) {
            ketQua.add(new KetQuaLichSuDTO(
                    "XET_NGHIEM",
                    null,
                    null,
                    null,
                    ketQuaXN.getKetLuan(),
                    ketQuaXN.getGhiChuThem(),
                    null,
                    null,
                    ketQuaXN.getTenNhanVien(),
                    null,
                    List.of()));
        }

        List<KetQuaCdhaLichSuProjection> ketQuaCdha =
                ketQuaCdhaRepository.findLichSuDetailsByMaBenhNhanAndMaPhieuKham(maBenhNhan, maPhieuKham);
        for (KetQuaCdhaLichSuProjection ketQuaCDHA : ketQuaCdha) {
            List<String> hinhAnh = hinhAnhKetQuaCdhaRepository
                    .findByMaKetQuaCdhaOrderByThuTuAsc(ketQuaCDHA.getId())
                    .stream()
                    .map(hinh -> hinh.getDuongDanAnh())
                    .toList();
            ketQua.add(new KetQuaLichSuDTO(
                    "CDHA",
                    null,
                    null,
                    null,
                    ketQuaCDHA.getKetLuan(),
                    null,
                    ketQuaCDHA.getMoTaHinhAnh(),
                    ketQuaCDHA.getDeNghi(),
                    ketQuaCDHA.getTenNhanVien(),
                    ketQuaCDHA.getMaBacSiThucHien(),
                    hinhAnh));
        }

        return ketQua;
    }

    private void validatePatient(String authorization, Integer maBenhNhan) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu token xác thực");
        }
        String token = authorization.substring(7);
        if (!jwtUtils.validateToken(token) || jwtUtils.isRefreshToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ hoặc đã hết hạn");
        }

        Integer tokenMaBenhNhan = jwtUtils.getMaBenhNhanFromToken(token);
        if (tokenMaBenhNhan == null || tokenMaBenhNhan == 0 || !tokenMaBenhNhan.equals(maBenhNhan)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập hồ sơ bệnh nhân này");
        }
    }
}
