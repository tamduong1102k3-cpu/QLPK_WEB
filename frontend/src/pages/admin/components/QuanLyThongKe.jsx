import { apiClient } from "../../../api/apiClient";
import { API_BASE_URL } from '../../../api/config';
import React, { useState, useEffect } from 'react';
const BASE = `${API_BASE_URL}/thong-ke`;
const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const fmt = val => {
  if (!val || val === 0) return '0';
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + 'B';
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
  return val.toLocaleString('vi-VN');
};
const TABS = [{
  id: 'doanh-thu',
  label: '💰 Doanh Thu',
  color: '#005bc0',
  light: '#dbeafe'
}, {
  id: 'luot-kham',
  label: '👥 Lượt Khám',
  color: '#059669',
  light: '#d1fae5'
}, {
  id: 'benh-nhan',
  label: '👤 Bệnh Nhân Mới',
  color: '#7c3aed',
  light: '#ede9fe'
}];
export default function QuanLyThongKe() {
  const [years, setYears] = useState([]);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doanh-thu');
  useEffect(() => {
    apiClient(`${BASE}/nam-co-du-lieu`).then(r => r.ok ? r.json() : []).then(y => {
      const list = y && y.length > 0 ? y : [new Date().getFullYear()];
      setYears(list);
      setSelYear(list[0]);
    }).catch(() => setYears([new Date().getFullYear()]));
  }, []);
  useEffect(() => {
    if (!selYear) return;
    setLoading(true);
    apiClient(`${BASE}/theo-nam?nam=${selYear}`).then(r => r.ok ? r.json() : []).then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selYear]);

  // ── Calculated values ────────────────────────────────────────────────
  const totalDT = data.reduce((s, d) => s + (Number(d.doanhThu) || 0), 0);
  const totalLK = data.reduce((s, d) => s + (Number(d.soLuotKham) || 0), 0);
  const totalBNM = data.reduce((s, d) => s + (Number(d.soBenhNhanMoi) || 0), 0);
  const maxDTVal = Math.max(...data.map(d => Number(d.doanhThu) || 0), 1);
  const maxLKVal = Math.max(...data.map(d => Number(d.soLuotKham) || 0), 1);
  const maxBNMVal = Math.max(...data.map(d => Number(d.soBenhNhanMoi) || 0), 1);
  const peakDTMon = data.findIndex(d => Number(d.doanhThu) === maxDTVal) + 1;
  const peakLKMon = data.findIndex(d => Number(d.soLuotKham) === maxLKVal) + 1;
  const curTab = TABS.find(t => t.id === activeTab);
  const getVal = item => activeTab === 'doanh-thu' ? Number(item.doanhThu) : activeTab === 'luot-kham' ? Number(item.soLuotKham) : Number(item.soBenhNhanMoi);
  const maxVal = Math.max(...data.map(getVal), 1);
  const peakVal = Math.max(...data.map(getVal));
  return <div style={{
    fontFamily: 'Inter, sans-serif',
    color: '#1e293b'
  }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
      background: 'linear-gradient(135deg,#005bc0,#0077e6)',
      borderRadius: '12px',
      padding: '20px 24px',
      color: '#fff',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
        <div>
          <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 700
        }}>📊 THỐNG KÊ DOANH THU & BỆNH NHÂN</h2>
          <p style={{
          margin: '4px 0 0',
          fontSize: '13px',
          opacity: 0.8
        }}>Theo dõi hiệu suất hoạt động phòng khám theo tháng</p>
        </div>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <span style={{
          fontSize: '13px',
          opacity: 0.9
        }}>Năm:</span>
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={{
          padding: '7px 16px',
          borderRadius: '8px',
          border: 'none',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none'
        }}>
            {years.map(y => <option key={y} value={y} style={{
            color: '#111',
            background: '#fff'
          }}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: '14px',
      marginBottom: '20px'
    }}>
        {[{
        label: 'Tổng Doanh Thu',
        val: totalDT.toLocaleString('vi-VN') + ' đ',
        sub: `Năm ${selYear}`,
        icon: '💰',
        color: '#005bc0',
        bg: '#eff6ff'
      }, {
        label: 'Tổng Lượt Khám',
        val: totalLK.toLocaleString(),
        sub: 'Lượt khám',
        icon: '👥',
        color: '#059669',
        bg: '#f0fdf4'
      }, {
        label: 'Bệnh Nhân Mới',
        val: totalBNM.toLocaleString(),
        sub: 'Bệnh nhân riêng biệt',
        icon: '👤',
        color: '#7c3aed',
        bg: '#f5f3ff'
      }, {
        label: 'DT/Lượt Trung Bình',
        val: totalLK > 0 ? fmt(Math.round(totalDT / totalLK)) + ' đ' : '—',
        sub: 'Bình quân/lượt',
        icon: '📈',
        color: '#d97706',
        bg: '#fffbeb'
      }].map((c, i) => <div key={i} style={{
        background: c.bg,
        borderRadius: '12px',
        padding: '16px 18px',
        border: `1px solid ${c.color}22`
      }}>
            <div style={{
          fontSize: '22px',
          marginBottom: '6px'
        }}>{c.icon}</div>
            <div style={{
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: 500
        }}>{c.label}</div>
            <div style={{
          fontSize: '17px',
          fontWeight: 700,
          color: c.color,
          marginTop: '2px',
          wordBreak: 'break-word'
        }}>{c.val}</div>
            <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginTop: '2px'
        }}>{c.sub}</div>
          </div>)}
      </div>

      {/* ── Chart + Table ──────────────────────────────────────── */}
      <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      border: '1px solid #f1f5f9'
    }}>

        {/* Tab switch */}
        <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: '#f8fafc',
        borderRadius: '10px',
        padding: '4px',
        width: 'fit-content'
      }}>
          {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
          padding: '8px 18px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          transition: 'all 0.2s',
          background: activeTab === t.id ? '#fff' : 'transparent',
          color: activeTab === t.id ? t.color : '#6b7280',
          boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
        }}>
              {t.label}
            </button>)}
        </div>

        {loading ? <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '280px',
        gap: '10px',
        color: '#9ca3af'
      }}>
            <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: curTab?.color,
          animation: 'spin 0.8s linear infinite'
        }} />
            Đang tải dữ liệu...
          </div> : <>
            {/* Bar Chart */}
            <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '6px',
          height: '260px',
          padding: '0 52px 28px 8px',
          position: 'relative'
        }}>
              {/* Y-axis gridlines */}
              {[0.25, 0.5, 0.75, 1].map(f => <div key={f} style={{
            position: 'absolute',
            left: 0,
            right: '52px',
            bottom: `calc(28px + ${f * (260 - 28)}px)`,
            borderTop: '1px dashed #e5e7eb',
            pointerEvents: 'none'
          }}>
                  <span style={{
              position: 'absolute',
              right: '100%',
              paddingRight: '6px',
              top: '-9px',
              fontSize: '10px',
              color: '#9ca3af',
              whiteSpace: 'nowrap'
            }}>
                    {activeTab === 'doanh-thu' ? fmt(maxVal * f) : Math.round(maxVal * f)}
                  </span>
                </div>)}

              {data.map((item, i) => {
            const val = getVal(item);
            const heightP = maxVal > 0 ? val / maxVal * 100 : 0;
            const isPeak = val === peakVal && val > 0;
            return <div key={i} title={`Tháng ${i + 1}: ${activeTab === 'doanh-thu' ? val.toLocaleString('vi-VN') + ' đ' : val + ' ' + (activeTab === 'luot-kham' ? 'lượt' : 'bệnh nhân')}`} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
              gap: '4px'
            }}>
                    {val > 0 && <span style={{
                fontSize: '9px',
                color: isPeak ? curTab.color : '#9ca3af',
                fontWeight: isPeak ? 700 : 400
              }}>
                        {activeTab === 'doanh-thu' ? fmt(val) : val}
                      </span>}
                    <div style={{
                width: '100%',
                height: `${heightP}%`,
                minHeight: val > 0 ? '4px' : '0',
                background: isPeak ? `linear-gradient(180deg,${curTab.color},${curTab.color}aa)` : curTab.light,
                borderRadius: '5px 5px 0 0',
                border: `1px solid ${isPeak ? curTab.color : curTab.light}`,
                transition: 'height 0.4s ease'
              }} />
                    <span style={{
                fontSize: '11px',
                color: isPeak ? curTab.color : '#9ca3af',
                fontWeight: isPeak ? 700 : 400
              }}>
                      {MONTHS[i]}
                    </span>
                  </div>;
          })}
            </div>

            {/* Data Table */}
            <div style={{
          marginTop: '16px',
          overflowX: 'auto'
        }}>
              <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
                <thead>
                  <tr style={{
                background: '#f8fafc'
              }}>
                    {['Tháng', 'Doanh Thu', 'Lượt Khám', 'Bệnh Nhân Mới', 'DT / Lượt', 'Xu Hướng DT'].map(h => <th key={h} style={{
                  padding: '10px 12px',
                  textAlign: h === 'Tháng' ? 'left' : 'right',
                  color: '#6b7280',
                  fontWeight: 600,
                  borderBottom: '1px solid #e5e7eb',
                  whiteSpace: 'nowrap'
                }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => {
                const dt = Number(item.doanhThu) || 0;
                const lk = Number(item.soLuotKham) || 0;
                const bnm = Number(item.soBenhNhanMoi) || 0;
                const avg = lk > 0 ? Math.round(dt / lk) : 0;
                const prevDT = i > 0 ? Number(data[i - 1].doanhThu) || 0 : null;
                const trend = prevDT !== null && dt > 0 ? dt > prevDT ? '↑' : dt < prevDT ? '↓' : '→' : '—';
                const trendC = trend === '↑' ? '#059669' : trend === '↓' ? '#dc2626' : '#9ca3af';
                const isPeak = dt === Math.max(...data.map(d => Number(d.doanhThu) || 0)) && dt > 0;
                return <tr key={i} style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: isPeak ? '#eff6ff' : 'transparent'
                }}>
                        <td style={{
                    padding: '9px 12px',
                    fontWeight: 600
                  }}>Tháng {i + 1}</td>
                        <td style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    color: '#005bc0',
                    fontWeight: isPeak ? 700 : 400
                  }}>
                          {dt > 0 ? dt.toLocaleString('vi-VN') + ' đ' : '—'}
                        </td>
                        <td style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    color: '#059669'
                  }}>{lk > 0 ? lk : '—'}</td>
                        <td style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    color: '#7c3aed'
                  }}>{bnm > 0 ? bnm : '—'}</td>
                        <td style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    color: '#6b7280',
                    fontSize: '12px'
                  }}>{avg > 0 ? fmt(avg) + ' đ' : '—'}</td>
                        <td style={{
                    padding: '9px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: trendC,
                    fontSize: '16px'
                  }}>{trend}</td>
                      </tr>;
              })}
                  <tr style={{
                background: '#f8fafc',
                fontWeight: 700,
                borderTop: '2px solid #e5e7eb'
              }}>
                    <td style={{
                  padding: '11px 12px',
                  color: '#1e3a8a'
                }}>Cả Năm {selYear}</td>
                    <td style={{
                  padding: '11px 12px',
                  textAlign: 'right',
                  color: '#005bc0'
                }}>{totalDT.toLocaleString('vi-VN')} đ</td>
                    <td style={{
                  padding: '11px 12px',
                  textAlign: 'right',
                  color: '#059669'
                }}>{totalLK}</td>
                    <td style={{
                  padding: '11px 12px',
                  textAlign: 'right',
                  color: '#7c3aed'
                }}>{totalBNM}</td>
                    <td style={{
                  padding: '11px 12px',
                  textAlign: 'right',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                      {totalLK > 0 ? fmt(Math.round(totalDT / totalLK)) + ' đ' : '—'}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </>}
      </div>
    </div>;
}
