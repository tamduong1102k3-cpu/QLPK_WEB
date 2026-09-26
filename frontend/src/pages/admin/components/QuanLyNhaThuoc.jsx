import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { apiClient } from "../../../api/apiClient";
import ThuocTab from './ThuocTab';
import KhoThuocTab from './KhoThuocTab';
import PhieuNhapTab from './PhieuNhapTab';

const API = `${API_BASE_URL}/kho-thuoc`;
const NV_API = `${API_BASE_URL}/nhan_vien`;

// ── Hook: load lookup maps ────────────────────────────────────────────────────
const useLookups = refreshTrigger => {
  const [nvMap, setNvMap] = useState({}); // maNhanVien → hoTen
  const [thuocMap, setThuocMap] = useState({}); // maThuoc    → tenThuoc
  const [thuocList, setThuocList] = useState([]);
  useEffect(() => {
    Promise.all([apiClient(NV_API).then(r => r.json()), apiClient(`${API}/thuoc`).then(r => r.json())]).then(([nvList, tList]) => {
      const nv = {};
      nvList.forEach(n => { nv[n.maNhanVien] = n.hoTen; });
      setNvMap(nv);
      const th = {};
      tList.forEach(t => { th[t.maThuoc] = t; });
      setThuocMap(th);
      setThuocList(tList);
    }).catch(() => {});
  }, [refreshTrigger]);
  return { nvMap, thuocMap, thuocList };
};

// ── Main Component ─────────────────────────────────────────────────────────────
const QuanLyNhaThuoc = ({ readOnly, isPharmacist }) => {
  const [activeTab, setActiveTab] = useState('thuoc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { nvMap, thuocMap, thuocList } = useLookups(refreshTrigger);
  const onRefresh = () => setRefreshTrigger(t => t + 1);
  const tabs = [
    { id: 'thuoc', label: 'Danh Mục Thuốc', icon: 'medication' },
    { id: 'kho', label: 'Tồn Kho', icon: 'inventory_2' },
    { id: 'nhap', label: 'Phiếu Nhập', icon: 'local_shipping' }
  ];

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {!isPharmacist && (
      <div style={{
        display: 'flex', gap: '8px', background: '#fff', padding: '8px', borderRadius: '12px',
        border: '1px solid #e5e7eb', alignSelf: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,.06)'
      }}>
        {tabs.map(t =>
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all .2s',
              background: activeTab === t.id ? '#005bc0' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#6b7280'
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
            {t.label}
          </button>
        )}
      </div>
    )}

    {activeTab === 'thuoc' && <ThuocTab items={thuocList} onRefresh={onRefresh} readOnly={false} isPharmacist={isPharmacist} />}
    {activeTab === 'kho' && <KhoThuocTab thuocMap={thuocMap} />}
    {activeTab === 'nhap' && <PhieuNhapTab nvMap={nvMap} thuocMap={thuocMap} thuocList={thuocList} onRefresh={onRefresh} readOnly={true} />}
  </div>;
};

export default QuanLyNhaThuoc;