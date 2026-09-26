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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ThongBaoServiceImpl implements ThongBaoService {

    private static final Logger log = LoggerFactory.getLogger(ThongBaoServiceImpl.class);

    private static final String DEFAULT_EVENT_TYPE = "SYSTEM_NOTIFICATION";

    private static final String LOAI_BENH_NHAN = "BENH_NHAN";

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

    private ThongBao createThongBaoInternal(Integer maTaiKhoan, Integer maTaiKhoanNhanVien, String loaiNguoiNhan, String tieuDe,
            String noiDung, String referenceType, String referenceId, String eventType, Boolean daDoc,
            Boolean sendFcm, boolean checkDedup) {

        if (LOAI_BENH_NHAN.equals(loaiNguoiNhan) && maTaiKhoan != null) {
            Integer maTaiKhoanBn = resolveToMaTaiKhoanBn(maTaiKhoan);
            if (maTaiKhoanBn != null) {
                maTaiKhoan = maTaiKhoanBn;
            }
        }

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
        thongBao.setDaGuiPush(false); 
        ThongBao saved = thongBaoRepository.save(thongBao);

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

        boolean guiPushThanhCong = false;
        if (Boolean.TRUE.equals(sendFcm) && LOAI_BENH_NHAN.equals(loaiNguoiNhan)) {
            guiPushThanhCong = sendFcmVaCapNhatTrangThai(saved);
        }

        if (LOAI_BENH_NHAN.equals(loaiNguoiNhan)) {
            createNhanVienThongBao(maTaiKhoanNhanVien, tieuDe, noiDung, referenceType, referenceId, eventType, daDoc);
        }

        return saved;
    }

    private void createNhanVienThongBao(Integer maTaiKhoanNhanVien, String tieuDe, String noiDung,
            String referenceType, String referenceId, String eventType, Boolean daDoc) {
        if (maTaiKhoanNhanVien == null) {

            log.warn("Bỏ qua tạo thông báo NHAN_VIEN vì thiếu maTaiKhoanNhanVien. referenceType={}, referenceId={}",
                    referenceType, referenceId);
            return;
        }

        Integer maTaiKhoan = maTaiKhoanNhanVien;
        TaiKhoan taiKhoan = taiKhoanRepository.findById(maTaiKhoanNhanVien).orElse(null);
        if (taiKhoan == null) {

            taiKhoan = taiKhoanRepository.findByMaNhanVien(maTaiKhoanNhanVien);
            if (taiKhoan != null) {
                maTaiKhoan = taiKhoan.getMaTaiKhoan();
            } else {

                log.warn("Bỏ qua tạo thông báo NHAN_VIEN: không tìm thấy tài khoản nhân viên cho maTaiKhoanNhanVien={}. referenceType={}, referenceId={}",
                        maTaiKhoanNhanVien, referenceType, referenceId);
                return;
            }
        } else {
            maTaiKhoan = taiKhoan.getMaTaiKhoan();
        }

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
        thongBao.setDaGuiPush(false); 
        ThongBao saved = thongBaoRepository.save(thongBao);

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

    private boolean sendFcmVaCapNhatTrangThai(ThongBao thongBao) {
        try {
            Long referenceIdLong = null;
            if (thongBao.getReferenceId() != null) {
                try {
                    referenceIdLong = Long.parseLong(thongBao.getReferenceId());
                } catch (NumberFormatException ignored) {

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

            log.warn("Failed to send FCM notification for tb #{}: {}", thongBao.getId(), e.getMessage());
            return false;
        }
    }

    @Override
    public List<ThongBao> getThongBaoByUser(Integer maTaiKhoan, String loaiNguoiNhan, Boolean chiChuaDoc) {

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

    private Integer resolveToMaTaiKhoanBn(Integer maTaiKhoan) {
        if (maTaiKhoan == null)
            return null;
        try {

            if (taiKhoanBenhNhanRepository.existsById(maTaiKhoan)) {
                return maTaiKhoan;
            }

            TaiKhoanBenhNhan account = taiKhoanBenhNhanRepository.findByMaBenhNhan(maTaiKhoan).orElse(null);
            return account != null ? account.getMaTaiKhoanBn() : null;
        } catch (Exception e) {

            return null;
        }
    }
}
