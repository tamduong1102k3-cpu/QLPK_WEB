export const formatGender = (val) => {
  const normalized = typeof val === 'string' ? val.trim().toLowerCase() : val;
  if (normalized === true || normalized === 1 || normalized === 'true' || normalized === '1' || normalized === 'nam') return 'Nam';
  if (normalized === false || normalized === 0 || normalized === 'false' || normalized === '0' || normalized === 'nữ' || normalized === 'nu') return 'Nữ';
  return '—';
};

export default formatGender;
