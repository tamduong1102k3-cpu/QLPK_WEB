package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.entity.TaiKhoanBenhNhan;
import com.qlpk.backend.entity.ThongBao;
import com.qlpk.backend.payment.WebSocketPublisher;
import com.qlpk.backend.repository.TaiKhoanBenhNhanRepository;
import com.qlpk.backend.repository.TaiKhoanRepository;
import com.qlpk.backend.repository.ThongBaoRepository;
import com.qlpk.backend.service.PushNotificationService;
import com.qlpk.backend.service.ThongBaoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ThongBaoServiceImpl implements ThongBaoService {

    private static final Logger log = LoggerFactory.getLogger(ThongBaoServiceImpl.class);

    /** Loại sự kiện mặc định khi không được truyền vào */
    private static final String DEFAULT_EVENT_TYPE = "SYSTEM_NOTIFICATION";

    /** Loại người nhận bệnh nhân - chỉ những thông báo này mới gửi FCM */
    private static final String LOAI_BENH_NHAN = "BENH_NHAN";

    /** Loại người nhận nhân viên - chỉ hiển thị qua WebSocket/bell */
    private static final String LOAI_NHAN_VIEN = "NHAN_VIEN";

    @Autowired
    private ThongBaoRepository thongBaoRepository;

    @Autowired
    private TaiKhoanBenhNhanRepository taiKhoanBenhNhanRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private WebSocketPublisher webSocketPublisher;

    @Autowired
    @Lazy
    private PushNotificationService pushNotificationService;

    @Override
    public ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung,
            String referenceType, String referenceId, Boolean daDoc) {
        // Mặc định gửi FCM, eventType = SYSTEM_NOTIFICATION
        return createThongBao(maTaiKhoan, loaiNguoiNhan, tieuDe, noiDung, referenceType, referenceId,
                DEFAULT_EVENT_TYPE, daDoc, true);
    }

    @Override
    public ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung,
            String referenceType, String referenceId, Boolean daDoc, Boolean sendFcm) {
        return createThongBao(maTaiKhoan, loaiNguoiNhan, tieuDe, noiDung, referenceType, referenceId,
                DEFAULT_EVENT_TYPE, daDoc, sendFcm);
    }

    @Override
    public ThongBao createThongBao(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung,
            String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm) {
        // Overload cũ: không có maTaiKhoanNhanVien -> bản NHAN_VIEN sẽ bỏ qua (không
        // tạo)
        return createThongBao(maTaiKhoan, null, loaiNguoiNhan, tieuDe, noiDung, referenceType, referenceId, eventType,
                daDoc, sendFcm);
    }

    @Override
    public ThongBao createThongBao(Integer maTaiKhoan, Integer maTaiKhoanNhanVien, String loaiNguoiNhan, String tieuDe,
            String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc,
            Boolean sendFcm) {
        return createThongBaoInternal(maTaiKhoan, maTaiKhoanNhanVien, loaiNguoiNhan, tieuDe, noiDung,
                referenceType, referenceId, eventType, daDoc, sendFcm, true);
    }

    @Override
    public ThongBao createThongBaoNoDedup(Integer maTaiKhoan, String loaiNguoiNhan, String tieuDe, String noiDung,
            String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm) {
        return createThongBaoInternal(maTaiKhoan, null, loaiNguoiNhan, tieuDe, noiDung,
                referenceType, referenceId, eventType, daDoc, sendFcm, false);
    }

    /**
     * Tao thong bao CHI cho benh nhan - KHONG tao ban nhan vien.
     * Dung cho flow bac si tu tao lich (khong can thong bao chinh minh).
     * Copy logic createThongBaoInternal (dedup + save + websocket + FCM), BO nhanh NV.
     */
    @Override
    public ThongBao createThongBaoChoBenhNhan(Integer maTaiKhoanBn, String tieuDe, String noiDung,
            String referenceType, String referenceId, String eventType, Boolean daDoc, Boolean sendFcm) {
        if (maTaiKhoanBn == null || maTaiKhoanBn == 0) {
            log.warn("Khong tao thong bao BN: thieu maTaiKhoanBn. refType={}, refId={}", referenceType, referenceId);
            return null;
        }
        Integer maTaiKhoan = maTaiKhoanBn;
        Integer resolved = resolveToMaTaiKhoanBn(maTaiKhoanBn);
        if (resolved != null) {
            maTaiKhoan = resolved;
        }
        if (referenceType != null && referenceId != null && eventType != null) {
            boolean daCoThongBao = thongBaoRepository
                    .existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventType(
                            maTaiKhoan, LOAI_BENH_NHAN, referenceType, referenceId, eventType);
            if (daCoThongBao) {
                log.info("Thong bao BN da ton tai cho maTaiKhoan={}, refType={}, refId={}, eventType={}. Bo qua.",
                        maTaiKhoan, referenceType, referenceId, eventType);
                return null;
            }
        }
        ThongBao thongBao = new ThongBao();
        thongBao.setMaTaiKhoan(maTaiKhoan);
        thongBao.setLoaiNguoiNhan(LOAI_BENH_NHAN);
        thongBao.setTieuDe(tieuDe);
        thongBao.setNoiDung(noiDung);
        thongBao.setReferenceType(referenceType);
        thongBao.setReferenceId(referenceId);
        thongBao.setEventType(eventType);
        thongBao.setDaDoc(daDoc != null ? daDoc : false);
        thongBao.setDaGuiPush(false);
        ThongBao saved = thongBaoRepository.save(thongBao);
        if (webSocketPublisher != null) {
            try {
                webSocketPublisher.publishThongBaoEvent(
                        saved.getMaTaiKhoan(),
                        saved.getLoaiNguoiNhan(),
                        "NEW",
                        saved.getTieuDe(),
                        saved.getNoiDung(),
                        saved.getId(),
                        saved.getReferenceType(),
                        saved.getReferenceId());
            } catch (Exception e) {
                log.error("Loi gui websocket cho ThongBao id={}, loaiNguoiNhan={}: {}", saved.getId(), saved.getLoaiNguoiNhan(), e.getMessage());
            }
        }
        if (Boolean.TRUE.equals(sendFcm)) {
            sendFcmVaCapNhatTrangThai(saved);
        }
        return saved;
    }

    /**
     * Core logic tạo thông báo.
     * @param checkDedup true = kiểm tra trùng lặp (createThongBao), false = bỏ qua (createThongBaoNoDedup)
     */
    private ThongBao createThongBaoInternal(Integer maTaiKhoan, Integer maTaiKhoanNhanVien, String loaiNguoiNhan, String tieuDe,
            String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc,
            Boolean sendFcm, boolean checkDedup) {
        // QUAN TRỌNG: Chuyển đổi maTaiKhoan sang maTaiKhoanBn nếu caller truyền
        // maBenhNhan.
        // Bảng thong_bao lưu theo ma_tai_khoan (maTaiKhoanBn) cho bệnh nhân.
        if (LOAI_BENH_NHAN.equals(loaiNguoiNhan) && maTaiKhoan != null) {
            Integer maTaiKhoanBn = resolveToMaTaiKhoanBn(maTaiKhoan);
            if (maTaiKhoanBn != null) {
                maTaiKhoan = maTaiKhoanBn;
            }
        }

        // Kiểm tra trước khi lưu: đã có thông báo cho cùng reference + eventType chưa?
        // (tránh tạo trùng lặp và tránh spam FCM) — chỉ khi checkDedup = true
        if (checkDedup) {
            boolean daCoThongBao = false;
            if (LOAI_BENH_NHAN.equals(loaiNguoiNhan)
                    && referenceType != null && referenceId != null && eventType != null) {
                daCoThongBao = thongBaoRepository
                        .existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventType(
                                maTaiKhoan, loaiNguoiNhan, referenceType, referenceId, eventType);
            }

            if (daCoThongBao) {
                log.info("Thông báo đã tồn tại cho maTaiKhoan={}, refType={}, refId={}, eventType={}. Bỏ qua.",
                        maTaiKhoan, referenceType, referenceId, eventType);
                return null;
            }
        }

        ThongBao thongBao = new ThongBao();
        thongBao.setMaTaiKhoan(maTaiKhoan);
        thongBao.setLoaiNguoiNhan(loaiNguoiNhan);
        thongBao.setTieuDe(tieuDe);
        thongBao.setNoiDung(noiDung);
        thongBao.setReferenceType(referenceType);
        thongBao.setReferenceId(referenceId);
        thongBao.setEventType(eventType);
        thongBao.setDaDoc(daDoc != null ? daDoc : false);
        thongBao.setDaGuiPush(false); // Mới tạo: chưa từng gửi push
        ThongBao saved = thongBaoRepository.save(thongBao);

        // 1. Publish WebSocket event để client nhận thông báo realtime (khi app đang
        // mở)
        if (webSocketPublisher != null) {
            webSocketPublisher.publishThongBaoEvent(
                    maTaiKhoan,
                    loaiNguoiNhan,
                    "NEW",
                    tieuDe,
                    noiDung,
                    saved.getId(),
                    referenceType,
                    referenceId);
        }

        // 2. Gửi FCM push notification (kể cả khi app tắt)
        // Chỉ gửi nếu sendFcm = true và người nhận là bệnh nhân
        boolean guiPushThanhCong = false;
        if (Boolean.TRUE.equals(sendFcm) && LOAI_BENH_NHAN.equals(loaiNguoiNhan)) {
            guiPushThanhCong = sendFcmVaCapNhatTrangThai(saved);
        }

        // 3. Tạo bản sao dành cho nhân viên (loaiNguoiNhan = NHAN_VIEN) khi có thông
        // báo mới cho bệnh nhân.
        // Bản NHAN_VIEN dùng ma_tai_khoan của nhân viên (bảng tai_khoan), không phải
        // của bệnh nhân.
        if (LOAI_BENH_NHAN.equals(loaiNguoiNhan)) {
            createNhanVienThongBao(maTaiKhoanNhanVien, tieuDe, noiDung, referenceType, referenceId, eventType, daDoc);
        }

        return saved;
    }

    /**
     * Tạo thông báo y hệt dành cho nhân viên (loaiNguoiNhan = NHAN_VIEN) khi có
     * thông báo mới cho bệnh nhân.
     * maTaiKhoanNhanVien có thể là ma_tai_khoan (bảng tai_khoan của nhân viên) hoặc
     * ma_nhan_vien (ID nhân viên)
     * - map sang ma_tai_khoan qua TaiKhoanRepository nếu cần.
     * Chỉ lưu DB + publish WebSocket để chuông bell hiển thị realtime, KHÔNG gửi
     * FCM push.
     */
    private void createNhanVienThongBao(Integer maTaiKhoanNhanVien, String tieuDe, String noiDung,
            String referenceType, String referenceId, String eventType, Boolean daDoc) {
        if (maTaiKhoanNhanVien == null || maTaiKhoanNhanVien == 0) {
            throw new RuntimeException("Không thể tạo thông báo nhân viên: thiếu mã tài khoản");
        }

        // Đảm bảo maTaiKhoan là mã tài khoản nhân viên (bảng tai_khoan)
        Integer maTaiKhoan = maTaiKhoanNhanVien;
        TaiKhoan taiKhoan = taiKhoanRepository.findById(maTaiKhoanNhanVien).orElse(null);
        if (taiKhoan == null) {
            // Có thể đây là maNhanVien -> map qua findByMaNhanVien
            taiKhoan = taiKhoanRepository.findByMaNhanVien(maTaiKhoanNhanVien);
            if (taiKhoan != null) {
                maTaiKhoan = taiKhoan.getMaTaiKhoan();
            } else {
                // Không tìm thấy tài khoản nhân viên tương ứng -> bỏ qua (log cảnh báo)
                log.warn("Bỏ qua tạo thông báo NHAN_VIEN: không tìm thấy tài khoản nhân viên cho maTaiKhoanNhanVien={}. referenceType={}, referenceId={}",
                        maTaiKhoanNhanVien, referenceType, referenceId);
                return;
            }
        } else {
            maTaiKhoan = taiKhoan.getMaTaiKhoan();
        }

        // Tránh tạo trùng lặp cho cùng reference + eventType với loại NHAN_VIEN
        boolean daCoThongBao = referenceType != null && referenceId != null && eventType != null
                ? thongBaoRepository
                        .existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventType(
                                maTaiKhoan, LOAI_NHAN_VIEN, referenceType, referenceId, eventType)
                : false;

        if (daCoThongBao) {
            log.info("Thông báo NHAN_VIEN đã tồn tại cho maTaiKhoan={}, refType={}, refId={}, eventType={}. Bỏ qua.",
                    maTaiKhoan, referenceType, referenceId, eventType);
            return;
        }

        ThongBao thongBao = new ThongBao();
        thongBao.setMaTaiKhoan(maTaiKhoan);
        thongBao.setLoaiNguoiNhan(LOAI_NHAN_VIEN);
        thongBao.setTieuDe(tieuDe);
        thongBao.setNoiDung(noiDung);
        thongBao.setReferenceType(referenceType);
        thongBao.setReferenceId(referenceId);
        thongBao.setEventType(eventType);
        thongBao.setDaDoc(daDoc != null ? daDoc : false);
        thongBao.setDaGuiPush(false); // Nhân viên không gửi FCM push
        ThongBao saved = thongBaoRepository.save(thongBao);

        // Publish WebSocket event để client nhân viên nhận thông báo realtime (khi app
        // đang mở)
        if (webSocketPublisher != null) {
            webSocketPublisher.publishThongBaoEvent(
                    maTaiKhoan,
                    LOAI_NHAN_VIEN,
                    "NEW",
                    tieuDe,
                    noiDung,
                    saved.getId(),
                    referenceType,
                    referenceId);
        }
    }

    /**
     * Gửi FCM cho 1 thông báo. Nếu gửi thành công (có token + Firebase nhận),
     * cập nhật daGuiPush = true. Ngược lại giữ daGuiPush = false để gửi bù sau.
     */
    private boolean sendFcmVaCapNhatTrangThai(ThongBao thongBao) {
        try {
            Long referenceIdLong = null;
            if (thongBao.getReferenceId() != null) {
                try {
                    referenceIdLong = Long.parseLong(thongBao.getReferenceId());
                } catch (NumberFormatException ignored) {
                    // referenceId không phải số thì bỏ qua
                }
            }
            boolean sent = pushNotificationService.sendFcmToUser(
                    thongBao.getMaTaiKhoan(),
                    thongBao.getTieuDe(),
                    thongBao.getNoiDung(),
                    thongBao.getReferenceType(),
                    referenceIdLong);
            if (sent) {
                thongBao.setDaGuiPush(true);
                thongBaoRepository.save(thongBao);
                return true;
            }
            log.info("Chưa gửi push cho thông báo #{} (có thể chưa có FCM token). daGuiPush giữ = false",
                    thongBao.getId());
            return false;
        } catch (Exception e) {
            // Silent fail - không làm ảnh hưởng đến việc lưu thông báo
            log.warn("Failed to send FCM notification for tb #{}: {}", thongBao.getId(), e.getMessage());
            return false;
        }
    }

    @Override
    public List<ThongBao> getThongBaoByUser(Integer maTaiKhoan, String loaiNguoiNhan, Boolean chiChuaDoc) {
        // Mặc định lấy tất cả thông báo (cả đã đọc và chưa đọc)
        if (chiChuaDoc != null && chiChuaDoc) {
            return thongBaoRepository.findByMaTaiKhoanAndLoaiNguoiNhanAndDaDocOrderByCreatedAtDesc(maTaiKhoan,
                    loaiNguoiNhan, false);
        }
        return thongBaoRepository.findByMaTaiKhoanAndLoaiNguoiNhanOrderByCreatedAtDesc(maTaiKhoan, loaiNguoiNhan);
    }

    @Override
    public long countUnread(Integer maTaiKhoan, String loaiNguoiNhan) {
        return thongBaoRepository.countByMaTaiKhoanAndLoaiNguoiNhanAndDaDoc(maTaiKhoan, loaiNguoiNhan, false);
    }

    @Override
    public ThongBao markAsRead(Long id) {
        ThongBao thongBao = thongBaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo với id: " + id));
        thongBao.setDaDoc(true);
        return thongBaoRepository.save(thongBao);
    }

    @Override
    public ThongBao markAsRead(Long id, Integer ownerId) {
        ThongBao thongBao = thongBaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo"));
        if (thongBao.getMaTaiKhoan() == null || !thongBao.getMaTaiKhoan().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
        }
        thongBao.setDaDoc(true);
        return thongBaoRepository.save(thongBao);
    }

    @Override
    @Transactional
    public void markAllAsRead(Integer maTaiKhoan, String loaiNguoiNhan) {
        List<ThongBao> unreadList = thongBaoRepository
                .findByMaTaiKhoanAndLoaiNguoiNhanAndDaDocOrderByCreatedAtDesc(maTaiKhoan, loaiNguoiNhan, false);
        for (ThongBao tb : unreadList) {
            tb.setDaDoc(true);
            thongBaoRepository.save(tb);
        }
    }

    @Override
    public void deleteThongBao(Long id) {
        thongBaoRepository.deleteById(id);
    }

    @Override
    public void deleteThongBao(Long id, Integer ownerId) {
        ThongBao thongBao = thongBaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo"));
        if (thongBao.getMaTaiKhoan() == null || !thongBao.getMaTaiKhoan().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập");
        }
        thongBaoRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteAllThongBao(Integer maTaiKhoan, String loaiNguoiNhan) {
        thongBaoRepository.deleteByMaTaiKhoanAndLoaiNguoiNhan(maTaiKhoan, loaiNguoiNhan);
    }

    @Override
    public List<ThongBao> getThongBaoByReferenceType(String referenceType) {
        return thongBaoRepository.findByReferenceTypeOrderByCreatedAtDesc(referenceType);
    }

    @Override
    public List<ThongBao> getThongBaoByReferenceTypeAndLoaiNguoiNhan(String referenceType, String loaiNguoiNhan) {
        return thongBaoRepository.findByReferenceTypeAndLoaiNguoiNhanOrderByCreatedAtDesc(referenceType, loaiNguoiNhan);
    }

    /**
     * Gửi push bù cho tất cả thông báo CHƯA GỬI push (daGuiPush = false) của một
     * bệnh nhân.
     * Khuyến nghị: gửi 1 Push Notification tổng hợp "Bạn có N thông báo mới từ
     * phòng khám".
     * Sau khi gửi thành công → cập nhật daGuiPush = 1 cho tất cả.
     * Được gọi sau khi bệnh nhân đăng ký FCM token lần đầu (login lần đầu).
     *
     * @param maTaiKhoanBn mã tài khoản bệnh nhân
     * @return số thông báo đã gửi push bù
     */
    @Override
    @Transactional
    public int sendPendingPushToUser(Integer maTaiKhoanBn) {
        List<ThongBao> pending = thongBaoRepository
                .findByMaTaiKhoanAndLoaiNguoiNhanAndDaGuiPushFalseOrderByCreatedAtAsc(maTaiKhoanBn, LOAI_BENH_NHAN);
        if (pending == null || pending.isEmpty()) {
            return 0;
        }

        int count = pending.size();
        String title = "Bạn có " + count + " thông báo mới từ phòng khám";
        String body = "Mở ứng dụng để xem chi tiết các thông báo mới nhất.";

        boolean sent = pushNotificationService.sendFcmToUser(maTaiKhoanBn, title, body, null, null);

        if (sent) {
            for (ThongBao tb : pending) {
                tb.setDaGuiPush(true);
                thongBaoRepository.save(tb);
            }
            log.info("Đã gửi push bù cho {} thông báo của maTaiKhoanBn={}", count, maTaiKhoanBn);
            return count;
        } else {
            log.warn("Không gửi được push bù cho maTaiKhoanBn={} (có thể không có token)", maTaiKhoanBn);
            return 0;
        }
    }

    /**
     * Kiểm tra maTaiKhoan có phải là maBenhNhan không và chuyển sang maTaiKhoanBn.
     * - Nếu maTaiKhoan là maTaiKhoanBn (tìm thấy trực tiếp) → trả về nguyên giá
     * trị.
     * - Nếu maTaiKhoan là maBenhNhan → tìm tài khoản bệnh nhân tương ứng → trả
     * maTaiKhoanBn.
     * - Không tìm thấy → trả null (caller sẽ giữ nguyên giá trị ban đầu).
     */
    private Integer resolveToMaTaiKhoanBn(Integer maTaiKhoan) {
        if (maTaiKhoan == null)
            return null;
        try {
            // Luôn ưu tiên: kiểm tra xem đây có phải là maTaiKhoanBn (tài khoản tồn tại)
            // không
            if (taiKhoanBenhNhanRepository.existsById(maTaiKhoan)) {
                return maTaiKhoan;
            }
            // Nếu không, thử xem đây có phải là maBenhNhan không
            TaiKhoanBenhNhan account = taiKhoanBenhNhanRepository.findByMaBenhNhan(maTaiKhoan).orElse(null);
            return account != null ? account.getMaTaiKhoanBn() : null;
        } catch (Exception e) {
            // Silent fail - không để lỗi lookup ảnh hưởng việc tạo thông báo
            return null;
        }
    }
}
