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

     /**
      * Xử lý bác sĩ nghỉ đột xuất: hủy toàn bộ lịch hẹn CHUA_DEN của bác sĩ trong ngày.
      * KHÔNG @Transactional — mỗi lần gọi huyLich() sẽ mở transaction riêng qua Spring proxy,
      * nên lịch bị lỗi chỉ rollback lịch đó, không ảnh hưởng các lịch khác.
      * Gọi SAU KHI updateNghiPhep() đã commit để đảm bảo nghỉ phép luôn được ghi nhận.
      *
      * @param maBacSi Mã nhân viên (bác sĩ) nghỉ phép
      * @param ngay    Ngày khám cần hủy
      * @param lyDo    Lý do nghỉ (dùng cho thông báo bệnh nhân)
      */
     void xuLyNghiDotXuat(Integer maBacSi, LocalDate ngay, String lyDo);

     void delete(Integer id);
    int deleteDefaultByWeekday(Integer maNhanVien, int nam, int thang, String thu);
    List<BangPhanCongCaLam> createDefaultInMonth(BulkDefaultShiftRequest request);
    BulkDefaultShiftResult nhanCaMacDinhDenCuoiNam(NhanCaMacDinhDenCuoiNamRequest request);

    /**
     * Cập nhật hàng loạt tất cả các ca mặc định MAC_DINH cùng thứ trong tháng.
     * Chỉ thực hiện khi request.getUpdateAllThu() == true.
     * Mỗi bản ghi được cập nhật độc lập theo ID của chính nó.
     *
     * @param request yêu cầu cập nhật hàng loạt
     * @return danh sách các bản ghi đã được cập nhật
     * @throws RuntimeException nếu updateAllThu không được bật
     */
    List<BangPhanCongCaLam> updateDefaultInMonth(BulkDefaultShiftRequest request);

    List<BangPhanCongCaLam> getWorkingToday();
    List<BangPhanCongCaLam> getByMaNhanVien(Integer maNhanVien);
    Map<String, Object> getCurrentRoom(Integer maNhanVien);

    /**
     * Lấy phòng làm việc của bác sĩ theo ca hiện tại và ngày chỉ định.
     * Trả về { maCa, maPhong, tenPhong } hoặc throw RuntimeException kèm message lỗi.
     */
    Map<String, Object> getPhongTheoBacSi(Integer maBacSi, LocalDate ngay);

    /**
     * Lấy phòng đang trực của user theo lịch phân công.
     * Khi TAM_TAT_KIEM_TRA_PHONG_TRUC = true: trả phòng hoặc null (không throw).
     * Khi false: throw RuntimeException nếu ngoài giờ / không có lịch trực / nghỉ phép.
     */
    Integer getPhongDangTrucCuaUser(Integer maNhanVien);

    /**
     * Lấy lịch tháng đầy đủ (gộp ca mặc định + ngoại lệ) cho một nhân viên
     */
    LichThangDTO getLichThang(Integer maNhanVien, int nam, int thang);

    /**
     * Lấy lịch tháng cho bệnh nhân (public) — KHÔNG chứa field nhạy cảm
     * (hanhDong, lyDo). Clone toàn bộ 3 tầng DTO để tránh mutate entity JPA gốc.
     */
    LichThangDTO getLichThangChoBenhNhan(Integer maNhanVien, int nam, int thang);

    List<DoctorScheduleSummaryDTO> getSummaryTuan(List<Integer> maNhanViens, List<String> dsThu);
}
