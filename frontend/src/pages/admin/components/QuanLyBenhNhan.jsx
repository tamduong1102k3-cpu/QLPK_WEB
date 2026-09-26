import { getAllApi, searchApi, getHoSoApi } from "../../../api/benhNhanApi";
import { useState, useEffect, useCallback } from "react";
import ChiTietKhamModal from "../../../components/ChiTietKhamModal";
import usePagination from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";
import formatGender from "../../../utils/formatGender";

const fmt = (v) => v ?? "—";
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const fmtCurrency = (v) =>
  v != null
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(v)
    : "—";

const S = {
  card: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
  },
  th: {
    padding: "11px 14px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 14px",
    fontSize: "14px",
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "middle",
  },
};

const Badge = ({ text, bg, color }) => (
  <span
    style={{
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
      background: bg,
      color,
    }}
  >
    {text}
  </span>
);

const statusHD = (s) => {
  const m = {
    "da thanh toan": ["#dcfce7", "#166534", "Đã thanh toán"],
    "chua thanh toan": ["#fef9c3", "#a16207", "Chưa thanh toán"],
    huy: ["#fee2e2", "#991b1b", "Đã hủy"],
  };
  const [bg, color, label] = m[(s || "").toLowerCase()] || [
    "#f3f4f6",
    "#4b5563",
    s || "—",
  ];
  return <Badge text={label} bg={bg} color={color} />;
};

const statusPK = (s) => {
  const m = {
    hoan_thanh: ["#dcfce7", "#166534", "Hoàn thành"],
    dang_kham: ["#dbeafe", "#1d4ed8", "Đang khám"],
    cho: ["#fef3c7", "#92400e", "Chờ khám"],
    da_huy: ["#fee2e2", "#991b1b", "Đã hủy"],
  };
  const key = (s || "").toLowerCase().replace(" ", "_");
  const [bg, color, label] = m[key] || ["#f3f4f6", "#4b5563", s || "—"];
  return <Badge text={label} bg={bg} color={color} />;
};

// ── MAIN ─────────────────────────────────────────────────────────────────────
const QuanLyBenhNhan = ({
  allowViewDetail = true,
  title = "Hồ Sơ Bệnh Nhân",
}) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [hoSo, setHoSo] = useState([]);
  const [hoSoLoading, setHoSoLoading] = useState(false);
  const [activeHoSoTab, setActiveHoSoTab] = useState("lich-su");

  // Phân trang + search dùng chung
  const {
    paginatedData: paged,
    totalItems: filteredCount,
    totalPages: totalP,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
    pageError,
  } = usePagination({
    data: patients,
    pageSize: 10,
    searchKeys: ["hoTen", "soDienThoai", "cccd"],
    searchTerm: search,
  });

  const loadPatients = useCallback(async (kw = "") => {
    setLoading(true);
    try {
      const data = kw ? await searchApi({ keyword: kw }) : await getAllApi();
      setPatients(data || []);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadPatients]);

  useEffect(() => {
    const t = setTimeout(() => loadPatients(search), 350);
    return () => clearTimeout(t);
  }, [search, loadPatients]);

  const openProfile = async (p) => {
    setSelected(p);
    setHoSo([]);
    setHoSoLoading(true);
    try {
      const data = await getHoSoApi(p.maBenhNhan);
      setHoSo(data || []);
    } catch {
      setHoSo([]);
    } finally {
      setHoSoLoading(false);
    }
  };

  const paidInvoices = hoSo.filter(
    (h) =>
      h.maHoaDon && (h.trangThaiHoaDon || "").toLowerCase() === "da thanh toan",
  );
  const totalPaid = paidInvoices.reduce((s, h) => s + (h.tongTien || 0), 0);

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        height: "100%",
        alignItems: "flex-start",
      }}
    >
      {/* ── LEFT: Patient List ── */}
      <div
        style={{
          flex: selected ? "0 0 42%" : "1",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          transition: "flex .3s",
        }}
      >
        {/* Header */}
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "14px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Tổng:{" "}
                <strong style={{ color: "#2563eb" }}>{patients.length}</strong>{" "}
                bệnh nhân
              </p>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                fontSize: "20px",
              }}
            >
              search
            </span>
            <input
              placeholder="Tìm theo tên, SĐT, CCCD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "38px",
                paddingRight: "12px",
                paddingTop: "9px",
                paddingBottom: "9px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ ...S.card, overflow: "hidden" }}>
          {/* In-list warning */}
          {pageError && (
            <div
              style={{
                padding: "9px 16px",
                background: "#fef2f2",
                borderBottom: "1px solid #fee2e2",
                color: "#dc2626",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
              >
                error
              </span>
              {pageError}
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <tr>
                  <th style={S.th}>Mã BN</th>
                  <th style={S.th}>Họ Tên</th>
                  <th style={S.th}>Giới Tính</th>
                  <th style={S.th}>Ngày Sinh</th>
                  <th style={S.th}>Số ĐT</th>
                  <th style={S.th}>Nhóm Máu</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        ...S.td,
                        textAlign: "center",
                        padding: "48px",
                        color: "#9ca3af",
                      }}
                    >
                      Đang tải...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        ...S.td,
                        textAlign: "center",
                        padding: "48px",
                        color: "#9ca3af",
                      }}
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  paged.map((p) => {
                    const isActive = selected?.maBenhNhan === p.maBenhNhan;
                    return (
                      <tr
                        key={p.maBenhNhan}
                        style={{
                          background: isActive ? "#eff6ff" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => openProfile(p)}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={S.td}>
                          <strong style={{ color: "#2563eb" }}>
                            BN{String(p.maBenhNhan).padStart(4, "0")}
                          </strong>
                        </td>
                        <td style={{ ...S.td, fontWeight: 600 }}>
                          {fmt(p.hoTen)}
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: "13px" }}>
                            {formatGender(p.gioiTinh)}
                          </span>
                        </td>
                        <td style={S.td}>{fmtDate(p.ngaySinh)}</td>
                        <td style={S.td}>{fmt(p.soDienThoai)}</td>
                        <td style={S.td}>
                          {p.nhomMau ? (
                            <Badge
                              text={p.nhomMau}
                              bg="#fef2f2"
                              color="#dc2626"
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {!loading && totalP > 1 && (
              <Pagination
                mode="inline"
                currentPage={currentPage}
                totalPages={totalP}
                totalItems={filteredCount}
                label="bệnh nhân"
                visiblePages={visiblePages}
                onPageChange={setCurrentPage}
                jumpPage={jumpPage}
                onJumpPage={handleJumpPage}
                onJumpBlur={handleJumpPageBlur}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Profile Panel ── */}
      {selected && (
        <div
          style={{
            flex: "1",
            minWidth: "340px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            position: "sticky",
            top: 0,
          }}
        >
          {/* Patient Info Card */}
          <div style={{ ...S.card, padding: "22px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "22px",
                    fontWeight: 700,
                  }}
                >
                  {(selected.hoTen || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#1f2937",
                    }}
                  >
                    {selected.hoTen}
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    BN{String(selected.maBenhNhan).padStart(4, "0")}{" "}
                    &nbsp;•&nbsp; {formatGender(selected.gioiTinh)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              {[
                ["Ngày sinh", fmtDate(selected.ngaySinh)],
                ["CCCD", fmt(selected.cccd)],
                ["Số điện thoại", fmt(selected.soDienThoai)],
                ["Email", fmt(selected.email)],
                ["Nhóm máu", selected.nhomMau || "—"],
                ["Dị ứng thuốc", fmt(selected.diUngThuoc)],
                ["Nghề nghiệp", fmt(selected.ngheNghiep)],
                ["Người giám hộ", fmt(selected.nguoiGiamHo)],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    background: "#f9fafb",
                    borderRadius: "8px",
                    padding: "9px 12px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: "#9ca3af",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    {val}
                  </p>
                </div>
              ))}
            </div>

            {selected.diaChi && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "9px 12px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #bae6fd",
                }}
              >
                <p style={{ margin: 0, fontSize: "12px", color: "#0369a1" }}>
                  <strong>Địa chỉ:</strong> {selected.diaChi}
                </p>
              </div>
            )}
            {selected.ghiChu && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "9px 12px",
                  background: "#fffbeb",
                  borderRadius: "8px",
                  border: "1px solid #fde68a",
                }}
              >
                <p style={{ margin: 0, fontSize: "12px", color: "#92400e" }}>
                  <strong>Ghi chú:</strong> {selected.ghiChu}
                </p>
              </div>
            )}
          </div>

          {/* Stats summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            {[
              ["Lần khám", hoSo.length, "#dbeafe", "#1d4ed8", "stethoscope"],
              [
                "Đã thanh toán",
                paidInvoices.length,
                "#dcfce7",
                "#15803d",
                "receipt_long",
              ],
              [
                "Tổng chi",
                fmtCurrency(totalPaid).replace("₫", "").trim(),
                "#fef3c7",
                "#92400e",
                "payments",
              ],
            ].map(([label, val, bg, color, icon]) => (
              <div
                key={label}
                style={{
                  ...S.card,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "16px", color }}
                    >
                      {icon}
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1f2937",
                  }}
                >
                  {val}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Tab: Lịch sử / Hóa đơn */}
          <div style={S.card}>
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {[
                ["lich-su", "Lịch Sử Khám", "history"],
                ["hoa-don", "Hóa Đơn Đã Thanh Toán", "receipt_long"],
              ].map(([tab, label, icon]) => (
                <button
                  key={tab}
                  onClick={() => setActiveHoSoTab(tab)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "12px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: activeHoSoTab === tab ? "#2563eb" : "#6b7280",
                    borderBottom:
                      activeHoSoTab === tab
                        ? "2px solid #2563eb"
                        : "2px solid transparent",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "17px" }}
                  >
                    {icon}
                  </span>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: "340px", overflowY: "auto" }}>
              {hoSoLoading ? (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  Đang tải...
                </div>
              ) : activeHoSoTab === "lich-su" ? (
                hoSo.length === 0 ? (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "40px",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      event_busy
                    </span>
                    Chưa có lịch sử khám
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead
                      style={{
                        background: "#f9fafb",
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <tr>
                        <th style={{ ...S.th, fontSize: "11px" }}>Mã PK</th>
                        <th style={{ ...S.th, fontSize: "11px" }}>Ngày Khám</th>
                        <th style={{ ...S.th, fontSize: "11px" }}>
                          Chuyên Khoa
                        </th>
                        <th style={{ ...S.th, fontSize: "11px" }}>
                          Dịch Vụ Khám
                        </th>
                        <th style={{ ...S.th, fontSize: "11px" }}>Bác Sĩ</th>
                        <th style={{ ...S.th, fontSize: "11px" }}>
                          Trạng Thái
                        </th>
                        <th
                          style={{
                            ...S.th,
                            fontSize: "11px",
                            textAlign: "center",
                          }}
                        >
                          Thao Tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoSo.map((h) => (
                        <tr
                          key={h.maPhieuKham}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f9fafb")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                          style={{ borderBottom: "1px solid #f3f4f6" }}
                        >
                          <td
                            style={{
                              ...S.td,
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#2563eb",
                            }}
                          >
                            PK{String(h.maPhieuKham).padStart(4, "0")}
                          </td>
                          <td style={{ ...S.td, fontSize: "12px" }}>
                            {fmtDateTime(h.ngayKham)}
                          </td>
                          <td style={{ ...S.td, fontSize: "12px" }}>
                            {h.tenChuyenKhoa}
                          </td>
                          <td style={{ ...S.td, fontSize: "12px" }}>
                            {fmt(h.tenDichVu)}
                          </td>
                          <td style={{ ...S.td, fontSize: "12px" }}>
                            {h.tenNhanVien}
                          </td>
                          <td style={S.td}>{statusPK(h.trangThaiKham)}</td>
                          <td style={{ ...S.td, textAlign: "center" }}>
                            <ChiTietKhamModal
                              data={h}
                              allowViewDetail={allowViewDetail}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : paidInvoices.length === 0 ? (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "40px",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    receipt_long
                  </span>
                  Chưa có hóa đơn đã thanh toán
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{
                      background: "#f9fafb",
                      position: "sticky",
                      top: 0,
                    }}
                  >
                    <tr>
                      <th style={{ ...S.th, fontSize: "11px" }}>Mã HD</th>
                      <th style={{ ...S.th, fontSize: "11px" }}>Mã PK</th>
                      <th style={{ ...S.th, fontSize: "11px" }}>
                        Ngày Thanh Toán
                      </th>
                      <th
                        style={{
                          ...S.th,
                          fontSize: "11px",
                          textAlign: "right",
                        }}
                      >
                        Tổng Tiền
                      </th>
                      <th style={{ ...S.th, fontSize: "11px" }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidInvoices.map((h) => (
                      <tr
                        key={h.maHoaDon}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td
                          style={{
                            ...S.td,
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#2563eb",
                          }}
                        >
                          #{String(h.maHoaDon).padStart(4, "0")}
                        </td>
                        <td style={{ ...S.td, fontSize: "12px" }}>
                          PK{String(h.maPhieuKham).padStart(4, "0")}
                        </td>
                        <td style={{ ...S.td, fontSize: "12px" }}>
                          {fmtDateTime(h.ngayThanhToan)}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#059669",
                            textAlign: "right",
                          }}
                        >
                          {fmtCurrency(h.tongTien)}
                        </td>
                        <td style={S.td}>{statusHD(h.trangThaiHoaDon)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot
                    style={{
                      background: "#f0fdf4",
                      borderTop: "2px solid #bbf7d0",
                    }}
                  >
                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          ...S.td,
                          fontWeight: 700,
                          fontSize: "13px",
                          textAlign: "right",
                        }}
                      >
                        Tổng chi phí đã thanh toán:
                      </td>
                      <td
                        style={{
                          ...S.td,
                          fontWeight: 800,
                          fontSize: "14px",
                          color: "#059669",
                          textAlign: "right",
                        }}
                      >
                        {fmtCurrency(totalPaid)}
                      </td>
                      <td style={S.td}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyBenhNhan;
