package com.qlpk.backend.service;

import com.qlpk.backend.dto.BulkDefaultShiftRequest;
import com.qlpk.backend.dto.BulkDefaultShiftResult;
import com.qlpk.backend.dto.LichThangDTO;
import com.qlpk.backend.dto.NhanCaMacDinhDenCuoiNamRequest;
import com.qlpk.backend.dto.DoctorScheduleSummaryDTO;
import com.qlpk.backend.entity.BangPhanCongCaLam;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface BangPhanCongCaLamService {
     List<BangPhanCongCaLam> getAll();
     BangPhanCongCaLam getById(Integer id);
     BangPhanCongCaLam create(BangPhanCongCaLam entity);
     BangPhanCongCaLam update(Integer id, BangPhanCongCaLam entity);

     BangPhanCongCaLam updateNghiPhep(Integer id, String lyDo);

     void xuLyNghiDotXuat(Integer maBacSi, LocalDate ngay, String lyDo);

     void delete(Integer id);
    int deleteDefaultByWeekday(Integer maNhanVien, int nam, int thang, String thu);
    List<BangPhanCongCaLam> createDefaultInMonth(BulkDefaultShiftRequest request);
    BulkDefaultShiftResult nhanCaMacDinhDenCuoiNam(NhanCaMacDinhDenCuoiNamRequest request);

    List<BangPhanCongCaLam> updateDefaultInMonth(BulkDefaultShiftRequest request);

    List<BangPhanCongCaLam> getWorkingToday();
    List<BangPhanCongCaLam> getByMaNhanVien(Integer maNhanVien);
    Map<String, Object> getCurrentRoom(Integer maNhanVien);

    Map<String, Object> getPhongTheoBacSi(Integer maBacSi, LocalDate ngay);

    Integer getPhongDangTrucCuaUser(Integer maNhanVien);

    LichThangDTO getLichThang(Integer maNhanVien, int nam, int thang);

    LichThangDTO getLichThangChoBenhNhan(Integer maNhanVien, int nam, int thang);

    List<DoctorScheduleSummaryDTO> getSummaryTuan(List<Integer> maNhanViens, List<String> dsThu);
}
