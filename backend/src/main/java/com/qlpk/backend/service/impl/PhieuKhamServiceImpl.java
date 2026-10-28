package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.CheckInRequest;
import com.qlpk.backend.entity.*;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.*;
import com.qlpk.backend.service.PhieuKhamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Lớp triển khai nghiệp vụ phiếu khám: tiếp đón bệnh nhân, phân luồng trạng thái
 * khám (chờ bác sĩ, chờ CLS, hoàn thành) và quản lý các phiếu chỉ định dịch vụ
 * CLS phát sinh trong quá trình khám.
 */
@Service
public class PhieuKhamServiceImpl
 implements PhieuKhamService {

    @Autowired
    private PhieuKhamRepository repository;

    @Autowired
    private DangKyKhamBenhRepository dangKyRepository;

    @Autowired
    private ChuyenKhoaRepository chuyenKhoaRepository;

    @Autowired
    private PhieuChiDinhRepository phieuChiDinhRepository;

    @Autowired
    private ChiTietChiDinhRepository chiTietRepository;

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private KetQuaXetNghiemRepository ketQuaXetNghiemRepository;

    @Autowired
    private KetQuaCdhaRepository ketQuaCdhaRepository;

    @Autowired
    private TiepNhanClsRepository tiepNhanClsRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    /** Lấy danh sách toàn bộ phiếu khám. */
    @Override
    public List<PhieuKham> getAll() {
        return repository.findAll();
    }

    /**
     * Lấy phiếu khám theo mã.
     *
     * @param id mã phiếu khám
     * @return phiếu khám tương ứng, hoặc {@code null} nếu không tồn tại
     */
    @Override
    public PhieuKham getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    /**
     * Lấy lịch sử khám của bác sĩ/điều dưỡng theo chuyên khoa.
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách lịch sử khám
     */
    @Override
public List<Map<String, Object>> getAssistantHistory(Integer maChuyenKhoa) {
    return repository.findAssistantHistory(maChuyenKhoa);
}

    /**
     * Tạo phiếu khám mới.
     * <p>
     * Nếu bệnh nhân đã có phiếu khám chưa hoàn thành trong cùng ngày và cùng chuyên khoa
     * thì trả về phiếu cũ thay vì tạo mới, tránh tạo trùng.
     * </p>
     *
     * @param entity thông tin phiếu khám cần tạo
     * @return phiếu khám đã lưu (hoặc phiếu đang tồn tại nếu bị trùng)
     */
    @Override
    @Transactional
    public PhieuKham create(PhieuKham entity) {
        if (entity.getNgayKham() == null) {
            entity.setNgayKham(LocalDateTime.now());
        }
        if (entity.getNgayTao() == null) {
            entity.setNgayTao(LocalDateTime.now());
        }
        if (entity.getTrangThai() == null) {
            entity.setTrangThai("CHO");
        }

        if (entity.getMaBenhNhan() != null && entity.getMaChuyenKhoa() != null) {
            List<PhieuKham> existing = repository.findByMaBenhNhanAndMaChuyenKhoaAndNgayKhamBetween(
                entity.getMaBenhNhan(),
                entity.getMaChuyenKhoa(),
                entity.getNgayKham().withHour(0).withMinute(0).withSecond(0),
                entity.getNgayKham().withHour(23).withMinute(59).withSecond(59)
            );
            if (existing != null && !existing.isEmpty()) {
                PhieuKham unfinished = null;
                for (PhieuKham pk : existing) {
                    if (!"HOAN_THANH".equals(pk.getTrangThai())) {
                        unfinished = pk;
                        break;
                    }
                }
                if (unfinished != null) {
                    return unfinished;
                }
            }
        }

        PhieuKham saved = repository.save(entity);
        webSocketPublisher.publishPhieuKhamChange("CREATED", saved);

        return saved;
    }

    /**
     * Cập nhật các trường có thể thay đổi của phiếu khám (nhân viên, chuyên khoa, trạng thái, ghi chú).
     *
     * @param id mã phiếu khám cần cập nhật
     * @param entity dữ liệu cập nhật; các trường {@code null} sẽ được giữ nguyên
     * @return phiếu khám sau khi cập nhật, hoặc {@code null} nếu không tìm thấy
     */
    @Override
    public PhieuKham update(Integer id, PhieuKham entity) {
        return repository.findById(id).map(existing -> {
            if (entity.getMaNhanVien() != null) existing.setMaNhanVien(entity.getMaNhanVien());
            if (entity.getMaChuyenKhoa() != null) existing.setMaChuyenKhoa(entity.getMaChuyenKhoa());
            if (entity.getTrangThai() != null) existing.setTrangThai(entity.getTrangThai());
            if (entity.getGhiChu() != null) existing.setGhiChu(entity.getGhiChu());

            PhieuKham saved = repository.save(existing);
            webSocketPublisher.publishPhieuKhamChange("UPDATED", saved);
            return saved;
        }).orElse(null);
    }

    /** Xoá phiếu khám theo mã. */
    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    /**
     * Lấy danh sách phiếu khám có ngày khám là hôm nay.
     *
     * @return danh sách phiếu khám trong ngày
     */
    @Override
    public List<PhieuKham> getToday() {
        LocalDateTime start = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime end = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        return repository.findByNgayKhamBetween(start, end);
    }

    /**
     * Tiếp đón đầy đủ bệnh nhân tại quầy lễ tân: kiểm tra sức chứa chuyên khoa trong ngày,
     * tạo hồ sơ đăng ký khám, gán số thứ tự và đánh dấu đã xác minh danh tính nếu lễ tân
     * đã đối chiếu CCCD thành công.
     *
     * @param request yêu cầu tiếp đón chứa bệnh nhân, chuyên khoa, nhân viên lễ tân và dịch vụ
     * @return thông báo thành công kèm số thứ tự và cờ {@code hasPhieuKham}
     * @throws Exception nếu thiếu mã bệnh nhân/chuyên khoa, không tìm thấy chuyên khoa
     *                   hoặc chuyên khoa đã đạt số lượng tối đa trong ngày
     */
    @Override
    @Transactional
    public Map<String, Object> fullCheckIn(CheckInRequest request) throws Exception {
        if (request.getMaBenhNhan() == null || request.getMaChuyenKhoa() == null) {
            throw new Exception("Thiếu mã bệnh nhân hoặc chuyên khoa");
        }

        ChuyenKhoa ck = chuyenKhoaRepository.findById(request.getMaChuyenKhoa()).orElse(null);
        if (ck == null) {
            throw new Exception("Không tìm thấy chuyên khoa");
        }
        String tenCK = ck.getTenChuyenKhoa().toLowerCase();

        if (ck.getSoLuongToiDa() != null && ck.getSoLuongToiDa() > 0) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);
            long todayCount = dangKyRepository.countTodayRegistrationsByChuyenKhoa(startOfDay, endOfDay, request.getMaChuyenKhoa());
            if (todayCount >= ck.getSoLuongToiDa()) {
                throw new Exception("Chuyên khoa '" + ck.getTenChuyenKhoa() + "' đã đạt số lượng tối đa hôm nay (" + ck.getSoLuongToiDa() + "). Vui lòng chọn chuyên khoa khác hoặc quay lại vào ngày mai.");
            }
        }

        DangKyKhamBenh dk = new DangKyKhamBenh();
        dk.setMaBenhNhan(request.getMaBenhNhan());
        dk.setMaNhanVien(request.getMaNhanVienLeTan());
        dk.setMaChuyenKhoa(request.getMaChuyenKhoa());
        dk.setThoiGianDangKy(LocalDateTime.now());
        dk.setTrangThai("CHO_KHAM");
        dk.setMaDichVu(request.getMaDichVu());

        String note = request.getGhiChu();
        if (request.getMaDichVu() != null) {
            note = "[Dịch vụ ID: " + request.getMaDichVu() + "] " + (note != null ? note : "");
        }
        dk.setGhiChu(note);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long count = dangKyRepository.countTodayRegistrations(startOfDay, endOfDay);
        dk.setSoThuTu((int)count + 1);

        DangKyKhamBenh savedDk = dangKyRepository.saveAndFlush(dk);
        webSocketPublisher.publishDangKyKhamChange("CREATED", savedDk.getId(), savedDk.getTrangThai());

        // Nếu lễ tân đã đối chiếu CCCD thành công → đánh dấu đã xác minh danh tính
        if (Boolean.TRUE.equals(request.getXacNhanCccd())) {
            benhNhanRepository.findById(request.getMaBenhNhan()).ifPresent(bn -> {
                bn.setDaXacMinhDanhTinh(true);
                benhNhanRepository.save(bn);
            });
        }

        return Map.of(
            "message", "Tiếp đón thành công",
            "soThuTu", dk.getSoThuTu(),
            "hasPhieuKham", false
        );
    }

    /**
     * Tiếp nhận bệnh nhân tại khoa: tạo phiếu khám mới, liên kết với hồ sơ đăng ký
     * và chuyển hồ sơ sang trạng thái đang khám.
     *
     * @param registrationId mã hồ sơ đăng ký khám
     * @param assistantId mã nhân viên tiếp nhận; nếu {@code null} thì lấy nhân viên của hồ sơ
     * @return thông báo thành công kèm mã phiếu khám và hồ sơ đăng ký
     * @throws Exception nếu không tìm thấy hồ sơ đăng ký hoặc bệnh nhân đã có phiếu khám
     */
    @Override
    @Transactional
    public Map<String, Object> acceptPatient(Integer registrationId, Integer assistantId) throws Exception {
        DangKyKhamBenh dk = dangKyRepository.findById(registrationId).orElse(null);
        if (dk == null) {
            throw new Exception("Không tìm thấy hồ sơ đăng ký khám");
        }
        if (dk.getMaPhieuKham() != null) {
            throw new Exception("Bệnh nhân này đã có phiếu khám");
        }

        PhieuKham pk = new PhieuKham();
        pk.setMaBenhNhan(dk.getMaBenhNhan());
        pk.setMaChuyenKhoa(dk.getMaChuyenKhoa());
        pk.setMaNhanVien(assistantId != null ? assistantId : dk.getMaNhanVien()); 
        pk.setNgayKham(LocalDateTime.now());
        pk.setNgayTao(LocalDateTime.now());
        pk.setTrangThai("CHO");
        pk.setMaDichVu(dk.getMaDichVu());
        PhieuKham savedPk = repository.saveAndFlush(pk);
        webSocketPublisher.publishPhieuKhamChange("CREATED", savedPk);

        dk.setMaPhieuKham(savedPk.getMaPhieuKham());
        dk.setTrangThai("DANG_KHAM");
        dangKyRepository.saveAndFlush(dk);
        webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());

        return Map.of(
            "message", "Đã tạo phiếu khám thành công", 
            "phieuKhamId", savedPk.getMaPhieuKham(),
            "registration", dk
        );
    }

    /**
     * Lấy lịch sử khám chi tiết của bác sĩ.
     *
     * @param maBacSi mã bác sĩ cần lọc
     * @return danh sách lịch sử khám
     */
    @Override
    public List<Map<String, Object>> getHistory(Integer maBacSi) {
        return repository.findHistoryDetailed(maBacSi);
    }


    /**
     * Chuyển phiếu khám và hồ sơ đăng ký sang trạng thái chờ bác sĩ.
     *
     * @param maPhieuKham mã phiếu khám
     * @throws Exception nếu không tìm thấy phiếu khám
     */
    @Override
@Transactional
public void updateToWaitingForDoctor(Integer maPhieuKham) throws Exception {
    PhieuKham pk = repository.findById(maPhieuKham)
            .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));
    pk.setTrangThai("CHO_BAC_SI");
    repository.save(pk);
    webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

    dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
        dk.setTrangThai("CHO_BAC_SI");
        dangKyRepository.save(dk);
        webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
    });
}

    /**
     * Chuyển phiếu khám và hồ sơ đăng ký sang trạng thái chờ thực hiện CLS.
     *
     * @param maPhieuKham mã phiếu khám
     * @throws Exception nếu không tìm thấy phiếu khám
     */
    @Override
    @Transactional
    public void updateToChoCls(Integer maPhieuKham) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham)
                .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));
        pk.setTrangThai("CHO_CLS");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("CHO_CLS");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
        });
    }

    /**
     * Kết thúc buổi khám: đánh dấu phiếu khám, hồ sơ đăng ký và lịch khám là hoàn thành;
     * đồng thời hoàn thành các phiếu chỉ định mà mọi dịch vụ con đều đã thực hiện.
     *
     * @param maPhieuKham mã phiếu khám
     * @throws Exception nếu không tìm thấy phiếu khám
     */
    @Override
    @Transactional
    public void finishConsultation(Integer maPhieuKham) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham).orElse(null);
        if (pk == null) throw new Exception("Không tìm thấy phiếu khám");

        pk.setTrangThai("HOAN_THANH");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("HOAN_THANH");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());

            lichKhamRepository.findByMaDangKyKhamBenh(dk.getId()).ifPresent(lk -> {
                lk.setTrangThai("HOAN_THANH");
                lichKhamRepository.save(lk);
            });
        });

        phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham).forEach(pcd -> {
            List<ChiTietChiDinh> allDetails = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            boolean allDone = allDetails.stream().allMatch(ct -> "DA_THUC_HIEN".equals(ct.getTrangThaiDv()));
            if (allDone) {
                pcd.setTrangThai("HOAN_THANH");
                phieuChiDinhRepository.save(pcd);
            }
        });
    }

    /**
     * Lấy danh sách bệnh nhân đã hoàn thành khám trong ngày (dùng cho thu ngân).
     *
     * @return danh sách bệnh nhân đã hoàn thành khám hôm nay
     */
    @Override
    public List<Map<String, Object>> getCompletedPatientsToday() {
        return repository.findCompletedPatientsToday();
    }

    /**
     * Lấy danh sách bệnh nhân đã hoàn thành khám trong ngày, có lọc theo từ khoá.
     *
     * @param keyword từ khoá tìm kiếm trên thông tin bệnh nhân
     * @return danh sách bệnh nhân đã hoàn thành khám hôm nay sau khi lọc
     */
    @Override
    public List<Map<String, Object>> getCompletedPatientsTodayWithSearch(String keyword) {
        return repository.findCompletedPatientsTodayWithSearch(keyword);
    }

    /**
     * Lấy lịch sử khám theo chuyên khoa trên tất cả các ngày.
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách lịch sử khám của chuyên khoa
     */
    @Override
    public List<Map<String, Object>> getHistoryByChuyenKhoaAllDays(Integer maChuyenKhoa) {
        return repository.findHistoryByChuyenKhoaAllDays(maChuyenKhoa);
    }

    /**
     * Tiếp nhận bệnh nhân tại khoa CLS: tạo phiếu khám mới (kèm ghi chú từ hồ sơ đăng ký),
     * liên kết với hồ sơ đăng ký và chuyển hồ sơ sang trạng thái đang khám.
     *
     * @param registrationId mã hồ sơ đăng ký khám
     * @param technicianId mã kỹ thuật viên tiếp nhận; nếu {@code null} thì lấy nhân viên của hồ sơ
     * @return thông báo thành công kèm mã phiếu khám và hồ sơ đăng ký
     * @throws Exception nếu không tìm thấy hồ sơ đăng ký hoặc bệnh nhân đã được tiếp nhận
     */
    @Override
    @Transactional
    public Map<String, Object> acceptClsPatient(Integer registrationId, Integer technicianId) throws Exception {
        DangKyKhamBenh dk = dangKyRepository.findById(registrationId).orElse(null);
        if (dk == null) {
            throw new Exception("Không tìm thấy hồ sơ đăng ký khám");
        }
        if (dk.getMaPhieuKham() != null) {
            throw new Exception("Bệnh nhân này đã được tiếp nhận");
        }

        PhieuKham pk = new PhieuKham();
        pk.setMaBenhNhan(dk.getMaBenhNhan());
        pk.setMaChuyenKhoa(dk.getMaChuyenKhoa());
        pk.setMaNhanVien(technicianId != null ? technicianId : dk.getMaNhanVien());
        pk.setNgayKham(LocalDateTime.now());
        pk.setNgayTao(LocalDateTime.now());
        pk.setTrangThai("CHO");
        pk.setMaDichVu(dk.getMaDichVu());
        pk.setGhiChu(dk.getGhiChu());
        PhieuKham savedPk = repository.saveAndFlush(pk);
        webSocketPublisher.publishPhieuKhamChange("CREATED", savedPk);

        dk.setMaPhieuKham(savedPk.getMaPhieuKham());
        dk.setTrangThai("DANG_KHAM");
        dangKyRepository.saveAndFlush(dk);
        webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());

        return Map.of(
            "message", "Đã tiếp nhận bệnh nhân CLS thành công",
            "phieuKhamId", savedPk.getMaPhieuKham(),
            "registration", dk
        );
    }

    /**
     * Kỹ thuật viên xác nhận thực hiện dịch vụ CLS: lưu thông tin tiếp nhận, tạo phiếu chỉ định
     * cùng chi tiết dịch vụ với đơn giá lấy từ danh mục (mặc định 0 nếu không có), rồi chuyển
     * phiếu khám và hồ sơ đăng ký sang trạng thái chờ CLS.
     *
     * @param maPhieuKham mã phiếu khám
     * @param technicianId mã kỹ thuật viên xác nhận, dùng làm người chỉ định
     * @param lyDoDen lý do bệnh nhân đến khám CLS
     * @param thongTinSangLoc thông tin sàng lọc đã ghi nhận
     * @param ghiChu ghi chú bổ sung
     * @return thông báo thành công kèm mã phiếu chỉ định vừa tạo
     * @throws Exception nếu không tìm thấy phiếu khám, phiếu khám không có dịch vụ CLS
     *                   hoặc đã tồn tại phiếu chỉ định cho phiếu khám này
     */
    @Override
    @Transactional
    public Map<String, Object> techConfirmClsService(Integer maPhieuKham, Integer technicianId, String lyDoDen, String thongTinSangLoc, String ghiChu) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham)
                .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));

        if (pk.getMaDichVu() == null) {
            throw new Exception("Phiếu khám này không có dịch vụ CLS");
        }

        TiepNhanCls tiepNhan = new TiepNhanCls();
        tiepNhan.setMaPhieuKham(maPhieuKham);
        tiepNhan.setLyDoDen(lyDoDen);
        tiepNhan.setThongTinSangLoc(thongTinSangLoc);
        tiepNhan.setGhiChu(ghiChu);
        tiepNhanClsRepository.save(tiepNhan);

        List<PhieuChiDinh> existingPcd = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        if (existingPcd != null && !existingPcd.isEmpty()) {
            throw new Exception("Phiếu chỉ định đã được tạo trước đó cho phiếu khám này");
        }

        DichVu dv = dichVuRepository.findById(pk.getMaDichVu()).orElse(null);
        Double donGia = (dv != null && dv.getDonGia() != null) ? dv.getDonGia().doubleValue() : 0.0;

        PhieuChiDinh pcd = new PhieuChiDinh();
        pcd.setMaPhieuKham(maPhieuKham);
        pcd.setMaNhanVienChiDinh(technicianId);
        pcd.setNgayChiDinh(LocalDateTime.now());
        pcd.setTongTien(donGia);
        PhieuChiDinh savedPcd = phieuChiDinhRepository.saveAndFlush(pcd);

        ChiTietChiDinh ct = new ChiTietChiDinh();
        ct.setMaPhieuChiDinh(savedPcd.getMaPhieuChiDinh());
        ct.setMaDichVu(pk.getMaDichVu());
        ct.setSoLuong(1);
        ct.setDonGia(donGia);
        ct.setTrangThaiDv("CHUA_THUC_HIEN");
        chiTietRepository.saveAndFlush(ct);

        pk.setTrangThai("CHO_CLS");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("CHO_CLS");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
        });

        return Map.of(
            "message", "Đã tiếp nhận CLS và tạo phiếu chỉ định thành công",
            "phieuChiDinhId", savedPcd.getMaPhieuChiDinh()
        );
    }

    /**
     * Bác sĩ CLS xác nhận thực hiện dịch vụ: tạo phiếu chỉ định cùng chi tiết dịch vụ
     * với đơn giá lấy từ danh mục (mặc định 0 nếu không có), rồi chuyển phiếu khám
     * và hồ sơ đăng ký sang trạng thái chờ CLS.
     *
     * @param maPhieuKham mã phiếu khám
     * @param doctorId mã bác sĩ xác nhận, dùng làm người chỉ định
     * @return thông báo thành công kèm mã phiếu chỉ định vừa tạo
     * @throws Exception nếu không tìm thấy phiếu khám, phiếu khám không có dịch vụ CLS
     *                   hoặc đã tồn tại phiếu chỉ định cho phiếu khám này
     */
    @Override
    @Transactional
    public Map<String, Object> confirmClsService(Integer maPhieuKham, Integer doctorId) throws Exception {
        PhieuKham pk = repository.findById(maPhieuKham)
                .orElseThrow(() -> new Exception("Không tìm thấy phiếu khám #" + maPhieuKham));

        if (pk.getMaDichVu() == null) {
            throw new Exception("Phiếu khám này không có dịch vụ CLS để xác nhận");
        }

        List<PhieuChiDinh> existingPcd = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        if (existingPcd != null && !existingPcd.isEmpty()) {
            throw new Exception("Phiếu chỉ định đã được tạo trước đó cho phiếu khám này");
        }

        DichVu dv = dichVuRepository.findById(pk.getMaDichVu()).orElse(null);
        Double donGia = (dv != null && dv.getDonGia() != null) ? dv.getDonGia().doubleValue() : 0.0;

        PhieuChiDinh pcd = new PhieuChiDinh();
        pcd.setMaPhieuKham(maPhieuKham);
        pcd.setMaNhanVienChiDinh(doctorId);
        pcd.setNgayChiDinh(LocalDateTime.now());
        pcd.setTongTien(donGia);
        PhieuChiDinh savedPcd = phieuChiDinhRepository.saveAndFlush(pcd);

        ChiTietChiDinh ct = new ChiTietChiDinh();
        ct.setMaPhieuChiDinh(savedPcd.getMaPhieuChiDinh());
        ct.setMaDichVu(pk.getMaDichVu());
        ct.setSoLuong(1);
        ct.setDonGia(donGia);
        ct.setTrangThaiDv("CHUA_THUC_HIEN");
        chiTietRepository.saveAndFlush(ct);

        pk.setTrangThai("CHO_CLS");
        repository.save(pk);
        webSocketPublisher.publishPhieuKhamChange("UPDATED", pk);

        dangKyRepository.findByMaPhieuKham(maPhieuKham).ifPresent(dk -> {
            dk.setTrangThai("CHO_CLS");
            dangKyRepository.save(dk);
            webSocketPublisher.publishDangKyKhamChange("UPDATED", dk.getId(), dk.getTrangThai());
        });

        return Map.of(
            "message", "Đã xác nhận thực hiện dịch vụ và tạo phiếu chỉ định thành công",
            "phieuChiDinhId", savedPcd.getMaPhieuChiDinh()
        );
    }

    /**
     * Lấy danh sách bệnh nhân CLS đang chờ bác sĩ xác nhận dịch vụ (đã có phiếu khám
     * nhưng chưa có phiếu chỉ định) theo chuyên khoa.
     *
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách bệnh nhân chờ xác nhận
     */
    @Override
    public List<Map<String, Object>> getPendingClsConfirmation(Integer maChuyenKhoa) {
        return repository.findPendingClsConfirmation(maChuyenKhoa);
    }

    /**
     * Lấy danh sách kết quả CLS đã được duyệt và sẵn sàng đưa vào hồ sơ bệnh nhân.
     * <p>
     * Mỗi chi tiết dịch vụ đã thực hiện ({@code DA_THUC_HIEN}) được kiểm tra theo thứ tự
     * kết quả xét nghiệm rồi kết quả CĐHA; chỉ những kết quả ở trạng thái
     * {@code DA_DUYET} mới được trả về.
     * </p>
     *
     * @param maPhieuKham mã phiếu khám
     * @return danh sách kết quả gồm mã chi tiết, loại ({@code XET_NGHIEM} hoặc {@code CDHA})
     *         và tên dịch vụ
     */
    @Override
    public List<Map<String, Object>> getAvailableClsResults(Integer maPhieuKham) {
        List<Map<String, Object>> results = new java.util.ArrayList<>();
        List<PhieuChiDinh> pcdList = phieuChiDinhRepository.findByMaPhieuKham(maPhieuKham);
        if (pcdList == null) return results;

        for (PhieuChiDinh pcd : pcdList) {
            List<ChiTietChiDinh> details = chiTietRepository.findByMaPhieuChiDinh(pcd.getMaPhieuChiDinh());
            if (details == null) continue;

            for (ChiTietChiDinh detail : details) {
                if ("DA_THUC_HIEN".equals(detail.getTrangThaiDv())) {
                    var kqxnOpt = ketQuaXetNghiemRepository.findByMaChiTietChiDinh(detail.getId());
                    if (kqxnOpt.isPresent() && "DA_DUYET".equals(kqxnOpt.get().getTrangThai())) {
                        String tenDv = dichVuRepository.findById(detail.getMaDichVu())
                                .map(DichVu::getTenDichVu).orElse("Dịch vụ xét nghiệm");
                        Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", detail.getId());
                        map.put("loai", "XET_NGHIEM");
                        map.put("tenDichVu", tenDv);
                        results.add(map);
                        continue;
                    }

                    var kqcdhaOpt = ketQuaCdhaRepository.findByIdChiTietChiDinh(detail.getId());
                    if (kqcdhaOpt.isPresent() && "DA_DUYET".equals(kqcdhaOpt.get().getTrangThai())) {
                        String tenDv = dichVuRepository.findById(detail.getMaDichVu())
                                .map(DichVu::getTenDichVu).orElse("Dịch vụ CĐHA");
                        Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", detail.getId());
                        map.put("loai", "CDHA");
                        map.put("tenDichVu", tenDv);
                        results.add(map);
                    }
                }
            }
        }
        return results;
    }

    /**
     * Lấy lịch sử khám theo mã bệnh nhân, có thể lọc theo mã chuyên khoa.
     *
     * @param maBenhNhan mã bệnh nhân cần lọc
     * @param maChuyenKhoa mã chuyên khoa cần lọc
     * @return danh sách lịch sử khám của bệnh nhân
     */
    @Override
    public List<Map<String, Object>> getHistoryByBenhNhan(Integer maBenhNhan, Integer maChuyenKhoa) {
        return repository.findHistoryByBenhNhan(maBenhNhan, maChuyenKhoa);
    }
}