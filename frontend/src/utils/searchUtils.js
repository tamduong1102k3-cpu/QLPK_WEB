export const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim();
};

export const sqlLikeMatch = (target, query) => {
  if (!query) return true;
  if (!target) return false;
  const normalizedTarget = removeVietnameseTones(String(target).toLowerCase());
  const normalizedQuery = removeVietnameseTones(String(query).toLowerCase());
  return normalizedTarget.includes(normalizedQuery);
};
