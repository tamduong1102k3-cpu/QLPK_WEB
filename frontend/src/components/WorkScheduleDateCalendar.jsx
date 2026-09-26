import { useState } from 'react';

const WORKING_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const DAY_NAMES = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const DAY_TO_NUMBER = Object.fromEntries(DAY_NAMES.map((day, index) => [day, index]));

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAvailableDayNumbers = (shifts) => {
  if (!Array.isArray(shifts) || shifts.length === 0) return [];
  return [...new Set(shifts.map((shift) => DAY_TO_NUMBER[shift?.thu]).filter((day) => day !== undefined))];
};

const getShiftTime = (shift) => shift?.ca?.gioBatDau || shift?.gioLam || '';

const getShiftName = (shift) => {
  if (shift?.ca?.tenCa) return shift.ca.tenCa;
  return Number(String(getShiftTime(shift)).split(':')[0] || 0) < 12 ? 'ca sáng' : 'ca chiều';
};

const getScheduleForDate = (shifts, date) => {
  const dateStr = formatDateInput(date);
  const dayName = DAY_NAMES[date.getDay()];
  const rowsOnDate = shifts.filter((shift) => shift?.ngay === dateStr);
  const leave = rowsOnDate.find((shift) => shift?.hanhDong === 'NGHI_PHEP');
  if (leave) return { leave, items: [] };

  const replacement = rowsOnDate.filter((shift) => shift?.hanhDong === 'THAY_THE');
  const extra = rowsOnDate.filter((shift) => shift?.hanhDong === 'THEM');
  const defaults = shifts.filter((shift) => shift?.kieuPhanCong === 'MAC_DINH'
    && (shift?.ngay === dateStr || (!shift?.ngay && shift?.thu === dayName)));

  return { leave: null, items: replacement.length > 0 ? [...replacement, ...extra] : [...defaults, ...extra] };
};

export default function WorkScheduleDateCalendar({ selectedDate, minDateStr, shifts, onSelect, disabled: disabledProp = false }) {
  const [viewDate, setViewDate] = useState(() => {
    const date = minDateStr ? new Date(`${minDateStr}T12:00:00`) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const minDate = minDateStr ? new Date(`${minDateStr}T12:00:00`) : new Date();
  const todayStr = formatDateInput(new Date());
  const availableDayNumbers = getAvailableDayNumbers(shifts);
  const firstDayCol = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDayCol; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));

  const isDisabled = (date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    if (dateOnly < minDateOnly) return true;
    return availableDayNumbers.length > 0 && !availableDayNumbers.includes(date.getDay());
  };

  const changeMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  return (
    <div style={{ width: '100%', minWidth: 0, marginTop: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 8, boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, padding: '0 2px 8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => changeMonth(-1)} disabled={disabledProp} style={{ width: 32, height: 30, padding: 0, border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: disabledProp ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: disabledProp ? 0.5 : 1 }}>
          ◀
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 72, textAlign: 'center' }}>
          {month + 1}/{year}
        </span>
        <button type="button" onClick={() => changeMonth(1)} disabled={disabledProp} style={{ width: 32, height: 30, padding: 0, border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: disabledProp ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: disabledProp ? 0.5 : 1 }}>
          ▶
        </button>
        <button type="button" onClick={() => setViewDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} disabled={disabledProp} style={{ height: 30, padding: '0 8px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: disabledProp ? 'not-allowed' : 'pointer', fontSize: 11, opacity: disabledProp ? 0.5 : 1 }}>
          Hôm nay
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3, width: '100%' }}>
        {WORKING_DAYS.map((day, index) => (
          <div key={day} style={{ minWidth: 0, textAlign: 'center', padding: '7px 2px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: index >= 5 ? '#fef2f2' : '#f1f5f9', color: index >= 5 ? '#e11d48' : '#475569', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} style={{ minHeight: 112, borderRadius: 7, background: '#fafafa' }} />;

          const dateStr = formatDateInput(date);
          const disabledBySchedule = isDisabled(date);
          const disabled = disabledBySchedule || disabledProp;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const { leave, items } = getScheduleForDate(Array.isArray(shifts) ? shifts : [], date);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => { if (!disabled) onSelect(dateStr); }}
              title={disabled ? (disabledProp ? 'Ngày khám bị khóa' : 'Bác sĩ không làm việc') : `Chọn ngày ${dateStr}`}
              style={{
                minHeight: 112,
                minWidth: 0,
                width: '100%',
                padding: 4,
                border: isSelected || isToday ? '2px solid #005bc0' : '1px solid #e5e7eb',
                borderRadius: 7,
                background: disabled ? '#fafafa' : '#fff',
                color: disabled ? '#cbd5e1' : (isWeekend ? '#e11d48' : '#1e293b'),
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.75 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                transition: 'background .15s, border .15s'
              }}
              onMouseEnter={(event) => { if (!disabled) event.currentTarget.style.background = '#f0f9ff'; }}
              onMouseLeave={(event) => { event.currentTarget.style.background = '#fff'; }}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{date.getDate()}</span>
                {isToday && <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: '#005bc0', borderRadius: 4, padding: '1px 3px' }}>Nay</span>}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                {leave && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, padding: '3px 4px', fontSize: 9, color: '#b91c1c', fontWeight: 700, overflowWrap: 'anywhere' }}>
                    🚫 Nghỉ{leave.lyDo ? ` (${leave.lyDo})` : ''}
                  </div>
                )}
                {items.length === 0 && !leave && (
                  <span style={{ alignSelf: 'center', marginTop: 24, fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>—</span>
                )}
                {items.map((item, itemIndex) => {
                  const isExtra = item?.hanhDong === 'THEM';
                  const isReplacement = item?.hanhDong === 'THAY_THE';
                  const background = isExtra ? 'linear-gradient(135deg,#fef9c3,#fef08a)' : isReplacement ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)' : 'linear-gradient(135deg,#dbeafe,#eff6ff)';
                  const border = isExtra ? '#facc15' : isReplacement ? '#c4b5fd' : '#93c5fd';
                  const color = isExtra ? '#854d0e' : isReplacement ? '#5b21b6' : '#1e40af';
                  return (
                    <div key={`${dateStr}-${itemIndex}`} style={{ background, border: `1px solid ${border}`, borderRadius: 4, padding: '3px 4px', fontSize: 9, lineHeight: 1.2, color, overflowWrap: 'anywhere' }}>
                      <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {item?.tenPhong || '—'}</div>
                      <div>{isReplacement ? item?.caThayThe?.tenCa || 'Đổi ca' : `${getShiftName(item)} ${String(item?.ca?.gioBatDau || item?.gioLam || '').substring(0, 5)}-${String(item?.ca?.gioKetThuc || item?.gioKetThuc || '').substring(0, 5)}`}</div>
                      {isExtra && <div style={{ fontSize: 7, fontStyle: 'italic' }}>Thêm ca ngoại lệ</div>}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
