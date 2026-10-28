package com.qlpk.backend.service.impl;

import com.qlpk.backend.dto.BulkDefaultShiftRequest;
import com.qlpk.backend.dto.BulkDefaultShiftResult;
import com.qlpk.backend.dto.LichThangDTO;
import com.qlpk.backend.dto.NgayCaLamDTO;
import com.qlpk.backend.dto.NhanCaMacDinhDenCuoiNamRequest;
import com.qlpk.backend.dto.DoctorScheduleSummaryDTO;
import com.qlpk.backend.entity.BangPhanCongCaLam;
import com.qlpk.backend.entity.CaLam;
import com.qlpk.backend.entity.EventType;
import com.qlpk.backend.entity.HanhDongCaLam;
import com.qlpk.backend.entity.KieuPhanCong;
import com.qlpk.backend.entity.LichKham;
import com.qlpk.backend.entity.PhongChucNang;
import com.qlpk.backend.repository.BangPhanCongCaLamRepository;
import com.qlpk.backend.repository.CaLamRepository;
import com.qlpk.backend.repository.LichKhamRepository;
import com.qlpk.backend.repository.PhongChucNangRepository;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
import com.qlpk.backend.service.BangPhanCongCaLamService;
import com.qlpk.backend.service.LichKhamService;
import com.qlpk.backend.service.ThongBaoService;
import com.qlpk.backend.util.TimeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BangPhanCongCaLamServiceImpl implements BangPhanCongCaLamService {

    private static final Logger log = LoggerFactory.getLogger(BangPhanCongCaLamServiceImpl.class);

    /**
     * TẠM TẮT KIỂM TRA PHÒNG TRỰ — test mode.
     * true  → getPhongDangTrucCuaUser trả phòng hoặc null (không throw).
     * false → kiểm tra giờ + lịch trực + nghỉ phép, throw RuntimeException nếu lỗi.
     * Sau khi test xong: đổi true → false.
     */
    private static final boolean TAM_TAT_KIEM_TRA_PHONG_TRUC = true;

    private static final Map<String, DayOfWeek> THU_TO_DAY_OF_WEEK = Map.of(
            "Thứ 2", DayOfWeek.MONDAY,
            "Thứ 3", DayOfWeek.TUESDAY,
            "Thứ 4", DayOfWeek.WEDNESDAY,
            "Thứ 5", DayOfWeek.THURSDAY,
            "Thứ 6", DayOfWeek.FRIDAY,
            "Thứ 7", DayOfWeek.SATURDAY,
            "Chủ Nhật", DayOfWeek.SUNDAY
    );

    @Autowired
    private BangPhanCongCaLamRepository repository;

    @Autowired
    private CaLamRepository caLamRepository;

    @Autowired
    private LichKhamRepository lichKhamRepository;

    @Autowired
    private LichKhamService lichKhamService;

    @Autowired
    private ThongBaoService thongBaoService;

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private PhongChucNangRepository phongChucNangRepository;

    @Override
    public List<BangPhanCongCaLam> getAll() {
        List<BangPhanCongCaLam> list = repository.findAll();
        populateTenPhong(list);
        return list;
    }

    @Override
    public BangPhanCongCaLam getById(Integer id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public BangPhanCongCaLam create(BangPhanCongCaLam entity) {
        if (entity.getMaCa() != null) {
            CaLam ca = caLamRepository.findById(entity.getMaCa())
                    .orElseThrow(() -> new RuntimeException("Ca không tồn tại: " + entity.getMaCa()));
            entity.setCa(ca);
        }
        autoFillThu(entity);
        return repository.save(entity);
    }

    /**
     * CẬP NHẬT MỘT BẢN GHI THEO ID — CHỈ ẢNH HƯỞNG ĐẾN ĐÚNG 1 RECORD.
     *
     * Chỉ cập nhật các field thực sự được phép sửa: maCa, phong, hanhDong, lyDo.
     * Không đổi id, maNhanVien, ngay, thu, kieuPhanCong.
     * Không tạo entity mới để thay thế record cũ.
     */
    @Override
    @Transactional
    public BangPhanCongCaLam update(Integer id, BangPhanCongCaLam entity) {
        BangPhanCongCaLam existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi ca làm việc: " + id));

        // Chỉ cập nhật các field thực sự được phép sửa
        if (entity.getMaCa() != null) {
            CaLam ca = caLamRepository.findById(entity.getMaCa())
                    .orElseThrow(() -> new RuntimeException("Ca không tồn tại: " + entity.getMaCa()));
            existing.setCa(ca);
        }
        if (entity.getPhong() != null) {
            existing.setPhong(entity.getPhong());
        }
        // hanhDong/lyDo: null nghĩa là xóa (hủy nghỉ phép), có giá trị thì set
        existing.setHanhDong(entity.getHanhDong());
        existing.setLyDo(entity.getLyDo());
        autoFillThu(existing);

        return repository.save(existing);
    }

    /**
     * NGHỈ PHÉP LÀ UPDATE — không CREATE, không DELETE.
     * Lấy đúng bản ghi theo id, set hanhDong = NGHI_PHEP + lyDo, rồi save.
     * Giữ nguyên id, maCa, maNhanVien, ngay, kieuPhanCong.
     */
    @Override
    @Transactional
    public BangPhanCongCaLam updateNghiPhep(Integer id, String lyDo) {
        BangPhanCongCaLam existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi phân công: " + id));

        existing.setHanhDong(HanhDongCaLam.NGHI_PHEP);
        existing.setLyDo(lyDo);
        autoFillThu(existing);

        return repository.save(existing);
    }

    /**
     * Hủy toàn bộ lịch hẹn CHUA_DEN của bác sĩ trong ngày khi nghỉ đột xuất.
     * KHÔNG @Transactional — mỗi lần huyLich() mở transaction riêng qua Spring proxy,
     * nên lịch lỗi chỉ rollback lịch đó, không ảnh hưởng các lịch khác.
     */
    @Override
    public void xuLyNghiDotXuat(Integer maBacSi, LocalDate ngay, String lyDo) {
        if (maBacSi == null || ngay == null) {
            log.warn("xuLyNghiDotXuat bỏ qua: thiếu maBacSi hoặc ngay (maBacSi={}, ngay={})", maBacSi, ngay);
            return;
        }

        List<LichKham> danhSachCanHuy = lichKhamRepository
                .findByMaBacSiAndNgayKhamAndTrangThai(maBacSi, ngay, "CHUA_DEN");

        log.info("Bác sĩ {} nghỉ đột xuất ngày {}: tìm thấy {} lịch hẹn CHUA_DEN cần hủy",
            maBacSi, ngay, danhSachCanHuy.size());

        for (LichKham lich : danhSachCanHuy) {
            try {
                // Tái sử dụng đúng huyLich() atomic — 1 hủy ↔ 1 giải phóng slot
                // Hệ thống tự động (nghỉ đột xuất) — maNguoiCapNhat = NULL, lưu lyDo vào ly_do_hoan
                LichKham ketQua = lichKhamService.huyLich(lich.getId(), null, lyDo);
                // Gửi thông báo ngay sau khi hủy thành công, try-catch riêng từng cái
                guiThongBaoHuyNghiDotXuat(ketQua, lyDo);
            } catch (RuntimeException ex) {
                // Lịch này có thể đã bị xử lý bởi tiến trình khác (QUA_HEN, hủy trước...) — bỏ qua, không dừng vòng lặp
                log.warn("Không hủy được lịch {} khi bác sĩ {} nghỉ đột xuất ngày {}: {}",
                    lich.getId(), maBacSi, ngay, ex.getMessage());
            }
        }
    }

    /**
     * Gửi thông báo hủy lịch do bác sĩ nghỉ đột xuất cho bệnh nhân.
     * Bọc try-catch — lỗi gửi thông báo không được ảnh hưởng việc hủy lịch đã thành công.
     */
    private void guiThongBaoHuyNghiDotXuat(LichKham lich, String lyDo) {
        try {
            Integer maTaiKhoanBn = lich.getMaBenhNhan() != null
                ? taiKhoanBenhNhanRepository.findByMaBenhNhan(lich.getMaBenhNhan())
                    .map(acc -> acc.getMaTaiKhoanBn()).orElse(null)
                : null;
            if (maTaiKhoanBn != null) {
                String ngayStr = lich.getNgayKham() != null
                    ? lich.getNgayKham().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                String lyDoText = (lyDo != null && !lyDo.isEmpty()) ? lyDo : "Bác sĩ nghỉ phép đột xuất";
                String noiDung = "Bác sĩ nghỉ đột xuất, lịch khám ngày " + ngayStr
                    + " của bạn đã bị hủy. Lý do: " + lyDoText + ". Vui lòng đặt lịch mới.";
                thongBaoService.createThongBao(
                    maTaiKhoanBn,
                    "BENH_NHAN",
                    "Lịch khám đã bị hủy",
                    noiDung,
                    "LICH_KHAM",
                    String.valueOf(lich.getId()),
                    EventType.LICH_KHAM_CANCELLED.name(),
                    false,
                    true
                );
            }
        } catch (Exception notiErr) {
            System.err.println("Failed to send bulk cancel notification: " + notiErr.getMessage());
        }
    }

    @Override
    public void delete(Integer id) {
        repository.deleteById(id);
    }

    @Override
    public int deleteDefaultByWeekday(Integer maNhanVien, int nam, int thang, String thu) {
        if (maNhanVien == null) {
            throw new RuntimeException("Mã nhân viên không được để trống");
        }
        if (thu == null || thu.isBlank()) {
            throw new RuntimeException("Thứ không được để trống");
        }

        LocalDate firstDay = LocalDate.of(nam, thang, 1);
        LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());
        String targetThu = normalizeDayName(thu);

        List<BangPhanCongCaLam> toDelete = new ArrayList<>();
        for (LocalDate date = firstDay; !date.isAfter(lastDay); date = date.plusDays(1)) {
            if (!normalizeDayName(date).equals(targetThu)) {
                continue;
            }
            List<BangPhanCongCaLam> records = repository.findByMaNhanVienAndNgayBetween(maNhanVien, date, date);
            if (records != null) {
                for (BangPhanCongCaLam record : records) {
                    if (record.getNgay() != null && date.equals(record.getNgay())) {
                        toDelete.add(record);
                    }
                }
            }
        }

        if (toDelete.isEmpty()) {
            return 0;
        }

        repository.deleteAll(toDelete);
        return toDelete.size();
    }

    @Override
    public List<BangPhanCongCaLam> createDefaultInMonth(BulkDefaultShiftRequest request) {
        if (request == null) {
            throw new RuntimeException("Yêu cầu tạo ca mặc định không được để trống");
        }
        if (request.getMaNhanVien() == null) {
            throw new RuntimeException("Mã nhân viên không được để trống");
        }
        if (request.getNam() == null || request.getThang() == null) {
            throw new RuntimeException("Năm và tháng không được để trống");
        }
        if (request.getThu() == null || request.getThu().isBlank()) {
            throw new RuntimeException("Thứ không được để trống");
        }
        if (request.getPhong() == null) {
            throw new RuntimeException("Phòng không được để trống");
        }
        if (request.getMaCaIds() == null || request.getMaCaIds().isEmpty()) {
            throw new RuntimeException("Phải chọn ít nhất 1 ca");
        }

        List<LocalDate> dates = calculateMatchingDates(request.getNam(), request.getThang(), request.getThu());
        List<BangPhanCongCaLam> created = new ArrayList<>();

        for (LocalDate date : dates) {
            for (Integer maCaId : request.getMaCaIds()) {
                if (maCaId == null) {
                    continue;
                }
                if (repository.existsByMaNhanVienAndNgayAndCa_Id(request.getMaNhanVien(), date, maCaId)) {
                    continue;
                }

                CaLam ca = caLamRepository.findById(maCaId)
                        .orElseThrow(() -> new RuntimeException("Ca không tồn tại: " + maCaId));

                BangPhanCongCaLam entity = new BangPhanCongCaLam();
                entity.setMaNhanVien(request.getMaNhanVien());
                entity.setNgay(date);
                entity.setThu(request.getThu());
                entity.setCa(ca);
                entity.setPhong(request.getPhong());
                entity.setMaCa(maCaId);
                entity.setKieuPhanCong(KieuPhanCong.MAC_DINH);
                entity.setHanhDong(null);
                entity.setLyDo(null);
                autoFillThu(entity);
                created.add(repository.save(entity));
            }
        }

        return created;
    }

    @Override
    @Transactional
    public BulkDefaultShiftResult nhanCaMacDinhDenCuoiNam(NhanCaMacDinhDenCuoiNamRequest request) {
        validateYearEndRequest(request);

        Set<Integer> existingCaIds = caLamRepository.findAllById(request.getDanhSachMaCa())
                .stream()
                .map(CaLam::getId)
                .collect(Collectors.toSet());
        List<Integer> missingCaIds = request.getDanhSachMaCa().stream()
                .filter(id -> !existingCaIds.contains(id))
                .distinct()
                .toList();
        if (!missingCaIds.isEmpty()) {
            throw new RuntimeException("Ca không tồn tại: " + missingCaIds);
        }

        DayOfWeek targetDay = THU_TO_DAY_OF_WEEK.get(request.getThu());
        int createdCount = 0;
        int startMonth = request.getThangBatDau().getMonthValue();
        int year = request.getThangBatDau().getYear();

        for (int month = startMonth; month <= 12; month++) {
            YearMonth monthToCheck = YearMonth.of(year, month);
            for (LocalDate date = monthToCheck.atDay(1);
                 !date.isAfter(monthToCheck.atEndOfMonth());
                 date = date.plusDays(1)) {
                if (date.getDayOfWeek() != targetDay) {
                    continue;
                }
                for (Integer caId : request.getDanhSachMaCa()) {
                    createdCount += repository.insertIgnore(
                            request.getMaNhanVien(),
                            caId,
                            request.getPhong(),
                            request.getThu(),
                            date
                    );
                }
            }
        }

        return new BulkDefaultShiftResult(createdCount, 12 - startMonth + 1);
    }

    private void validateYearEndRequest(NhanCaMacDinhDenCuoiNamRequest request) {
        if (request == null) {
            throw new RuntimeException("Yêu cầu nhân ca đến cuối năm không được để trống");
        }
        if (request.getMaNhanVien() == null) {
            throw new RuntimeException("Mã nhân viên không được để trống");
        }
        if (request.getThangBatDau() == null) {
            throw new RuntimeException("Tháng bắt đầu không được để trống");
        }
        if (!THU_TO_DAY_OF_WEEK.containsKey(request.getThu())) {
            throw new RuntimeException("Thứ không hợp lệ: " + request.getThu());
        }
        if (request.getPhong() == null) {
            throw new RuntimeException("Phòng không được để trống");
        }
        if (request.getDanhSachMaCa() == null || request.getDanhSachMaCa().isEmpty()
                || request.getDanhSachMaCa().stream().anyMatch(id -> id == null)) {
            throw new RuntimeException("Phải chọn ít nhất 1 ca hợp lệ");
        }
    }

    /**
     * CẬP NHẬT HÀNG LOẠT TẤT CẢ CA MẶC ĐỊNH CÙNG THỨ TRONG THÁNG.
     *
     * CHỈ chạy khi request.getUpdateAllThu() == true (cờ bật batch).
     * Nếu cờ không bật, ném RuntimeException để báo lỗi — tránh update nhầm toàn bộ.
     *
     * Mỗi bản ghi MAC_DINH được cập nhật độc lập theo ID của chính nó:
     * fetch existing by ID → apply new phong/maCa → save by ID.
     * KHÔNG thực hiện UPDATE ... WHERE thu = ? hay bất kỳ câu lệnh bulk nào.
     */
    @Override
    public List<BangPhanCongCaLam> updateDefaultInMonth(BulkDefaultShiftRequest request) {
        // --- Bắt buộc cờ updateAllThu phải được bật ---
        if (request == null || Boolean.TRUE != request.getUpdateAllThu()) {
            throw new RuntimeException("Cập nhật hàng loạt chỉ được thực hiện khi updateAllThu = true");
        }

        // --- Validate ---
        if (request.getMaNhanVien() == null) {
            throw new RuntimeException("Mã nhân viên không được để trống");
        }
        if (request.getNam() == null || request.getThang() == null) {
            throw new RuntimeException("Năm và tháng không được để trống");
        }
        if (request.getThu() == null || request.getThu().isBlank()) {
            throw new RuntimeException("Thứ không được để trống");
        }
        if (request.getPhong() == null) {
            throw new RuntimeException("Phòng không được để trống");
        }
        if (request.getMaCaIds() == null || request.getMaCaIds().isEmpty()) {
            throw new RuntimeException("Phải chọn ít nhất 1 ca");
        }

        Integer maNhanVien = request.getMaNhanVien();
        String targetThu = normalizeDayName(request.getThu());

        // --- Tìm TẤT CẢ bản ghi MAC_DINH của nhân viên ---
        List<BangPhanCongCaLam> allEmpShifts = repository.findByMaNhanVien(maNhanVien);
        if (allEmpShifts == null || allEmpShifts.isEmpty()) {
            return new ArrayList<>();
        }

        LocalDate firstDay = LocalDate.of(request.getNam(), request.getThang(), 1);
        LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());

        // --- Lọc ra các bản ghi MAC_DINH khớng thứ trong tháng ---
        List<BangPhanCongCaLam> matchingRecords = allEmpShifts.stream()
                .filter(s -> s.getKieuPhanCong() == KieuPhanCong.MAC_DINH)
                .filter(s -> s.getThu() != null && targetThu.equals(normalizeDayName(s.getThu())))
                .filter(s -> {
                    // Chỉ giữ thỷ trong tháng nếu ngày đã gán thuộc về tháng/yêu cầu
                    LocalDate recordNgay = s.getNgay();
                    if (recordNgay != null) {
                        return !recordNgay.isBefore(firstDay) && !recordNgay.isAfter(lastDay);
                    }
                    // ngày null → default theo thứ → áp dụng cho cả tháng
                    return true;
                })
                .collect(Collectors.toList());

        if (matchingRecords.isEmpty()) {
            return new ArrayList<>();
        }

        List<Integer> caIds = request.getMaCaIds().stream()
                .filter(id -> id != null)
                .collect(Collectors.toList());
        Integer phong = request.getPhong();

        List<BangPhanCongCaLam> updated = new ArrayList<>();

        // --- Cập nhật từng bản ghi THEO ID riêng lẻ ---
        for (int i = 0; i < matchingRecords.size(); i++) {
            BangPhanCongCaLam record = matchingRecords.get(i);

            // Lấy bản ghi fresh từ DB để tránh stale state
            BangPhanCongCaLam fresh = repository.findById(record.getId())
                    .orElse(null);
            if (fresh == null) {
                // Bản ghi đã bị xóa trong vòng lặp trước (do xung đột) — bỏ qua
                continue;
            }

            // Cập nhật phòng
            fresh.setPhong(phong);

            // Cập nhật ca: chỉ định theo vị trí nếu có đủ ca, ngược lại dùng ca đầu tiên
            Integer newCaId = caIds.get(Math.min(i, caIds.size() - 1));
            CaLam newCa = caLamRepository.findById(newCaId)
                    .orElse(null);
            if (newCa == null) {
                continue;
            }

            // Xử lý xung đột unique (ma_nhan_vien, ngay, ma_ca):
            // Nếu đã có bản ghi khác (ví dụ ngoại lệ THEO_NGAY) cùng (nhân viên, ngày, ca mới)
            // thì xóa bản ghi đó trước — vì không thể tồn tại 2 bản ghi cùng ca cùng ngày.
            if (fresh.getNgay() != null) {
                repository.findByMaNhanVienAndNgayAndCa_Id(maNhanVien, fresh.getNgay(), newCaId)
                        .filter(existing -> !existing.getId().equals(fresh.getId()))
                        .ifPresent(repository::delete);
            }

            fresh.setCa(newCa);
            fresh.setMaCa(newCa.getId());

            fresh.setKieuPhanCong(KieuPhanCong.MAC_DINH);
            // Giữ nguyên hanhDong và lyDo — sửa ca/phòng không đồng nghĩa hủy nghỉ phép

            autoFillThu(fresh);
            updated.add(repository.saveAndFlush(fresh));
        }

        return updated;
    }

    private void autoFillThu(BangPhanCongCaLam entity) {
        if (entity.getNgay() != null
                && (entity.getThu() == null || entity.getThu().isBlank())) {
            entity.setThu(getThuTiengViet(entity.getNgay()));
        }
    }

  
    public static List<LocalDate> calculateMatchingDates(int nam, int thang, String thu) {
        LocalDate firstDay = LocalDate.of(nam, thang, 1);
        LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());
        String targetThu = normalizeDayName(thu);

        List<LocalDate> result = new ArrayList<>();
        for (LocalDate date = firstDay; !date.isAfter(lastDay); date = date.plusDays(1)) {
            if (normalizeDayName(date).equals(targetThu)) {
                result.add(date);
            }
        }
        return result;
    }

    /**
     * Xác định lịch làm việc thực tế của nhân viên trong một ngày (hàm thuần, chỉ đọc dữ liệu).
     * Thứ tự ưu tiên: nghỉ phép → ca thay thế → ca mặc định → ca thêm.
     */
    public static List<BangPhanCongCaLam> resolveScheduleForDay(List<BangPhanCongCaLam> rows, LocalDate ngay) {
        if (rows == null || rows.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. NGHI_PHEP → ngày không có lịch làm
        boolean hasLeave = rows.stream().anyMatch(r ->
                r != null
                        && r.getNgay() != null
                        && r.getNgay().equals(ngay)
                        && r.getHanhDong() == HanhDongCaLam.NGHI_PHEP);
        if (hasLeave) {
            return new ArrayList<>();
        }

        // 2. THAY_THE → ca thay thế + ca thêm
        List<BangPhanCongCaLam> replacement = rows.stream()
                .filter(r -> r != null && r.getNgay() != null && r.getNgay().equals(ngay)
                        && r.getKieuPhanCong() == KieuPhanCong.THEO_NGAY
                        && r.getHanhDong() == HanhDongCaLam.THAY_THE)
                .toList();
        List<BangPhanCongCaLam> extra = rows.stream()
                .filter(r -> r != null && r.getNgay() != null && r.getNgay().equals(ngay)
                        && r.getKieuPhanCong() == KieuPhanCong.THEO_NGAY
                        && r.getHanhDong() == HanhDongCaLam.THEM)
                .toList();
        if (!replacement.isEmpty()) {
            List<BangPhanCongCaLam> result = new ArrayList<>(replacement);
            result.addAll(extra);
            return result;
        }

        // 3. Không có THAY_THE → ca mặc định + ca thêm
        List<BangPhanCongCaLam> defaultRows = rows.stream()
                .filter(r -> r != null && r.getKieuPhanCong() == KieuPhanCong.MAC_DINH)
                .filter(r -> {
                    if (r.getNgay() != null) {
                        // MAC_DINH gắn ngày cụ thể → match theo ngày chính xác
                        return ngay.equals(r.getNgay());
                    }
                    // MAC_DINH theo thứ (ngày null) → match theo thu
                    return r.getThu() != null
                            && normalizeDayName(ngay).equals(normalizeDayName(r.getThu()));
                })
                .toList();
        if (!defaultRows.isEmpty()) {
            List<BangPhanCongCaLam> result = new ArrayList<>(defaultRows);
            result.addAll(extra);
            return result;
        }

        // 4. Không có mặc định → chỉ trả ca thêm
        return new ArrayList<>(extra);
    }

    private static String normalizeDayName(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        switch (day) {
            case MONDAY: return "Thứ 2";
            case TUESDAY: return "Thứ 3";
            case WEDNESDAY: return "Thứ 4";
            case THURSDAY: return "Thứ 5";
            case FRIDAY: return "Thứ 6";
            case SATURDAY: return "Thứ 7";
            case SUNDAY: return "Chủ Nhật";
            default: return "";
        }
    }

    private static String normalizeDayName(String thu) {
        if (thu == null) return "";
        String normalized = thu.trim();
        if (normalized.equalsIgnoreCase("MONDAY") || normalized.equalsIgnoreCase("Thứ 2") || normalized.equalsIgnoreCase("Thu 2")) return "Thứ 2";
        if (normalized.equalsIgnoreCase("TUESDAY") || normalized.equalsIgnoreCase("Thứ 3") || normalized.equalsIgnoreCase("Thu 3")) return "Thứ 3";
        if (normalized.equalsIgnoreCase("WEDNESDAY") || normalized.equalsIgnoreCase("Thứ 4") || normalized.equalsIgnoreCase("Thu 4")) return "Thứ 4";
        if (normalized.equalsIgnoreCase("THURSDAY") || normalized.equalsIgnoreCase("Thứ 5") || normalized.equalsIgnoreCase("Thu 5")) return "Thứ 5";
        if (normalized.equalsIgnoreCase("FRIDAY") || normalized.equalsIgnoreCase("Thứ 6") || normalized.equalsIgnoreCase("Thu 6")) return "Thứ 6";
        if (normalized.equalsIgnoreCase("SATURDAY") || normalized.equalsIgnoreCase("Thứ 7") || normalized.equalsIgnoreCase("Thu 7")) return "Thứ 7";
        if (normalized.equalsIgnoreCase("SUNDAY") || normalized.equalsIgnoreCase("Chủ Nhật") || normalized.equalsIgnoreCase("Chu Nhat")) return "Chủ Nhật";
        return normalized;
    }

    @Override
    public List<BangPhanCongCaLam> getWorkingToday() {
        LocalDate todayDate = LocalDate.now();
        String todayThu = getVietnameseDayOfWeek();

        // Lấy 2 nhóm row:
        // 1. Row THEO_NGAY hoặc MAC_DINH có ngay = hôm nay
        // 2. Row MAC_DINH legacy có ngay = null + thu = hôm nay
        List<BangPhanCongCaLam> rowsWithDate = repository.findByNgay(todayDate);
        List<BangPhanCongCaLam> rowsLegacy = repository.findByNgayIsNullAndThu(todayThu);

        // Gộp lại
        List<BangPhanCongCaLam> allRows = new ArrayList<>();
        if (rowsWithDate != null) allRows.addAll(rowsWithDate);
        if (rowsLegacy != null) allRows.addAll(rowsLegacy);

        // Không cần filter NGHI_PHEP — query findByNgay(today) đã chỉ lấy
        // row của hôm nay. Row NGHI_PHEP ngày cũ không lọt vào.
        // Row NGHI_PHEP ngày hôm nay được giữ để FE cảnh báo "BS đang nghỉ".
        populateTenPhong(allRows);
        return allRows;
    }

    private String getVietnameseDayOfWeek() {
        java.time.DayOfWeek day = java.time.LocalDate.now().getDayOfWeek();
        switch (day) {
            case MONDAY: return "Thứ 2";
            case TUESDAY: return "Thứ 3";
            case WEDNESDAY: return "Thứ 4";
            case THURSDAY: return "Thứ 5";
            case FRIDAY: return "Thứ 6";
            case SATURDAY: return "Thứ 7";
            case SUNDAY: return "Chủ Nhật";
            default: return "";
        }
    }

    @Override
    public List<BangPhanCongCaLam> getByMaNhanVien(Integer maNhanVien) {
        List<BangPhanCongCaLam> list = repository.findByMaNhanVien(maNhanVien);
        populateTenPhong(list);
        return list;
    }

    @Override
    public Map<String, Object> getCurrentRoom(Integer maNhanVien) {
        String dayOfWeek = getVietnameseDayOfWeek();
        List<BangPhanCongCaLam> shifts = repository.findByMaNhanVien(maNhanVien);
        LocalTime now = LocalTime.now();

        BangPhanCongCaLam activeShift = shifts.stream()
                .filter(s -> s.getHanhDong() != HanhDongCaLam.NGHI_PHEP)
                .filter(s -> s.getThu().equalsIgnoreCase(dayOfWeek))
                .filter(s -> {
                    CaLam ca = s.getCa();
                    if (ca == null) return false;
                    LocalTime start = ca.getGioBatDau();
                    LocalTime end = ca.getGioKetThuc();
                    if (start == null || end == null) return false;
                    return (now.isAfter(start) || now.equals(start)) && (now.isBefore(end) || now.equals(end));
                })
                .findFirst()
                .orElse(null);

        Map<String, Object> response = new HashMap<>();
        if (activeShift != null) {
            response.put("phong", activeShift.getPhong());
            String tenPhong = phongChucNangRepository.findById(activeShift.getPhong())
                    .map(PhongChucNang::getTenPhong)
                    .orElse(null);
            response.put("tenPhong", tenPhong != null ? tenPhong : "Chưa có lịch trực");
        } else {
            response.put("phong", null);
            response.put("tenPhong", "Chưa có lịch trực");
        }
        return response;
    }

    /**
     * Map DayOfWeek → "Thứ 2".."Chủ Nhật" (đúng định dạng cột thu trong bang_phan_cong_ca_lam).
     */
    private String getThuTiengViet(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        switch (day) {
            case MONDAY:    return "Thứ 2";
            case TUESDAY:   return "Thứ 3";
            case WEDNESDAY: return "Thứ 4";
            case THURSDAY:  return "Thứ 5";
            case FRIDAY:    return "Thứ 6";
            case SATURDAY:  return "Thứ 7";
            case SUNDAY:    return "Chủ Nhật";
            default:        return "";
        }
    }

    @Override
    public Integer getPhongDangTrucCuaUser(Integer maNhanVien) {
        LocalDate today = LocalDate.now();
        String thu = getThuTiengViet(today);

        // ⚠️ TAM_TAT_LAY_CA_TU_GIO — tạm comment phần lấy caId thật từ giờ hiện tại:
        // LocalTime now = TimeUtil.nowTime();
        // CaLam activeCa = caLamRepository.findActiveCaLamAt(now).orElse(null);
        // if (activeCa == null) throw new RuntimeException("Ngoài giờ làm việc");
        // Integer caId = activeCa.getId();
        Integer caId = 1; // test mode: ca 1 = sáng (đổi 2 = chiều nếu cần)
        
        // 1. Ưu tiên bản ghi cụ thể theo (nhân viên, ngày = hôm nay, ca)
        BangPhanCongCaLam shift = repository.findFirstByMaNhanVienAndNgayAndCaIdOrderByIdDesc(maNhanVien, today, caId);
        // 2. Fallback: bản ghi mặc định (ngày IS NULL, theo thừ hôm nay, ca)
        if (shift == null) {
            shift = repository.findFirstByMaNhanVienAndNgayIsNullAndThuAndCaIdOrderByIdDesc(maNhanVien, thu, caId);
        }

        if (TAM_TAT_KIEM_TRA_PHONG_TRUC) {
            // Test mode: trả phòng hoặc null, không throw
            return shift != null ? shift.getPhong() : null;
        }

        if (shift == null) throw new RuntimeException("Hôm nay không có lịch trực");
        if (HanhDongCaLam.NGHI_PHEP == shift.getHanhDong()) throw new RuntimeException("Đang nghỉ phép");
        return shift.getPhong();
    }

    @Override
    public Map<String, Object> getPhongTheoBacSi(Integer maBacSi, LocalDate ngay) {
        if (maBacSi == null) {
            throw new RuntimeException("Mã bác sĩ không được để trống");
        }
        if (ngay == null) {
            throw new RuntimeException("Ngày không được để trống");
        }

        // 1. Lấy giờ hiện tại
        LocalTime now = TimeUtil.nowTime();

        // ⚠️ TẠM TẮT — SEARCH "TAM_TAT_KIEM_TRA_CA" ĐỂ BẬT LẠI
        // 2. Tra ca_lam để xác định ca hiện tại (kiểm tra giờ làm việc)
        // CaLam activeCa = caLamRepository.findActiveCaLamAt(now)
        //         .orElseThrow(() -> new RuntimeException(
        //                 "Hiện chưa vào ca làm việc của bác sĩ. Vui lòng thử lại trong giờ làm việc."));
        // Fallback tạm thời: lấy ca đầu tiên theo id (đảm bảo ORDER BY)
        CaLam activeCa = caLamRepository.findAllOrdered().stream().findFirst().orElse(null);
        // HẾT TẠM TẮT

        // 3. Lấy toàn bộ phân công của bác sĩ, resolve theo ngày (xử lý NGHI_PHEP/THAY_THE/MAC_DINH/THEO_NGAY)
        List<BangPhanCongCaLam> shifts = repository.findByMaNhanVien(maBacSi);
        List<BangPhanCongCaLam> resolved = resolveScheduleForDay(shifts, ngay);

        // 4. Tìm ca khớp với ca hiện tại
        BangPhanCongCaLam activeShift;
        if (activeCa != null) {
            activeShift = resolved.stream()
                    .filter(s -> s.getCa() != null && activeCa.getId().equals(s.getCa().getId()))
                    .findFirst()
                    .orElse(null);
        } else {
            // Fallback tạm thời: ca đầu tiên trong resolved list
            activeShift = resolved.stream().findFirst().orElse(null);
        }
        if (activeShift == null && !resolved.isEmpty()) {
            // Có lịch trong ngày nhưng khác ca hiện tại (check giờ đang tạm tắt) →
            // fallback về ca đầu tiên trong ngày để không chặn tiếp đón cấp số.
            activeShift = resolved.get(0);
        }
        if (activeShift == null) {
            throw new RuntimeException("Bác sĩ không có lịch làm việc ngày đã chọn.");
        }

        // 5. Lấy tên phòng
        Integer maPhong = activeShift.getPhong();
        String tenPhong = maPhong != null
                ? phongChucNangRepository.findById(maPhong)
                        .map(PhongChucNang::getTenPhong)
                        .orElse(null)
                : null;

        Map<String, Object> response = new HashMap<>();
        // Nếu đã fallback sang ca khác trong ngày thì trả về maCa của ca thực tế đó,
        // tránh trả nhầm ca đầu tiên khi BS chỉ trực ca chiều/tối.
        Integer maCaResponse;
        if (activeShift.getCa() != null
                && (activeCa == null || !activeCa.getId().equals(activeShift.getCa().getId()))) {
            maCaResponse = activeShift.getCa().getId();
        } else {
            maCaResponse = activeCa != null ? activeCa.getId() : null;
        }
        response.put("maCa", maCaResponse);
        response.put("maPhong", maPhong);
        response.put("tenPhong", tenPhong);
        return response;
    }

    private void populateTenPhong(List<BangPhanCongCaLam> list) {
        if (list == null) return;
        for (BangPhanCongCaLam s : list) {
            if (s.getPhong() != null) {
                phongChucNangRepository.findById(s.getPhong())
                        .ifPresent(p -> s.setTenPhong(p.getTenPhong()));
            }
        }
    }

    @Override
    public LichThangDTO getLichThang(Integer maNhanVien, int nam, int thang) {
        LocalDate first = LocalDate.of(nam, thang, 1);
        LocalDate last = first.withDayOfMonth(first.lengthOfMonth());

        List<BangPhanCongCaLam> allShifts = repository.findByMaNhanVien(maNhanVien);
        if (allShifts == null) {
            allShifts = new ArrayList<>();
        }

        LichThangDTO result = new LichThangDTO();
        result.setMaNhanVien(maNhanVien);
        result.setNam(nam);
        result.setThang(thang);

        List<NgayCaLamDTO> days = new ArrayList<>();
        for (LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) {
            NgayCaLamDTO ng = new NgayCaLamDTO();
            ng.setNgay(d.toString());
            String thu = mapThuFromDate(d);
            ng.setThu(thu);

            // Separate MAC_DINH and THEO_NGAY shifts
            List<BangPhanCongCaLam> macDinh = new ArrayList<>();
            List<BangPhanCongCaLam> theoNgay = new ArrayList<>();

            for (BangPhanCongCaLam shift : allShifts) {
                // Chỉ đọc — không thay đổi entity trong quá trình GET
                if (shift.getKieuPhanCong() == KieuPhanCong.MAC_DINH) {
                    if (shift.getNgay() != null) {
                        // MAC_DINH gắn ngày cụ thể → match theo ngày chính xác
                        if (d.equals(shift.getNgay())) {
                            macDinh.add(shift);
                        }
                    } else {
                        // MAC_DINH theo thứ (ngày null) → match theo thu
                        if (normalizeDayName(thu).equals(normalizeDayName(shift.getThu()))) {
                            macDinh.add(shift);
                        }
                    }
                } else if (shift.getKieuPhanCong() == KieuPhanCong.THEO_NGAY) {
                    // Match by exact date (ngay)
                    if (d.equals(shift.getNgay())) {
                        theoNgay.add(shift);
                    }
                }
            }

            ng.setMacDinh(macDinh);
            ng.setTheoNgay(theoNgay);
            List<BangPhanCongCaLam> rowsForDay = new ArrayList<>(macDinh);
            rowsForDay.addAll(theoNgay);
            List<BangPhanCongCaLam> resolved = resolveScheduleForDay(rowsForDay, d);
            populateTenPhong(macDinh);
            populateTenPhong(theoNgay);
            populateTenPhong(resolved);
            ng.setResolved(resolved);
            days.add(ng);
        }
        result.setDays(days);
        return result;
    }

    private String mapThuFromDate(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        switch (day) {
            case MONDAY: return "Thứ 2";
            case TUESDAY: return "Thứ 3";
            case WEDNESDAY: return "Thứ 4";
            case THURSDAY: return "Thứ 5";
            case FRIDAY: return "Thứ 6";
            case SATURDAY: return "Thứ 7";
            case SUNDAY: return "Chủ Nhật";
            default: return "";
        }
    }

    /**
     * Lấy lịch tháng cho bệnh nhân (public) — KHÔNG chứa field nhạy cảm.
     *
     * QUAN TRỌNG: Clone toàn bộ 3 tầng (LichThangDTO → NgayCaLamDTO → BangPhanCongCaLam).
     * KHÔNG mutate entity JPA gốc — nếu set hanhDong/lyDo = null trực tiếp,
     * Hibernate dirty-check sẽ ghi null xuống DB thật, mất toàn bộ lý do nghỉ phép.
     */
    @Override
    public LichThangDTO getLichThangChoBenhNhan(Integer maNhanVien, int nam, int thang) {
        LichThangDTO goc = getLichThang(maNhanVien, nam, thang);

        LichThangDTO result = new LichThangDTO();
        result.setMaNhanVien(goc.getMaNhanVien());
        result.setNam(goc.getNam());
        result.setThang(goc.getThang());

        List<NgayCaLamDTO> days = new ArrayList<>();
        if (goc.getDays() != null) {
            for (NgayCaLamDTO ng : goc.getDays()) {
                NgayCaLamDTO copy = new NgayCaLamDTO();
                copy.setNgay(ng.getNgay());
                copy.setThu(ng.getThu());
                copy.setMacDinh(cloneListForBenhNhan(ng.getMacDinh()));
                copy.setTheoNgay(cloneListForBenhNhan(ng.getTheoNgay()));
                copy.setResolved(cloneListForBenhNhan(ng.getResolved()));
                days.add(copy);
            }
        }
        result.setDays(days);
        return result;
    }

    @Override
    public List<DoctorScheduleSummaryDTO> getSummaryTuan(List<Integer> maNhanViens, List<String> dsThu) {
        if (maNhanViens == null || maNhanViens.isEmpty() || dsThu == null || dsThu.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Integer, Set<String>> grouped = new LinkedHashMap<>();
        for (Object[] row : repository.findThuSummary(maNhanViens, dsThu)) {
            Integer maNhanVien = (Integer) row[0];
            String thu = (String) row[1];
            grouped.computeIfAbsent(maNhanVien, ignored -> new java.util.TreeSet<>(Comparator.comparingInt(this::thuOrder)))
                    .add(thu);
        }

        return grouped.entrySet().stream()
                .map(entry -> new DoctorScheduleSummaryDTO(entry.getKey(), new ArrayList<>(entry.getValue())))
                .toList();
    }

    private int thuOrder(String thu) {
        return switch (normalizeDayName(thu)) {
            case "Thứ 2" -> 2;
            case "Thứ 3" -> 3;
            case "Thứ 4" -> 4;
            case "Thứ 5" -> 5;
            case "Thứ 6" -> 6;
            case "Thứ 7" -> 7;
            case "Chủ Nhật" -> 8;
            default -> 9;
        };
    }

    private List<BangPhanCongCaLam> cloneListForBenhNhan(List<BangPhanCongCaLam> list) {
        if (list == null) return new ArrayList<>();
        List<BangPhanCongCaLam> result = new ArrayList<>();
        for (BangPhanCongCaLam item : list) {
            result.add(cloneForBenhNhan(item));
        }
        return result;
    }

    /**
     * Clone entity cho bệnh nhân.
     * Giữ: id, maNhanVien, maCa, phong, kieuPhanCong, thu, ngay, tenPhong, ca (tham chiếu — CaLam không chứa field nhạy cảm).
     * KHÔNG set: hanhDong, lyDo → giữ null, bệnh nhân không cần biết lý do nghỉ/hành động.
     */
    private BangPhanCongCaLam cloneForBenhNhan(BangPhanCongCaLam src) {
        BangPhanCongCaLam copy = new BangPhanCongCaLam();
        copy.setId(src.getId());
        copy.setMaNhanVien(src.getMaNhanVien());
        copy.setMaCa(src.getMaCa());
        copy.setPhong(src.getPhong());
        copy.setKieuPhanCong(src.getKieuPhanCong());
        copy.setThu(src.getThu());
        copy.setNgay(src.getNgay());
        copy.setTenPhong(src.getTenPhong());
        copy.setCa(src.getCa());
        return copy;
    }
}
