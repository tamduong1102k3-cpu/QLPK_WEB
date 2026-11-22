const vietnamDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getVietnamDateKey = (value) => {
  if (typeof value === 'string') {
    const localDateTime = value.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/
    );
    if (localDateTime) {
      return `${localDateTime[1]}-${localDateTime[2]}-${localDateTime[3]}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = vietnamDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
};

export const isTodayInVietnam = (value) => {
  if (value == null || value === '') return false;
  return getVietnamDateKey(value) === getVietnamDateKey(new Date());
};
