package com.qlpk.backend.scheduler;

import com.qlpk.backend.entity.KhoThuoc;
import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.entity.Thuoc;
import com.qlpk.backend.repository.KhoThuocRepository;
import com.qlpk.backend.repository.TaiKhoanRepository;
import com.qlpk.backend.repository.ThongBaoRepository;
import com.qlpk.backend.repository.ThuocRepository;
import com.qlpk.backend.service.ThongBaoService;
import com.qlpk.backend.util.TimeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler cảnh báo thuốc cho admin (QUAN_TRI_VIEN), chạy 7h sáng mỗi ngày.
 * - Thuốc sắp hết hạn trong 30 ngày (han_su_dung < today + 30) → eventType THUOC_HET_HAN
 * - Thuốc sắp hết số lượng tồn (< 20 hộp) → eventType THUOC_SAP_HET
 * Dedupe theo ngày: mỗi admin + thuốc + eventType chỉ tạo 1 thông báo/ngày.
 */
@Component
public class ThuocCanhBaoScheduler {

    private static final Logger log = LoggerFactory.getLogger(ThuocCanhBaoScheduler.class);

    private static final int SO_NGAY_SAP_HET_HAN = 30;
    private static final int NGUONG_SO_LUONG_SAP_HET = 20;
    private static final String LOAI_NGUOI_NHAN = "QUAN_TRI_VIEN";
    private static final String REFERENCE_TYPE = "THUOC";

    @Autowired
    private ThuocRepository thuocRepository;
    @Autowired
    private KhoThuocRepository khoThuocRepository;
    @Autowired
    private TaiKhoanRepository taiKhoanRepository;
    @Autowired
    private ThongBaoService thongBaoService;
    @Autowired
    private ThongBaoRepository thongBaoRepository;

    @Scheduled(cron = "0 0 7 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void canhBaoThuoc() {
        log.info("[ThuocCanhBaoScheduler] Bat dau");
        LocalDate today = TimeUtil.today();
        LocalDateTime startOfDay = today.atStartOfDay();

        List<TaiKhoan> admins = taiKhoanRepository.findByVaiTro(LOAI_NGUOI_NHAN);
        if (admins == null || admins.isEmpty()) {
            log.warn("[ThuocCanhBaoScheduler] Khong co admin");
            return;
        }

        // Sap het han
        LocalDate nguongHan = today.plusDays(SO_NGAY_SAP_HET_HAN);
        List<Thuoc> sapHetHan = thuocRepository.findByHanSuDungBefore(nguongHan);
        for (Thuoc t : sapHetHan) {
            if (t.getHanSuDung() == null) continue;
            String refId = String.valueOf(t.getMaThuoc());
            String tieuDe = "Nhắc nhở ngày hết hạn";
            String noiDung = t.getTenThuoc() + " hết hạn ngày " + t.getHanSuDung();
            for (TaiKhoan admin : admins) {
                if (thongBaoRepository
                        .existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventTypeAndCreatedAtAfter(
                                admin.getMaTaiKhoan(), LOAI_NGUOI_NHAN, REFERENCE_TYPE,
                                refId, "THUOC_HET_HAN", startOfDay))
                    continue;
                thongBaoService.createThongBao(
                        admin.getMaTaiKhoan(), LOAI_NGUOI_NHAN, tieuDe, noiDung,
                        REFERENCE_TYPE, refId, "THUOC_HET_HAN", false, false);
            }
        }

        // Sap het so luong
        List<KhoThuoc> sapHetSL = khoThuocRepository.findBySoLuongTonLessThan(NGUONG_SO_LUONG_SAP_HET);
        for (KhoThuoc k : sapHetSL) {
            Thuoc t = thuocRepository.findById(k.getMaThuoc()).orElse(null);
            if (t == null) continue;
            String refId = String.valueOf(t.getMaThuoc());
            String tieuDe = "Nhắc nhở số thuốc sắp hết";
            String noiDung = t.getTenThuoc() + " chỉ còn " + k.getSoLuongTon() + " hộp";
            for (TaiKhoan admin : admins) {
                if (thongBaoRepository
                        .existsByMaTaiKhoanAndLoaiNguoiNhanAndReferenceTypeAndReferenceIdAndEventTypeAndCreatedAtAfter(
                                admin.getMaTaiKhoan(), LOAI_NGUOI_NHAN, REFERENCE_TYPE,
                                refId, "THUOC_SAP_HET", startOfDay))
                    continue;
                thongBaoService.createThongBao(
                        admin.getMaTaiKhoan(), LOAI_NGUOI_NHAN, tieuDe, noiDung,
                        REFERENCE_TYPE, refId, "THUOC_SAP_HET", false, false);
            }
        }

        log.info("[ThuocCanhBaoScheduler] Xong. SapHetHan={}, SapHetSL={}, Admins={}",
                sapHetHan.size(), sapHetSL.size(), admins.size());
    }
}
