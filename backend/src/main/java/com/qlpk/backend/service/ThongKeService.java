package com.qlpk.backend.service;

import java.util.List;
import java.util.Map;

public interface ThongKeService {
    List<Map<String, Object>> thongKeTheoNam(int nam);
    List<Integer> namCoDuLieu();
    Map<String, Object> getDashboardSummary();
}
