package com.qlpk.backend.service.impl;

import com.qlpk.backend.entity.NhanVien;
import com.qlpk.backend.entity.TaiKhoan;
import com.qlpk.backend.dto.NhanVienRequestDTO;
import com.qlpk.backend.exception.DuplicateFieldException;
import com.qlpk.backend.exception.NhanVienDeletionException;
import com.qlpk.backend.exception.NhanVienValidationException;
import com.qlpk.backend.repository.NhanVienRepository;
import com.qlpk.backend.service.NhanVienService;
import com.qlpk.backend.repository.TaiKhoanRepository;
import com.qlpk.backend.repository.RefreshTokenRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class NhanVienServiceImpl implements NhanVienService {

    private static final String DELETION_BLOCKED_MESSAGE =
        "Không thể xóa nhân viên này vì còn dữ liệu liên quan.";

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.default-employee-password:12345}")
    private String defaultEmployeePassword;

    @Override
    public List<NhanVien> getAllNhanVien() {
        return populateHoatDong(nhanVienRepository.findAll());
    }

    private List<NhanVien> populateHoatDong(List<NhanVien> list) {
        for (NhanVien nv : list) {
            TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVien(nv.getMaNhanVien());
            nv.setHoatDong(taiKhoan != null ? taiKhoan.getHoatDong() : false);
        }
        return list;
    }

    @Override
    public List<NhanVien> searchNhanVien(String keyword, Integer chuyenKhoa, String vaiTro) {
        return populateHoatDong(nhanVienRepository.searchNhanVien(keyword, chuyenKhoa, vaiTro));
    }

    @Override
    public NhanVien getNhanVienById(Integer id) {
        return nhanVienRepository.findById(id).orElse(null);
    }

    @Override
    public List<NhanVien> getNhanVienByChucVu(String chucVu) {
        return nhanVienRepository.findByChucVu(chucVu);
    }

    @Override
    public List<NhanVien> getNhanVienByChuyenKhoa(Integer chuyenKhoa) {
        return nhanVienRepository.findByChuyenKhoa(chuyenKhoa);
    }

    @Override
    public List<NhanVien> getBacSiByChuyenKhoa(Integer chuyenKhoa) {
        return nhanVienRepository.findByChucVuAndChuyenKhoa("Bác sĩ", chuyenKhoa);
    }

    @Override
    @Transactional
    public void addNhanVienViaProcedure(NhanVienRequestDTO dto) {
        validateEmployeeRequest(dto);
        validateUniqueFields(dto, null, true);

        // Mã hóa mật khẩu mặc định
        String defaultPassword = passwordEncoder.encode(defaultEmployeePassword);

        NhanVien nv = new NhanVien();
        nv.setHoTen(dto.getHoTen());
        nv.setGioiTinh(dto.getGioiTinh());
        nv.setNgaySinh(dto.getNgaySinh());
        nv.setCccd(dto.getCccd());
        nv.setDiaChi(dto.getDiaChi());
        nv.setSoDienThoai(dto.getSoDienThoai());
        nv.setEmail(dto.getEmail());
        nv.setBangCap(dto.getBangCap());
        nv.setChucVu(dto.getChucVu());
        nv.setChuyenKhoa(isSpecialtyNotApplicable(dto.getChucVu(), dto.getRole()) ? null : dto.getChuyenKhoa());
        nv.setNgayVaoLam(dto.getNgayVaoLam());

        nv = nhanVienRepository.save(nv);

        TaiKhoan tk = new TaiKhoan();
        tk.setUsername(dto.getUsername());
        tk.setEmail(dto.getEmail());
        tk.setMatKhau(defaultPassword);
        tk.setMaNhanVien(nv.getMaNhanVien());
        tk.setVaiTro(dto.getRole());
        tk.setLanDauDangNhap(true);
        tk.setHoatDong(true);

        taiKhoanRepository.save(tk);
    }

    @Override
    @Transactional
    public void updateNhanVien(Integer id, NhanVienRequestDTO dto) {
        validateEmployeeRequest(dto);

        NhanVien nv = nhanVienRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));
        validateUniqueFields(dto, id, false);

        nv.setHoTen(dto.getHoTen());
        nv.setGioiTinh(dto.getGioiTinh());
        nv.setNgaySinh(dto.getNgaySinh());
        nv.setCccd(dto.getCccd());
        nv.setDiaChi(dto.getDiaChi());
        nv.setSoDienThoai(dto.getSoDienThoai());
        nv.setEmail(dto.getEmail());
        nv.setChuyenKhoa(isSpecialtyNotApplicable(dto.getChucVu(), dto.getRole()) ? null : dto.getChuyenKhoa());
        nv.setBangCap(dto.getBangCap());
        nv.setChucVu(dto.getChucVu());
        nv.setNgayVaoLam(dto.getNgayVaoLam());

        nhanVienRepository.save(nv);
    }

    private void validateUniqueFields(NhanVienRequestDTO dto, Integer employeeId, boolean creating) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        String cccd = dto.getCccd() == null ? null : dto.getCccd().trim();
        String phone = dto.getSoDienThoai() == null ? null : dto.getSoDienThoai().trim();
        String email = dto.getEmail() == null ? null : dto.getEmail().trim();

        if (cccd != null && (employeeId == null
                ? nhanVienRepository.existsByCccd(cccd)
                : nhanVienRepository.existsByCccdAndMaNhanVienNot(cccd, employeeId))) {
            fieldErrors.put("cccd", "Số CCCD đã tồn tại");
        }
        if (phone != null && (employeeId == null
                ? nhanVienRepository.existsBySoDienThoai(phone)
                : nhanVienRepository.existsBySoDienThoaiAndMaNhanVienNot(phone, employeeId))) {
            fieldErrors.put("soDienThoai", "Số điện thoại đã tồn tại");
        }
        if (email != null && (employeeId == null
                ? nhanVienRepository.existsByEmail(email)
                : nhanVienRepository.existsByEmailAndMaNhanVienNot(email, employeeId))) {
            fieldErrors.put("email", "Email đã tồn tại");
        }

        if (creating) {
            if (email != null && taiKhoanRepository.existsByEmail(email)) {
                fieldErrors.put("email", "Email đã tồn tại");
            }
            String username = dto.getUsername() == null ? null : dto.getUsername().trim();
            if (username != null && taiKhoanRepository.existsByUsername(username)) {
                fieldErrors.put("username", "Tên đăng nhập đã tồn tại");
            }
        }

        if (!fieldErrors.isEmpty()) {
            throw new DuplicateFieldException(fieldErrors);
        }
    }

    private void validateEmployeeRequest(NhanVienRequestDTO dto) {
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        LocalDate ngaySinh = toLocalDate(dto.getNgaySinh());
        LocalDate ngayVaoLam = toLocalDate(dto.getNgayVaoLam());

        validateDateNotInFuture(ngaySinh, "Ngày sinh", today);
        if (ngaySinh != null && Period.between(ngaySinh, today).getYears() < 18) {
            throw new NhanVienValidationException("Nhân viên phải từ đủ 18 tuổi trở lên.");
        }
        validateDateNotInFuture(ngayVaoLam, "Ngày vào làm", today);
        if (ngaySinh != null && ngayVaoLam != null && ngayVaoLam.isBefore(ngaySinh)) {
            throw new NhanVienValidationException("Ngày vào làm không thể trước ngày sinh.");
        }

        if (requiresSpecialty(dto.getChucVu(), dto.getRole()) && dto.getChuyenKhoa() == null) {
            throw new NhanVienValidationException("Vui lòng chọn chuyên khoa cho chức vụ này.");
        }
    }

    private boolean requiresSpecialty(String chucVu, String role) {
        String normalizedChucVu = Normalizer.normalize(
            chucVu == null ? "" : chucVu,
            Normalizer.Form.NFD
        ).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        String normalizedRole = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);

        return normalizedChucVu.contains("bac si")
            || normalizedRole.startsWith("BAC_SI")
            || normalizedRole.startsWith("TRO_LY_BAC_SI");
    }

    private boolean isSpecialtyNotApplicable(String chucVu, String role) {
        String normalizedChucVu = Normalizer.normalize(
            chucVu == null ? "" : chucVu,
            Normalizer.Form.NFD
        ).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        String normalizedRole = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);

        return List.of("duoc si", "le tan", "nhan vien kho", "quan tri vien", "thu ngan")
                .stream()
                .anyMatch(normalizedChucVu::contains)
            || List.of("DUOC_SI", "LE_TAN", "NHAN_VIEN_KHO", "QUAN_TRI_VIEN", "THU_NGAN")
                .contains(normalizedRole);
    }

    private LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }

    private void validateDateNotInFuture(LocalDate date, String field, LocalDate today) {
        if (date != null && date.isAfter(today)) {
            throw new NhanVienValidationException(field + " không thể ở tương lai.");
        }
    }

    @Override
    @Transactional
    public void deleteNhanVien(Integer id) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVien(id);
        if (taiKhoan == null) {
            throw new RuntimeException("Không tìm thấy tài khoản của nhân viên này.");
        }

        taiKhoan.setHoatDong(false);
        taiKhoanRepository.save(taiKhoan);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkDeleteNhanVien(Integer id) {
        nhanVienRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên."));

        TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVien(id);
        boolean canDelete = findReferencingTable(
            "nhan_vien", "ma_nhan_vien", id, Set.of("tai_khoan")
        ) == null;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("canDelete", canDelete);
        result.put("hasAccount", taiKhoan != null);
        result.put("username", taiKhoan == null ? null : taiKhoan.getUsername());
        result.put("canKeepAccount", false);
        if (!canDelete) {
            result.put("message", DELETION_BLOCKED_MESSAGE);
        }
        return result;
    }

    @Override
    @Transactional
    public void permanentlyDeleteNhanVien(Integer id) {
        NhanVien nhanVien = nhanVienRepository.findByIdForUpdate(id)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên."));

        preventDeletingCurrentEmployee(id);

        try {
            String employeeReference = findReferencingTable(
                "nhan_vien", "ma_nhan_vien", id, Set.of("tai_khoan")
            );
            if (employeeReference != null) {
                throw new NhanVienDeletionException(DELETION_BLOCKED_MESSAGE);
            }

            TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVienForUpdate(id);
            if (taiKhoan != null) {
                String accountReference = findReferencingTable(
                    "tai_khoan", "ma_tai_khoan", taiKhoan.getMaTaiKhoan()
                );
                if (accountReference != null) {
                    throw new NhanVienDeletionException(DELETION_BLOCKED_MESSAGE);
                }

                refreshTokenRepository.deleteByUsername(taiKhoan.getUsername());
                refreshTokenRepository.flush();
                taiKhoanRepository.delete(taiKhoan);
                taiKhoanRepository.flush();
            }

            nhanVienRepository.delete(nhanVien);
            nhanVienRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new NhanVienDeletionException(DELETION_BLOCKED_MESSAGE, ex);
        }
    }

    private void preventDeletingCurrentEmployee(Integer employeeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return;
        }

        TaiKhoan currentAccount = taiKhoanRepository.findByUsername(authentication.getName());
        if (currentAccount != null && employeeId.equals(currentAccount.getMaNhanVien())) {
            throw new NhanVienDeletionException("Không thể tự xóa nhân viên đang đăng nhập.");
        }
    }

    private String findReferencingTable(String referencedTable, String referencedColumn, Integer referencedId) {
        return findReferencingTable(referencedTable, referencedColumn, referencedId, Set.of());
    }

    private String findReferencingTable(
            String referencedTable,
            String referencedColumn,
            Integer referencedId,
            Set<String> excludedTables) {
        List<ForeignKeyReference> references = jdbcTemplate.query(
            """
                SELECT TABLE_NAME, COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
                  AND REFERENCED_TABLE_NAME = ?
                  AND REFERENCED_COLUMN_NAME = ?
                UNION
                SELECT TABLE_NAME, COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND COLUMN_NAME LIKE CONCAT(?, '%')
                  AND TABLE_NAME <> ?
                """,
            (resultSet, rowNumber) -> new ForeignKeyReference(
                resultSet.getString("TABLE_NAME"),
                resultSet.getString("COLUMN_NAME")
            ),
            referencedTable,
            referencedColumn,
            referencedColumn,
            referencedTable
        );

        for (ForeignKeyReference reference : references) {
            if (excludedTables.contains(reference.tableName().toLowerCase(Locale.ROOT))) {
                continue;
            }
            String sql = "SELECT EXISTS (SELECT 1 FROM "
                + quoteIdentifier(reference.tableName())
                + " WHERE " + quoteIdentifier(reference.columnName()) + " = ?)";
            Integer exists = jdbcTemplate.queryForObject(sql, Integer.class, referencedId);
            if (exists != null && exists == 1) {
                return reference.tableName();
            }
        }
        return null;
    }

    private String quoteIdentifier(String identifier) {
        return "`" + identifier.replace("`", "``") + "`";
    }

    private record ForeignKeyReference(String tableName, String columnName) {
    }

    @Override
    @Transactional
    public void activateNhanVienAccount(Integer id) {
        TaiKhoan taiKhoan = taiKhoanRepository.findByMaNhanVien(id);
        if (taiKhoan == null) {
            throw new RuntimeException("Không tìm thấy tài khoản của nhân viên này.");
        }

        taiKhoan.setHoatDong(true);
        taiKhoanRepository.save(taiKhoan);
    }
}
