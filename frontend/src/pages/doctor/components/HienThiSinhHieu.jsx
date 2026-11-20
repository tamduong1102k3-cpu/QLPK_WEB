import React, { useState, useEffect } from 'react';
import { getByPhieuKhamApi } from '../../../api/chiSoKhamTongHopApi';

const HienThiSinhHieu = ({
  phieuKhamId
}) => {
  const [vitals, setVitals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (phieuKhamId) {
      setLoading(true);
      getByPhieuKhamApi(phieuKhamId)
        .then(data => {
          if (data && !data.message) setVitals(data);
          else setVitals(null);
        })
        .catch(() => setVitals(null))
        .finally(() => setLoading(false));
    }
  }, [phieuKhamId]);

  if (loading) return <div className="text-center py-4 text-gray-400 italic text-xs">Đang tải sinh hiệu...</div>;
  if (!vitals) return <div className="text-center py-4 text-gray-400 italic text-xs">Chưa có dữ liệu sinh hiệu</div>;

    // Định nghĩa ngưỡng cảnh báo cho từng chỉ số
  const getThresholdAlert = (item) => {
    const val = parseFloat(item.value);
    if (isNaN(val)) return null;

    switch (item.label) {
      case 'Nhiệt độ':
        if (val >= 38.5) return { level: 'critical', message: 'Sốt cao!' };
        if (val >= 38) return { level: 'warning', message: 'Sốt' };
        if (val <= 35) return { level: 'warning', message: 'Hạ thân nhiệt' };
        return null;
      case 'Nhịp tim':
        if (val > 120) return { level: 'critical', message: 'Nhịp tim nhanh!' };
        if (val > 100) return { level: 'warning', message: 'Nhịp tim nhanh nhẹ' };
        if (val < 50) return { level: 'critical', message: 'Nhịp tim chậm!' };
        if (val < 60) return { level: 'warning', message: 'Nhịp tim chậm nhẹ' };
        return null;
      case 'Huyết áp':
        // item.value là chuỗi "tamThu/tamTruong"
        if (!item.rawValue) return null;
        const tamThu = parseFloat(item.rawValue.tamThu);
        const tamTruong = parseFloat(item.rawValue.tamTruong);
        if (isNaN(tamThu) || isNaN(tamTruong)) return null;
        if (tamThu >= 180 || tamTruong >= 120) return { level: 'critical', message: 'Tăng HA khẩn cấp!' };
        if (tamThu >= 140 || tamTruong >= 90) return { level: 'warning', message: 'Tăng huyết áp' };
        if (tamThu < 90 || tamTruong < 60) return { level: 'warning', message: 'Hạ huyết áp' };
        return null;
      case 'SpO2':
        if (val < 90) return { level: 'critical', message: 'Thiếu oxy nặng!' };
        if (val < 95) return { level: 'warning', message: 'Giảm oxy máu' };
        return null;
      case 'Nhịp thở':
        if (val > 24) return { level: 'warning', message: 'Thở nhanh' };
        if (val < 12) return { level: 'warning', message: 'Thở chậm' };
        return null;
      default:
        return null;
    }
  };

  const rawItems = [{
    label: 'Nhiệt độ',
    value: vitals.nhietDo,
    unit: '°C',
    icon: 'device_thermostat',
    color: 'text-orange-500'
  }, {
    label: 'Nhịp tim',
    value: vitals.nhipTim,
    unit: 'l/p',
    icon: 'favorite',
    color: 'text-red-500'
  }, {
    label: 'Huyết áp',
    value: `${vitals.huyetApTamThu}/${vitals.huyetApTamTruong}`,
    unit: 'mmHg',
    icon: 'blood_pressure',
    color: 'text-blue-500',
    rawValue: { tamThu: vitals.huyetApTamThu, tamTruong: vitals.huyetApTamTruong }
  }, {
    label: 'Nhịp thở',
    value: vitals.nhipTho,
    unit: 'l/p',
    icon: 'pulmonology',
    color: 'text-purple-500'
  }, {
    label: 'SpO2',
    value: vitals.spo2,
    unit: '%',
    icon: 'air',
    color: 'text-cyan-500'
  }, {
    label: 'Cân nặng',
    value: vitals.canNang,
    unit: 'kg',
    icon: 'weight',
    color: 'text-emerald-500'
  }, {
    label: 'Chiều cao',
    value: vitals.chieuCao,
    unit: 'cm',
    icon: 'straighten',
    color: 'text-indigo-500'
  }];

  return <div className="grid grid-cols-2 gap-4">
      {rawItems.map((item, i) => {
        const alert = getThresholdAlert(item);
        const borderColor = alert?.level === 'critical' ? 'border-red-400 bg-red-50' : alert?.level === 'warning' ? 'border-amber-400 bg-amber-50' : 'border-gray-100';
        const textColor = alert ? 'text-red-600' : 'text-gray-800';
        const valueColor = alert?.level === 'critical' ? 'text-red-600' : alert?.level === 'warning' ? 'text-amber-600' : textColor;
        return <div key={i} className={`p-3 rounded-xl bg-gray-50 border ${borderColor} transition-all ${alert ? 'shadow-sm' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`material-symbols-outlined text-sm ${alert ? 'text-red-500' : item.color}`}>
              {alert ? 'warning' : item.icon}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</span>
            {alert && <span className="ml-auto">
              <span className={`material-symbols-outlined text-sm ${alert.level === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                {alert.level === 'critical' ? 'emergency' : 'info'}
              </span>
            </span>}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-black ${valueColor}`}>{item.value || '--'}</span>
            <span className="text-[10px] text-gray-500 uppercase">{item.unit}</span>
          </div>
          {alert && <div className={`mt-1 text-[10px] font-bold ${alert.level === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
            {alert.message}
          </div>}
        </div>;
      })}
    </div>;
};

export default HienThiSinhHieu;
