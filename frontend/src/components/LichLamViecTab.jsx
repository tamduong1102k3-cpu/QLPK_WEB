import { useState, useEffect, useMemo, useCallback } from "react";
import { getMonthScheduleApi } from "../api/shiftApi";
import { getAllNhanVienApi as getAllEmployeesApi } from "../api/employeeApi";
import {
  getAllChucVuApi as getChucVuApi,
  getAllChuyenKhoaApi as getChuyenKhoaApi,
  getAllPhongApi as getPhongApi,
} from "../api/danhMucApi";
import {
  getMaNhanVienFromAccessToken,
  getHoTenFromAccessToken,
} from "../api/tokenStore";

const THU_ORDER = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ Nhật",
];

const TIEU_DE_THEO_LOAI = {
  NGHI_PHEP: "Nghỉ phép",
  THEM_CA: "Thêm ca thường ngoại lệ",
  DOI_CA: "Đổi ca",
};

const fmtGio = (s) => (s || "").substring(0, 5) || "--:--";

const getShiftTimeValue = (entry) =>
  entry?.ca?.gioBatDau || entry?.gioLam || "";

const getShiftDisplayName = (entry) => {
  const ca = entry?.ca;
  const timeValue = getShiftTimeValue(entry);
  const hour = Number(String(timeValue).split(":")[0] || 0);
  return ca?.tenCa || (hour < 12 ? "ca sáng" : "ca chiều");
};

const ADMIN_ROLE_NAMES = ["quản trị viên", "quản trị"];

const getEmployeeId = (s) => s?.maNhanVien ?? s?.ma_nhan_vien;
const getEmployeeName = (s) => s?.hoTen ?? s?.ho_ten ?? "";

const normalizeFilterText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

function EmployeeSearchField({
  items,
  value,
  selectedId,
  open,
  onOpen,
  onClose,
  onSearch,
  onSelect,
  onClear,
}) {
  const normalizeSearchText = (v) =>
    String(v || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const labelOf = (s) => {
    const id = s.maNhanVien || s.ma_nhan_vien;
    return `${s.hoTen || s.ho_ten} (NV${String(id).padStart(3, "0")})`;
  };

  const filtered = useMemo(() => {
    const q = normalizeSearchText(value.trim());
    if (!q) return items;
    return items.filter((s) => {
      const name = normalizeSearchText(s.hoTen || s.ho_ten);
      const code = normalizeSearchText(s.maNhanVien || s.ma_nhan_vien);
      return (
        name.includes(q) ||
        code.includes(q) ||
        labelOf(s).toLowerCase().includes(q)
      );
    });
  }, [items, value]);

  return (
    <div style={{ position: "relative", minWidth: "260px" }}>
      <input
        type="text"
        value={value}
        onFocus={() => onOpen?.()}
        onChange={(e) => onSearch?.(e.target.value)}
        placeholder="Tìm nhân viên..."
        style={{
          width: "100%",
          padding: "8px 12px",
          paddingRight: "32px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          fontSize: "13px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onClear?.()}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            color: "#64748b",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
          }}
          aria-label="Xóa tìm kiếm nhân viên"
        >
          ×
        </button>
      )}
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: "220px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
            zIndex: 20,
          }}
        >
          {filtered.slice(0, 40).map((s) => {
            const id = s.maNhanVien || s.ma_nhan_vien;
            const label = labelOf(s);
            return (
              <div
                key={id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect?.(String(id), label);
                  onClose?.();
                }}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: "13px",
                  background:
                    String(id) === String(selectedId) ? "#eff6ff" : "#fff",
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LichLamViecTab({ user }) {
  // Ưu tiên lấy mã nhân viên từ JWT token, fallback về user prop
  const maNhanVien =
    getMaNhanVienFromAccessToken() || user?.maNhanVien || user?.id;
  const employeeName =
    getHoTenFromAccessToken() || user?.hoTen || user?.ho_ten || "";

  /* ============================================================
     DATA STATE
     ============================================================ */
  const [staff, setStaff] = useState([]);
  const [chucVuList, setChucVuList] = useState([]);
  const [chuyenKhoaList, setChuyenKhoaList] = useState([]);
  const [phongList, setPhongList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterChucVu, setFilterChucVu] = useState("");
  const [filterChuyenKhoa, setFilterChuyenKhoa] = useState("");
  const [filterPhong, setFilterPhong] = useState("");

  /* ============================================================
     CALENDAR STATE
     ============================================================ */
  const [calSelectedMaNV, setCalSelectedMaNV] = useState(
    maNhanVien ? String(maNhanVien) : "",
  );
  const [calEmployeeSearch, setCalEmployeeSearch] = useState("");
  const [calEmpOpen, setCalEmpOpen] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calData, setCalData] = useState(null);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState(null);
  const [calSelectedDay, setCalSelectedDay] = useState(null);

  /* ============================================================
     DATA FETCH
     ============================================================ */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nvData, cvData, ckData, phData] = await Promise.all([
        getAllEmployeesApi(),
        getChucVuApi(),
        getChuyenKhoaApi(),
        getPhongApi(),
      ]);
      setStaff(nvData || []);
      setChucVuList(cvData || []);
      setChuyenKhoaList(ckData || []);
      setPhongList(phData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  /* ============================================================
     CALENDAR LOGIC
     ============================================================ */
  const fetchCalMonth = useCallback(async () => {
    if (!calSelectedMaNV) {
      setCalData(null);
      return null;
    }
    setCalLoading(true);
    setCalError(null);
    try {
      const data = await getMonthScheduleApi(
        calSelectedMaNV,
        calYear,
        calMonth,
      );
      setCalData(data);
      return data;
    } catch (e) {
      setCalError(e.message);
      return null;
    } finally {
      setCalLoading(false);
    }
  }, [calSelectedMaNV, calYear, calMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalMonth();
  }, [fetchCalMonth]);

  const changeCalMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setCalMonth(m);
    setCalYear(y);
  };

  const calCells = useMemo(() => {
    const first = new Date(calYear, calMonth - 1, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const arr = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [calYear, calMonth]);

  const calGetDayData = (d) => {
    if (!calData || !calData.days) return null;
    const key = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return calData.days.find((x) => x.ngay === key) || null;
  };

  const calMergeShows = (day) => {
    if (!day) return { nghi: null, items: [] };
    const macDinh = day.macDinh || [];
    const ngoaiLe = day.ngoaiLe || [];

    const nghiList = ngoaiLe.filter((e) => e.loai === "NGHI_PHEP");
    const nghiCa = nghiList.find((e) => e.caThayThe);
    const nghiAll = nghiList.find((e) => !e.caThayThe);
    if (nghiAll) return { nghi: nghiAll, items: [] };

    const themCa = ngoaiLe.filter((e) => e.loai === "THEM_CA");
    const doiCa = ngoaiLe.filter(
      (e) => e.loai === "DOI_CA" || e.hanhDong === "THAY_THE",
    );

    const items = [];
    macDinh.forEach((m) => {
      if (
        nghiCa &&
        nghiCa.caThayThe &&
        m.ca &&
        nghiCa.caThayThe.id === m.ca.id
      ) {
        return;
      }
      items.push({
        kind: "macDinh",
        data: m,
        isNghi: m.hanhDong === "NGHI_PHEP",
      });
    });
    themCa.forEach((t) => {
      if (
        nghiCa &&
        nghiCa.caThayThe &&
        t.caThayThe &&
        nghiCa.caThayThe.id === t.caThayThe.id
      ) {
        return;
      }
      items.push({ kind: "them", data: t });
    });
    doiCa.forEach((d) => items.push({ kind: "doi", data: d }));

    return { nghi: nghiCa, items };
  };

  /* ============================================================
     STAFF HELPERS
     ============================================================ */
  const isAdminRole = (s) => {
    const cv = String(s.chucVu || s.chuc_vu || "")
      .trim()
      .toLowerCase();
    return ADMIN_ROLE_NAMES.some((name) => cv.includes(name));
  };
  const nonAdminStaff = staff.filter((s) => !isAdminRole(s));

  const normalizeSearchText = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const getEmployeeRoleText = (s) => {
    const directValue =
      s?.tenChucVu ??
      s?.ten_chuc_vu ??
      s?.chucVu ??
      s?.chuc_vu ??
      s?.vaiTro ??
      s?.vai_tro ??
      s?.tenVaiTro ??
      s?.ten_vai_tro ??
      "";
    if (directValue && typeof directValue !== "number") {
      return String(directValue).trim();
    }

    const idCandidates = [
      s?.maChucVu,
      s?.ma_chuc_vu,
      s?.chucVuId,
      s?.idChucVu,
      s?.maVaiTro,
      s?.ma_vai_tro,
      s?.chucVu,
      s?.chuc_vu,
      s?.vaiTro,
      s?.vai_tro,
    ].filter((v) => v !== null && v !== undefined && v !== "");

    for (const id of idCandidates) {
      const match = (chucVuList || []).find((cv) => {
        const candidateIds = [
          cv?.id,
          cv?.maChucVu,
          cv?.ma_chuc_vu,
          cv?.maVaiTro,
          cv?.ma_vai_tro,
        ];
        return candidateIds.some(
          (candidate) => String(candidate) === String(id),
        );
      });
      if (match) {
        return String(
          match.tenChucVu ??
            match.ten_chuc_vu ??
            match.tenVaiTro ??
            match.ten_vai_tro ??
            "",
        ).trim();
      }
    }

    return "";
  };

  const getEmployeeSpecialtyText = (s) => {
    const directValue =
      s?.tenChuyenKhoa ??
      s?.ten_chuyen_khoa ??
      s?.chuyenKhoa ??
      s?.chuyen_khoa ??
      s?.maChuyenKhoa ??
      s?.ma_chuyen_khoa ??
      s?.khoa ??
      "";
    if (directValue && typeof directValue !== "number") {
      return String(directValue).trim();
    }

    const idCandidates = [
      s?.maChuyenKhoa,
      s?.ma_chuyen_khoa,
      s?.chuyenKhoaId,
      s?.chuyenKhoa,
      s?.chuyen_khoa,
    ].filter((v) => v !== null && v !== undefined && v !== "");

    for (const id of idCandidates) {
      const match = (chuyenKhoaList || []).find((ck) => {
        const candidateIds = [ck?.maChuyenKhoa, ck?.ma_chuyen_khoa, ck?.id];
        return candidateIds.some(
          (candidate) => String(candidate) === String(id),
        );
      });
      if (match) {
        return String(
          match.tenChuyenKhoa ?? match.ten_chuyen_khoa ?? "",
        ).trim();
      }
    }

    return "";
  };

  const getEmployeeRoomText = (s) => {
    const directValue =
      s?.tenPhong ??
      s?.ten_phong ??
      s?.phong ??
      s?.phongLamViec ??
      s?.phongBan ??
      s?.maPhong ??
      s?.ma_phong ??
      "";
    if (directValue && typeof directValue !== "number") {
      return String(directValue).trim();
    }

    const idCandidates = [
      s?.maPhong,
      s?.ma_phong,
      s?.phongId,
      s?.phong,
      s?.phongBan,
    ].filter((v) => v !== null && v !== undefined && v !== "");

    for (const id of idCandidates) {
      const match = (phongList || []).find((p) => {
        const candidateIds = [p?.maPhong, p?.ma_phong, p?.id];
        return candidateIds.some(
          (candidate) => String(candidate) === String(id),
        );
      });
      if (match) {
        return String(match.tenPhong ?? match.ten_phong ?? "").trim();
      }
    }

    return "";
  };

  const getEmployeeLabel = (s) => {
    const id = getEmployeeId(s);
    return `${getEmployeeName(s)} (NV${String(id).padStart(3, "0")})`;
  };

  const matchesEmployeeFilters = (s) => {
    const roleText = normalizeFilterText(getEmployeeRoleText(s));
    const specialtyText = normalizeFilterText(getEmployeeSpecialtyText(s));
    const roomText = normalizeFilterText(getEmployeeRoomText(s));
    const filterRoleMatched =
      !filterChucVu || roleText === normalizeFilterText(filterChucVu);
    const filterSpecialtyMatched =
      !filterChuyenKhoa ||
      specialtyText === normalizeFilterText(filterChuyenKhoa);
    const filterRoomMatched =
      !filterPhong || roomText === normalizeFilterText(filterPhong);
    return filterRoleMatched && filterSpecialtyMatched && filterRoomMatched;
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  const filteredCalEmployees = useMemo(() => {
    const list = nonAdminStaff.filter((s) => matchesEmployeeFilters(s));
    const q = normalizeSearchText(calEmployeeSearch.trim());
    if (!q) return list;
    return list.filter((s) => {
      const name = normalizeSearchText(s.hoTen || s.ho_ten);
      const code = normalizeSearchText(s.maNhanVien || s.ma_nhan_vien);
      const specialty = normalizeSearchText(getEmployeeSpecialtyText(s));
      const role = normalizeSearchText(getEmployeeRoleText(s));
      const room = normalizeSearchText(getEmployeeRoomText(s));
      const label = normalizeSearchText(getEmployeeLabel(s));
      return (
        name.includes(q) ||
        code.includes(q) ||
        specialty.includes(q) ||
        role.includes(q) ||
        room.includes(q) ||
        label.includes(q)
      );
    });
  }, [
    nonAdminStaff,
    calEmployeeSearch,
    filterChucVu,
    filterChuyenKhoa,
    filterPhong,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Mặc định chọn nhân viên đang đăng nhập
  useEffect(() => {
    if (!calSelectedMaNV) return;
    const selected = nonAdminStaff.find(
      (s) => String(s.maNhanVien || s.ma_nhan_vien) === String(calSelectedMaNV),
    );
    if (selected) {
      const label = getEmployeeLabel(selected);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalEmployeeSearch((prev) => (prev === label ? prev : label));
    }
  }, [calSelectedMaNV, nonAdminStaff]);

  useEffect(() => {
    // Chỉ reset khi dữ liệu đã load xong và không phải nhân viên đang đăng nhập
    if (
      !loading &&
      calSelectedMaNV &&
      String(calSelectedMaNV) !== String(maNhanVien) &&
      !filteredCalEmployees.some(
        (s) => String(getEmployeeId(s)) === String(calSelectedMaNV),
      )
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalSelectedMaNV("");
      setCalEmployeeSearch("");
      setCalEmpOpen(false);
    }
  }, [filteredCalEmployees, calSelectedMaNV, loading, maNhanVien]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "3px solid #e5e7eb",
            borderTopColor: "#005bc0",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ color: "#6b7280" }}>Đang tải lịch làm việc...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          margin: "20px",
          padding: "20px",
          background: "#fee2e2",
          borderRadius: "10px",
          color: "#991b1b",
        }}
      >
        <strong>Lỗi:</strong> {error}
        <button
          onClick={fetchData}
          style={{
            marginLeft: "12px",
            padding: "4px 12px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      </div>
    );

  if (!maNhanVien) {
    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#94a3b8",
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            fontSize: "14px",
          }}
        >
          Không xác định được mã nhân viên.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "20px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg,#005bc0,#0077e6)",
          padding: "14px 24px",
          borderRadius: "10px 10px 0 0",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
          📅 LỊCH LÀM VIỆC
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", opacity: 0.9 }}>Chuyên khoa:</span>
            <select
              value={filterChuyenKhoa}
              onChange={(e) => setFilterChuyenKhoa(e.target.value)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="" style={{ color: "#111", background: "#fff" }}>
                Tất cả
              </option>
              {chuyenKhoaList.map((ck) => (
                <option
                  key={ck.maChuyenKhoa || ck.ma_chuyen_khoa || ck.id}
                  value={ck.tenChuyenKhoa || ck.ten_chuyen_khoa}
                  style={{ color: "#111", background: "#fff" }}
                >
                  {ck.tenChuyenKhoa || ck.ten_chuyen_khoa}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", opacity: 0.9 }}>Vai trò:</span>
            <select
              value={filterChucVu}
              onChange={(e) => setFilterChucVu(e.target.value)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="" style={{ color: "#111", background: "#fff" }}>
                Tất cả
              </option>
              {chucVuList
                .filter((cv) => {
                  const name = String(cv.tenChucVu || cv.ten_chuc_vu || "")
                    .trim()
                    .toLowerCase();
                  return !ADMIN_ROLE_NAMES.some((r) => name === r);
                })
                .map((cv) => (
                  <option
                    key={cv.id || cv.ma_chuc_vu || cv.maChucVu}
                    value={cv.tenChucVu || cv.ten_chuc_vu}
                    style={{ color: "#111", background: "#fff" }}
                  >
                    {cv.tenChucVu || cv.ten_chuc_vu}
                  </option>
                ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", opacity: 0.9 }}>Phòng:</span>
            <select
              value={filterPhong}
              onChange={(e) => setFilterPhong(e.target.value)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="" style={{ color: "#111", background: "#fff" }}>
                Tất cả
              </option>
              {phongList.map((p) => (
                <option
                  key={p.maPhong || p.ma_phong || p.id}
                  value={p.tenPhong || p.ten_phong}
                  style={{ color: "#111", background: "#fff" }}
                >
                  {p.tenPhong || p.ten_phong}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "13px",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              maxWidth: "280px",
            }}
          >
            <span style={{ opacity: 0.9 }}>👤</span>
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {employeeName
                ? `${employeeName} (NV${String(maNhanVien).padStart(3, "0")})`
                : `NV${String(maNhanVien).padStart(3, "0")}`}
            </span>
          </div>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      <>
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                Nhân viên:
              </span>
              <EmployeeSearchField
                items={filteredCalEmployees}
                value={calEmployeeSearch}
                selectedId={calSelectedMaNV}
                open={calEmpOpen}
                onOpen={() => setCalEmpOpen(true)}
                onClose={() => setCalEmpOpen(false)}
                onSearch={(next) => {
                  setCalSelectedMaNV("");
                  setCalEmployeeSearch(next);
                  setCalEmpOpen(true);
                }}
                onSelect={(id, label) => {
                  setCalSelectedMaNV(id);
                  setCalEmployeeSearch(label);
                }}
                onClear={() => {
                  setCalEmployeeSearch("");
                  setCalSelectedMaNV("");
                  setCalEmpOpen(false);
                }}
              />
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <button
                onClick={() => changeCalMonth(-1)}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ◀
              </button>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  minWidth: "100px",
                  textAlign: "center",
                }}
              >
                {calMonth}/{calYear}
              </span>
              <button
                onClick={() => changeCalMonth(1)}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ▶
              </button>
              <button
                onClick={() => {
                  const n = new Date();
                  setCalMonth(n.getMonth() + 1);
                  setCalYear(n.getFullYear());
                }}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Hôm nay
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "12px",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            padding: "12px",
            overflowX: "auto",
          }}
        >
          {calLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#005bc0",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ color: "#6b7280" }}>Đang tải lịch tháng...</span>
            </div>
          )}
          {calError && !calLoading && (
            <div
              style={{
                margin: "12px",
                padding: "14px",
                background: "#fee2e2",
                borderRadius: "8px",
                color: "#991b1b",
              }}
            >
              Lỗi: {calError}
            </div>
          )}
          {!calLoading && !calError && calSelectedMaNV && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "6px",
                minWidth: "820px",
              }}
            >
              {THU_ORDER.map((t) => (
                <div
                  key={t}
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background:
                      t === "Thứ 7" || t === "Chủ Nhật"
                        ? "#fef2f2"
                        : "#f1f5f9",
                    color:
                      t === "Thứ 7" || t === "Chủ Nhật"
                        ? "#e11d48"
                        : "#475569",
                  }}
                >
                  {t}
                </div>
              ))}
              {calCells.map((d, idx) => {
                if (d === null)
                  return (
                    <div
                      key={`e-${idx}`}
                      style={{
                        minHeight: "104px",
                        borderRadius: "10px",
                        background: "#fafafa",
                      }}
                    />
                  );
                const day = calGetDayData(d);
                const { nghi, items } = calMergeShows(day);
                const dateKey = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isToday =
                  dateKey ===
                  (() => {
                    const n = new Date();
                    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
                  })();
                const isWeekend =
                  new Date(calYear, calMonth - 1, d).getDay() === 0 ||
                  new Date(calYear, calMonth - 1, d).getDay() === 6;
                return (
                  <div
                    key={dateKey}
                    onClick={() => day && setCalSelectedDay(day)}
                    style={{
                      minHeight: "104px",
                      borderRadius: "10px",
                      padding: "6px",
                      cursor: day ? "pointer" : "default",
                      border: isToday
                        ? "2px solid #005bc0"
                        : "1px solid #e5e7eb",
                      background: "#fff",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) =>
                      day &&
                      (e.currentTarget.style.background = "#f0f9ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#fff")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: isToday
                            ? "#005bc0"
                            : isWeekend
                              ? "#e11d48"
                              : "#1e293b",
                        }}
                      >
                        {d}
                      </span>
                      {isToday && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 700,
                            color: "#fff",
                            background: "#005bc0",
                            borderRadius: "6px",
                            padding: "1px 5px",
                          }}
                        >
                          Nay
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {nghi && (
                        <div
                          style={{
                            background: "#fee2e2",
                            border: "1px solid #fca5a5",
                            borderRadius: "6px",
                            padding: "3px 6px",
                            fontSize: "11px",
                            color: "#b91c1c",
                            fontWeight: 700,
                          }}
                        >
                          🚫 Nghỉ{nghi.lyDo ? ` (${nghi.lyDo})` : ""}
                        </div>
                      )}
                      {items.map((it, i) => {
                        const isExtra = it.kind === "them";
                        const isDoi = it.kind === "doi";
                        const bg = isExtra
                          ? "linear-gradient(135deg,#fef9c3,#fef08a)"
                          : isDoi
                            ? "linear-gradient(135deg,#ede9fe,#ddd6fe)"
                            : "linear-gradient(135deg,#dbeafe,#eff6ff)";
                        const border = isExtra
                          ? "#facc15"
                          : isDoi
                            ? "#c4b5fd"
                            : "#93c5fd";
                        const color = isExtra
                          ? "#854d0e"
                          : isDoi
                            ? "#5b21b6"
                            : "#1e40af";
                        return (
                          <div
                            key={i}
                            style={{
                              background: bg,
                              border: `1px solid ${border}`,
                              borderRadius: "6px",
                              padding: "3px 6px",
                              fontSize: "11px",
                              color,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              📍 {it.data.tenPhong || "—"}
                            </div>
                            <div>
                              {isDoi
                                ? it.data.caThayThe?.tenCa || "Đổi ca"
                                : (() => {
                                    const ca = it.data.ca;
                                    const name = getShiftDisplayName(it.data);
                                    const start = fmtGio(
                                      isDoi
                                        ? it.data.gioLam
                                        : ca?.gioBatDau || it.data.gioLam,
                                    );
                                    const end = fmtGio(
                                      isDoi
                                        ? it.data.gioKetThuc
                                        : ca?.gioKetThuc ||
                                            it.data.gioKetThuc,
                                    );
                                    return `${name} ${start}-${end}`;
                                  })()}
                            </div>
                            {it.isNghi && (
                              <div
                                style={{
                                  color: "#dc2626",
                                  fontWeight: 700,
                                  fontSize: "10px",
                                  marginTop: "2px",
                                }}
                              >
                                🚫 Nghỉ phép
                                {it.data.lyDo ? ` (${it.data.lyDo})` : ""}
                              </div>
                            )}
                            {isExtra && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  fontStyle: "italic",
                                }}
                              >
                                Thêm ca thường ngoại lệ
                              </div>
                            )}
                            {isDoi && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  fontStyle: "italic",
                                }}
                              >
                                Đổi ca
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!nghi && items.length === 0 && (
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#cbd5e1",
                            textAlign: "center",
                            marginTop: "8px",
                          }}
                        >
                          —
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!calLoading && !calError && !calSelectedMaNV && (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              Vui lòng chọn nhân viên để xem lịch tháng.
            </div>
          )}
        </div>

        {/* MODAL CHI TIẾT NGÀY (READ-ONLY) */}
        {calSelectedDay && calSelectedMaNV && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "16px",
            }}
          >
            <div
              style={{
                background: "#fff",
                width: "480px",
                maxWidth: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "16px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  background: "#005bc0",
                  padding: "16px 20px",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: "16px 16px 0 0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    Chi tiết ca ngày {calSelectedDay.ngay}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.85 }}>
                    {calSelectedDay.thu} ·{" "}
                    {(() => {
                      const emp = nonAdminStaff.find(
                        (s) =>
                          String(s.maNhanVien || s.ma_nhan_vien) ===
                          String(calSelectedMaNV),
                      );
                      return emp?.hoTen || emp?.ho_ten || "";
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setCalSelectedDay(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "16px 20px" }}>
                {/* Ca mặc định - read only */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Ca làm việc mặc định trong tháng (theo {calSelectedDay.thu})
                  </div>
                  {(calSelectedDay.macDinh || []).length === 0 ? (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontStyle: "italic",
                        marginBottom: "6px",
                      }}
                    >
                      Chưa có ca làm việc mặc định cho thứ này.
                    </div>
                  ) : (
                    (calSelectedDay.macDinh || []).map((m) => (
                      <div
                        key={m.id}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          fontSize: "12px",
                          color: "#334155",
                          marginBottom: "4px",
                        }}
                      >
                        📍 {m.tenPhong || "—"}
                        <br />
                        {(() => {
                          const ca = m.ca;
                          const name =
                            ca?.tenCa ||
                            (() => {
                              const h = Number(
                                (ca?.gioBatDau || m.gioLam || "").split(
                                  ":",
                                )[0],
                              );
                              return h < 12 ? "ca sáng" : "ca chiều";
                            })();
                          const start = fmtGio(ca?.gioBatDau || m.gioLam);
                          const end = fmtGio(
                            ca?.gioKetThuc || m.gioKetThuc,
                          );
                          return `${name} ${start}-${end}`;
                        })()}
                        {m.hanhDong === "NGHI_PHEP" && (
                          <>
                            <div
                              style={{
                                color: "#dc2626",
                                fontWeight: 600,
                                marginTop: "2px",
                              }}
                            >
                              🚫 Nghỉ phép
                            </div>
                            {m.lyDo && (
                              <div
                                style={{
                                  color: "#b91c1c",
                                  fontSize: "11px",
                                  marginTop: "1px",
                                }}
                              >
                                Lý do: {m.lyDo}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Ngoại lệ - read only */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Ngoại lệ đã có
                  </div>
                  {(calSelectedDay.ngoaiLe || []).filter(
                    (e) => e.loai !== "NGHI_PHEP",
                  ).length === 0 ? (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontStyle: "italic",
                      }}
                    >
                      Chưa có.
                    </div>
                  ) : (
                    (calSelectedDay.ngoaiLe || [])
                      .filter((e) => e.loai !== "NGHI_PHEP")
                      .map((ex) => (
                        <div
                          key={ex.id}
                          style={{
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            color: "#9a3412",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>
                            {TIEU_DE_THEO_LOAI[ex.loai] || ex.loai}
                          </span>
                          {ex.caThayThe?.tenCa
                            ? ` · ${ex.caThayThe.tenCa}`
                            : ""}
                          {ex.tenPhong ? ` · 📍 ${ex.tenPhong}` : ""}
                          {ex.gioLam
                            ? ` · 🕗 ${fmtGio(ex.gioLam)}–${fmtGio(ex.gioKetThuc)}`
                            : ""}
                          {ex.lyDo ? ` · 📝 ${ex.lyDo}` : ""}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}