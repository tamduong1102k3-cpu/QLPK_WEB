package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.BangPhanCongCaLam;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.NguonTao;
import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.LichKhamService;
import com.qlpk.backend.util.TimeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LichKhamServiceImpl implements LichKhamService {

    @Autowired
    private LichKhamRepository repository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private ChuyenKhoaRepository chuyenKhoaRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private CaLamRepository caLamRepository;

    @Autowired
    private PhongChucNangRepository phongChucNangRepository;

    @Autowired
    private BangPhanCongCaLamRepository bangPhanCongCaLamRepository;

    private LichKham populateDisplayNames(LichKham entity) {
        if (entity == null) return null;

        if (entity.getMaBenhNhan() != null) {
            benhNhanRepository.findById(entity.getMaBenhNhan()).ifPresent(bn -> {
                entity.setTenBenhNhan(bn.getHoTen());
                entity.setDaXacMinhDanhTinh(Boolean.TRUE.equals(bn.getDaXacMinhDanhTinh()));
            });
        }

        if (entity.getMaBacSi() != null) {
            nhanVienRepository.findById(entity.getMaBacSi()).ifPresent(nv -> {
                entity.setTenBacSi(nv.getHoTen());
            });
        }

        if (entity.getMaChuyenKhoa() != null) {
            chuyenKhoaRepository.findById(entity.getMaChuyenKhoa()).ifPresent(ck -> {
                entity.setTenChuyenKhoa(ck.getTenChuyenKhoa());
            });
        }

        if (entity.getMaDichVu() != null && entity.getMaDichVu() > 0) {
            dichVuRepository.findById(entity.getMaDichVu()).ifPresent(dv -> {
                entity.setTenDichVu(dv.getTenDichVu());
            });
        }

        if (entity.getMaCa() != null) {
            caLamRepository.findById(entity.getMaCa()).ifPresent(ca -> {
                entity.setTenCa(ca.getTenCa());
                entity.setGioBatDau(ca.getGioBatDau());
                entity.setGioKetThuc(ca.getGioKetThuc());
            });
        }

        if (entity.getMaPhong() != null) {
            phongChucNangRepository.findById(entity.getMaPhong()).ifPresent(p -> {
                entity.setTenPhong(p.getTenPhong());
            });
        }

        return entity;
    }

    private List<LichKham> populateDisplayNames(List<LichKham> entities) {
        if (entities == null) return List.of();
        return entities.stream()
                .map(this::populateDisplayNames)
                .collect(Collectors.toList());
    }

    private void validateShiftIfPresent(Integer maBacSi, LocalDate ngayKham, Integer maCa) {
        if (maBacSi == null && ngayKham == null && maCa == null) {
            return;
        }
        if (maBacSi == null || ngayKham == null || maCa == null) {
            throw new RuntimeException("Thiếu thông tin bác sĩ, ngày khám hoặc ca khám.");
        }

        List<BangPhanCongCaLam> shifts = bangPhanCongCaLamRepository.findByMaNhanVien(maBacSi);
        List<BangPhanCongCaLam> caTrongNgay = BangPhanCongCaLamServiceImpl
                .resolveScheduleForDay(shifts, ngayKham);
        if (caTrongNgay.isEmpty()) {
            throw new RuntimeException("Bác sĩ không làm việc vào ngày " + ngayKham + ".");
        }

        boolean caHopLe = caTrongNgay.stream()
                .anyMatch(shift -> shift.getCa() != null && maCa.equals(shift.getCa().getId()));
        if (!caHopLe) {
            throw new RuntimeException("Ca khám đã chọn không nằm trong lịch làm việc của bác sĩ ngày " + ngayKham + ".");
        }
    }

    @Override
    public List<LichKham> getAll() {
        return populateDisplayNames(repository.findAll());
    }

    @Override
    public LichKham getById(Integer id) {
        return populateDisplayNames(repository.findById(id).orElse(null));
    }

    @Override
    @Transactional
    public LichKham create(LichKham entity, Integer maNhanVienThucHien) {
        Integer maBenhNhan = entity.getMaBenhNhan();
        if (maBenhNhan == null) {
            throw new RuntimeException("Thiếu thông tin bệnh nhân");
        }

        NguonTao nguonTao = entity.getNguonTao();
        if (nguonTao == null) {
            nguonTao = NguonTao.DAT_LICH_APP;
        }

        if (nguonTao == NguonTao.DAT_LICH_APP) {

            if (!canBookAppointment(maBenhNhan)) {
                throw new RuntimeException("Bạn đã hủy quá nhiều lịch hẹn trong 30 ngày qua. Vui lòng liên hệ phòng khám để được hỗ trợ.");
            }

            if (hasActiveAppointment(maBenhNhan)) {
                throw new RuntimeException("Bạn đã có một lịch hẹn đang chờ xử lý hoặc đã xác nhận. Vui lòng hoàn thành hoặc hủy lịch hẹn hiện tại trước khi đặt lịch mới.");
            }

            if (entity.getNgayKham() != null) {
                LocalDate maxDate = TimeUtil.today().plusDays(60);
                if (entity.getNgayKham().isAfter(maxDate)) {
                    throw new RuntimeException("Chỉ có thể đặt lịch hẹn trong vòng 60 ngày kể từ hôm nay.");
                }
                if (entity.getNgayKham().isBefore(TimeUtil.today())) {
                    throw new RuntimeException("Không thể đặt lịch hẹn ở quá khứ.");
                }
            }

            if (entity.getNgayKham() != null) {
                long trungTuDat = repository.countTuDatCungCa(
                    maBenhNhan, entity.getNgayKham(), entity.getMaCa());
                if (trungTuDat > 0) {
                    throw new RuntimeException("Bạn đã có lịch hẹn vào ca này trong ngày. Vui lòng chọn ca khác.");
                }

                long trungTaiKham = repository.countTaiKhamCungCa(
                    maBenhNhan, entity.getNgayKham(), entity.getMaCa());
                if (trungTaiKham > 0) {
                    throw new RuntimeException(
                        "Lịch hẹn trùng với lịch tái khám của bạn vào ca này. " +
                        "Vui lòng chọn ca khác hoặc liên hệ phòng khám để được hỗ trợ.");
                }
            }
        }

        validateShiftIfPresent(entity.getMaBacSi(), entity.getNgayKham(), entity.getMaCa());

        entity.setMaNguoiCapNhat(maNhanVienThucHien);

        LichKham saved = repository.save(entity);

        return populateDisplayNames(saved);
    }

    @Override
    @Transactional
    public LichKham update(Integer id, LichKham entity, Integer maNhanVienThucHien) {

        LichKham existing = repository.findByIdForUpdate(id).orElse(null);
        if (existing == null) return null;

        if (!List.of("CHUA_DEN", "QUA_HEN").contains(existing.getTrangThai())) {
            throw new RuntimeException("Lịch hẹn đã check-in hoặc đã xử lý, không thể sửa.");
        }

        if (entity.getNgayKham() != null && !entity.getNgayKham().equals(existing.getNgayKham())) {
            throw new RuntimeException("Không thể đổi ngày khám qua chức năng cập nhật. Vui lòng dùng chức năng Hoãn lịch.");
        }

        Integer maBacSi = entity.getMaBacSi() != null ? entity.getMaBacSi() : existing.getMaBacSi();
        Integer maChuyenKhoa = entity.getMaChuyenKhoa() != null ? entity.getMaChuyenKhoa() : existing.getMaChuyenKhoa();
        LocalDate ngayKham = entity.getNgayKham() != null ? entity.getNgayKham() : existing.getNgayKham();

        if (maBacSi != null && maChuyenKhoa != null) {
            NhanVien bacSi = nhanVienRepository.findById(maBacSi)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bác sĩ."));
            if (!maChuyenKhoa.equals(bacSi.getChuyenKhoa())) {
                throw new RuntimeException("Bác sĩ này không thuộc chuyên khoa đã chọn.");
            }
        }

        if (entity.getMaCa() != null) {
            validateShiftIfPresent(maBacSi, ngayKham, entity.getMaCa());
        }

        if (entity.getMaBenhNhan() != null) existing.setMaBenhNhan(entity.getMaBenhNhan());
        if (entity.getMaChuyenKhoa() != null) existing.setMaChuyenKhoa(entity.getMaChuyenKhoa());
        if (entity.getMaBacSi() != null) existing.setMaBacSi(entity.getMaBacSi());
        if (entity.getMaDichVu() != null) existing.setMaDichVu(entity.getMaDichVu());
        if (entity.getMaPhong() != null) existing.setMaPhong(entity.getMaPhong());
        if (entity.getMaDangKyKhamBenh() != null) existing.setMaDangKyKhamBenh(entity.getMaDangKyKhamBenh());
        if (entity.getMaLichKhamGoc() != null) existing.setMaLichKhamGoc(entity.getMaLichKhamGoc());
        if (entity.getMaCa() != null) existing.setMaCa(entity.getMaCa());
        if (entity.getNguonTao() != null) existing.setNguonTao(entity.getNguonTao());
        if (entity.getNgayKham() != null) existing.setNgayKham(entity.getNgayKham());
        if (entity.getTrangThai() != null) existing.setTrangThai(entity.getTrangThai());
        if (entity.getGhiChu() != null) existing.setGhiChu(entity.getGhiChu());
        existing.setMaNguoiCapNhat(maNhanVienThucHien);

        LichKham saved = repository.save(existing);

        return populateDisplayNames(saved);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public List<LichKham> getByBenhNhan(Integer maBenhNhan) {
        return populateDisplayNames(repository.findByMaBenhNhan(maBenhNhan));
    }

    @Override
    public List<LichKham> getByBacSi(Integer maBacSi) {
        return populateDisplayNames(repository.findByMaBacSi(maBacSi));
    }

    @Override
    public List<LichKham> getByNgayKham(LocalDate ngayKham) {
        return populateDisplayNames(repository.findByNgayKham(ngayKham));
    }

    @Override
    public List<LichKham> getByChuyenKhoa(Integer maChuyenKhoa) {
        return populateDisplayNames(repository.findByMaChuyenKhoa(maChuyenKhoa));
    }

    @Override
    public List<LichKham> getByNguonTao(NguonTao nguonTao) {
        return populateDisplayNames(repository.findByNguonTao(nguonTao));
    }

    @Override
    public List<LichKham> getByTrangThai(String trangThai) {
        return populateDisplayNames(repository.findByTrangThai(trangThai));
    }

    @Override
    public List<LichKham> getAppointmentsByDate(LocalDate ngayKham) {
        return populateDisplayNames(repository.findAppointmentsByDate(ngayKham));
    }

    @Override
    public List<LichKham> getAppointmentsByDoctorAndDate(Integer maBacSi, LocalDate ngayKham) {
        return populateDisplayNames(repository.findAppointmentsByDoctorAndDate(maBacSi, ngayKham));
    }

    @Override
    public List<LichKham> getAppointmentsBetweenDates(LocalDate startDate, LocalDate endDate) {
        return populateDisplayNames(repository.findAppointmentsBetweenDates(startDate, endDate));
    }

    @Override
    @Transactional
    public LichKham updateTrangThai(Integer id, String trangThai) {
        return repository.findById(id).map(lichKham -> {
            lichKham.setTrangThai(trangThai);
            LichKham saved = repository.save(lichKham);
            return populateDisplayNames(saved);
        }).orElse(null);
    }

    @Override
    public List<LichKham> searchAppointments(String trangThai, Integer maChuyenKhoa, Integer maDichVu, LocalDate ngayKham) {
        return populateDisplayNames(repository.searchAppointments(
            (trangThai != null && !trangThai.isEmpty()) ? trangThai : null,
            maChuyenKhoa != null && maChuyenKhoa > 0 ? maChuyenKhoa : null,
            maDichVu != null && maDichVu > 0 ? maDichVu : null,
            ngayKham
        ));
    }

    private String normalize(String s) {
        if (s == null) return "";
        String temp = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD);

        temp = temp.replaceAll("\\p{M}", "");

        temp = temp.replace("đ", "d").replace("Đ", "D");
        return temp.toLowerCase();
    }

    @Override
    public List<LichKham> searchAppointmentsByKeyword(String trangThai, NguonTao nguonTao, String keyword) {

        List<LichKham> list = repository.searchAppointmentsByKeyword(
            (trangThai != null && !trangThai.isEmpty() && !"ALL".equals(trangThai)) ? trangThai : null,
            nguonTao
        );

        list = populateDisplayNames(list);

        if (keyword != null && !keyword.isEmpty()) {
            String kw = normalize(keyword);
            list = list.stream().filter(l ->
                (l.getTenBenhNhan() != null && normalize(l.getTenBenhNhan()).contains(kw)) ||
                (l.getTenBacSi() != null && normalize(l.getTenBacSi()).contains(kw)) ||
                (l.getTenChuyenKhoa() != null && normalize(l.getTenChuyenKhoa()).contains(kw)) ||
                (l.getTenDichVu() != null && normalize(l.getTenDichVu()).contains(kw)) ||
                (l.getGhiChu() != null && normalize(l.getGhiChu()).contains(kw)) ||
                normalize(String.valueOf(l.getId())).contains(kw) ||
                normalize(String.valueOf(l.getMaBenhNhan())).contains(kw)
            ).toList();
        }
        return list;
    }

    @Override
    public int countCancellationsLast30Days(Integer maBenhNhan) {
        if (maBenhNhan == null) return 0;
        LocalDateTime since = TimeUtil.now().minusDays(30);
        return (int) repository.countCancellationsSince(maBenhNhan, since);
    }

    @Override
    public boolean canBookAppointment(Integer maBenhNhan) {
        return countCancellationsLast30Days(maBenhNhan) < 3;
    }

    @Override
    public boolean hasActiveAppointment(Integer maBenhNhan) {
        if (maBenhNhan == null) return false;
        return repository.countActiveByMaBenhNhan(maBenhNhan) > 0;
    }

    @Override
    public boolean isDuplicateDateTime(Integer maBenhNhan, LocalDate ngayKham, Integer maCa) {

        if (maBenhNhan == null || ngayKham == null || maCa == null) return false;
        return repository.countByMaBenhNhanAndNgayKhamAndMaCa(maBenhNhan, ngayKham, maCa) > 0;
    }

    @Override
    @Transactional
    public LichKham huyLich(Integer id, Integer maNhanVienThucHien) {

        LichKham lich = repository.findByIdForUpdate(id).orElse(null);
        if (lich == null) {
            throw new RuntimeException("Không tìm thấy lịch hẹn: " + id);
        }

        if (!"CHUA_DEN".equals(lich.getTrangThai())) {
            throw new RuntimeException(
                "Lịch hẹn đã được xử lý trước đó (có thể đã check-in, đã khám, quá hẹn, hoặc đã hủy). " +
                "Vui lòng tải lại trang."
            );
        }

        lich.setTrangThai("HUY");

        lich.setMaNguoiCapNhat(maNhanVienThucHien);
        LichKham saved = repository.save(lich);

        return populateDisplayNames(saved);
    }

    @Override
    @Transactional
    public LichKham hoanLich(Integer maLichKhamCu, LichKham lichMoi, String lyDo, Integer maNhanVienThucHien) {

        LichKham lichCu = repository.findByIdForUpdate(maLichKhamCu)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn: " + maLichKhamCu));
        LocalDate ngayCu = lichCu.getNgayKham();

        if (!"CHUA_DEN".equals(lichCu.getTrangThai())) {
            throw new RuntimeException("Lịch hẹn không còn ở trạng thái có thể hoãn.");
        }

        LocalDate ngayMoi = lichMoi.getNgayKham();
        if (ngayMoi == null) {
            throw new RuntimeException("Thiếu ngày khám mới khi hoãn lịch.");
        }
        if (!ngayMoi.isAfter(TimeUtil.today())) {
            throw new RuntimeException("Ngày hoãn phải từ ngày mai trở đi.");
        }

        if (ngayMoi.equals(ngayCu)) {
            throw new RuntimeException(
                "Ngày hoãn phải khác ngày khám hiện tại. Nếu muốn đổi ca, dùng chức năng cập nhật."
            );
        }

        if (lyDo == null || lyDo.isBlank()) {
            throw new RuntimeException("Vui lòng nhập lý do hoãn lịch.");
        }

        Integer maCaMoi = lichMoi.getMaCa();
        if (maCaMoi == null) {
            throw new RuntimeException("Thiếu thông tin ca khám mới.");
        }
        Integer maBacSiMoi = lichMoi.getMaBacSi() != null
                ? lichMoi.getMaBacSi()
                : lichCu.getMaBacSi();
        validateShiftIfPresent(maBacSiMoi, ngayMoi, maCaMoi);

        boolean trungLich = isDuplicateDateTime(lichCu.getMaBenhNhan(), ngayMoi, maCaMoi);
        if (trungLich) {
            throw new RuntimeException(
                "Bệnh nhân đã có lịch hẹn khác cùng ca trong ngày " + ngayMoi + "."
            );
        }

        lichCu.setTrangThai("HOAN");
        lichCu.setLyDoHoan(lyDo);

        lichCu.setMaNguoiCapNhat(maNhanVienThucHien);
        repository.save(lichCu);

        LichKham lichMoiFinal = new LichKham();
        lichMoiFinal.setMaBenhNhan(lichCu.getMaBenhNhan());
        lichMoiFinal.setMaChuyenKhoa(lichMoi.getMaChuyenKhoa() != null
                ? lichMoi.getMaChuyenKhoa() : lichCu.getMaChuyenKhoa());
        lichMoiFinal.setMaBacSi(maBacSiMoi);
        lichMoiFinal.setMaDichVu(lichMoi.getMaDichVu() != null
                ? lichMoi.getMaDichVu() : lichCu.getMaDichVu());
        lichMoiFinal.setMaPhong(lichMoi.getMaPhong() != null
                ? lichMoi.getMaPhong() : lichCu.getMaPhong());
        lichMoiFinal.setNguonTao(lichCu.getNguonTao());
        lichMoiFinal.setNgayKham(ngayMoi);
        lichMoiFinal.setMaCa(maCaMoi);
        lichMoiFinal.setMaLichKhamGoc(maLichKhamCu);
        lichMoiFinal.setTrangThai("CHUA_DEN");

        lichMoiFinal.setMaNguoiCapNhat(maNhanVienThucHien);

        LichKham saved = repository.save(lichMoiFinal);

        return populateDisplayNames(saved);
    }
}
