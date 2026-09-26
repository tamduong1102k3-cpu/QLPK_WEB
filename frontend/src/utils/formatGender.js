export const formatGender = (val) => {
  if (val === true || val === 1 || val === 'true' || val === '1') return 'Nam';
  if (val === false || val === 0 || val === 'false' || val === '0') return 'Nữ';
  return '—';
};

export default formatGender;
