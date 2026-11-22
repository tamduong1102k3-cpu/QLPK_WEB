export const MINIMUM_PATIENT_BIRTH_DATE = '1900-01-01';

export const getVietnamTodayDateString = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const getLatestPatientBirthDate = () => {
  const [year, month, day] = getVietnamTodayDateString().split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
};

export const validatePatientBirthDate = (value, required = true) => {
  if (!value) {
    return required ? 'Vui lòng chọn ngày sinh.' : null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return 'Ngày sinh không hợp lệ (năm sinh phải từ 1900 trở về sau).';
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.toISOString().slice(0, 10) !== value) {
    return 'Ngày sinh không hợp lệ (năm sinh phải từ 1900 trở về sau).';
  }

  const today = getVietnamTodayDateString();
  if (value >= today) {
    return 'Ngày sinh phải nhỏ hơn ngày hiện tại.';
  }
  const todayParts = today.split('-').map(Number);
  const age = todayParts[0] - year
    - (todayParts[1] < month || (todayParts[1] === month && todayParts[2] < day) ? 1 : 0);
  if (value < MINIMUM_PATIENT_BIRTH_DATE || age > 130) {
    return 'Ngày sinh không hợp lệ (năm sinh phải từ 1900 trở về sau).';
  }

  return null;
};
