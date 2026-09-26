package com.qlpk.backend.service.impl;

import com.qlpk.backend.repository.BenhNhanRepository;
import com.qlpk.backend.repository.ChiTietHoaDonRepository;
import com.qlpk.backend.repository.HoaDonRepository;
import com.qlpk.backend.repository.PhieuKhamRepository;
import com.qlpk.backend.service.ThongKeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class ThongKeServiceImpl implements ThongKeService {

    @Autowired private HoaDonRepository hoaDonRepository;
    @Autowired private PhieuKhamRepository phieuKhamRepository;
    @Autowired private BenhNhanRepository benhNhanRepository;
    @Autowired private ChiTietHoaDonRepository chiTietHoaDonRepository;

    @Override
    public List<Map<String, Object>> thongKeTheoNam(int nam) {
        List<Object[]> rawDT = hoaDonRepository.thongKeDoanhThuTheoNam(nam);
        Map<Integer, BigDecimal> mapDT = new HashMap<>();
        for (Object[] r : rawDT) {
            int thang     = ((Number) r[0]).intValue();
            BigDecimal dt = r[1] != null ? (BigDecimal) r[1] : BigDecimal.ZERO;
            mapDT.put(thang, dt);
        }

        List<Object[]> rawBN = phieuKhamRepository.thongKeLuotKhamTheoNam(nam);
        Map<Integer, Long> mapLuot   = new HashMap<>();
        Map<Integer, Long> mapBNMoi  = new HashMap<>();
        for (Object[] r : rawBN) {
            int thang   = ((Number) r[0]).intValue();
            long luot   = r[1] != null ? ((Number) r[1]).longValue() : 0L;
            long bnMoi  = r[2] != null ? ((Number) r[2]).longValue() : 0L;
            mapLuot.put(thang, luot);
            mapBNMoi.put(thang, bnMoi);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (int t = 1; t <= 12; t++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("thang",        t);
            row.put("doanhThu",     mapDT.getOrDefault(t, BigDecimal.ZERO));
            row.put("soLuotKham",   mapLuot.getOrDefault(t, 0L));
            row.put("soBenhNhanMoi",mapBNMoi.getOrDefault(t, 0L));
            result.add(row);
        }
        return result;
    }

    @Override
    public List<Integer> namCoDuLieu() {
        Set<Integer> years = new TreeSet<>(Comparator.reverseOrder());
        years.addAll(hoaDonRepository.findDistinctYears());
        years.addAll(phieuKhamRepository.findDistinctYears());
        if (years.isEmpty()) years.add(java.time.LocalDate.now().getYear());
        return new ArrayList<>(years);
    }

    @Override
    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();

        summary.put("tongBenhNhan", benhNhanRepository.count());

        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        java.time.LocalDateTime endOfDay = java.time.LocalDate.now().atTime(java.time.LocalTime.MAX);
        summary.put("lichKhamHomNay", phieuKhamRepository.countByNgayKhamBetween(startOfDay, endOfDay));

        int currentMonth = java.time.LocalDate.now().getMonthValue();
        int currentYear = java.time.LocalDate.now().getYear();
        java.math.BigDecimal revenue = hoaDonRepository.sumRevenueByMonth(currentMonth, currentYear);
        summary.put("doanhThuThang", revenue != null ? revenue : java.math.BigDecimal.ZERO);

        java.time.LocalDateTime sevenDaysAgo = java.time.LocalDate.now().minusDays(6).atStartOfDay();
        List<Object[]> revenue7Days = hoaDonRepository.thongKeDoanhThu7Ngay(sevenDaysAgo);

        List<Object[]> formattedRevenue7Days = new ArrayList<>();
        for (Object[] row : revenue7Days) {
            Object date = row[0];
            Object value = row[1];
            String dateStr = date != null ? date.toString() : "";
            java.math.BigDecimal val = value != null ? (java.math.BigDecimal) value : java.math.BigDecimal.ZERO;
            formattedRevenue7Days.add(new Object[]{ dateStr, val });
        }
        summary.put("doanhThu7Ngay", formattedRevenue7Days);

        summary.put("luotKhamTuan", phieuKhamRepository.countByNgayKhamBetween(sevenDaysAgo, java.time.LocalDateTime.now()));

        List<Object[]> topDichVu = chiTietHoaDonRepository.thongKeTopDichVu(org.springframework.data.domain.PageRequest.of(0, 5));
        summary.put("topDichVu", topDichVu);

        return summary;
    }
}
