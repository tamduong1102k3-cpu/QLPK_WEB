/**
 * Kiểm tra các chỉ số sinh hiệu bắt buộc đã được nhập đầy đủ và hợp lý chưa
 * @param {Object} vitals - Đối tượng chứa các chỉ số sinh hiệu
 * @returns {string[]} Mảng các thông báo lỗi (rỗng nếu hợp lệ)
 */
export const validateVitals = (vitals) => {
  const errors = [];

  // Nhiệt độ: 34-42°C
  if (!vitals.nhietDo) {
    errors.push('Nhiệt độ: Vui lòng nhập');
  } else if (isNaN(parseFloat(vitals.nhietDo))) {
    errors.push('Nhiệt độ: Phải là số');
  } else {
    const val = parseFloat(vitals.nhietDo);
    if (val < 34 || val > 42) errors.push('Nhiệt độ: Không hợp lệ (34-42°C)');
  }

  // Nhịp tim: 20-250 l/p
  if (!vitals.nhipTim) {
    errors.push('Nhịp tim: Vui lòng nhập');
  } else if (isNaN(parseInt(vitals.nhipTim))) {
    errors.push('Nhịp tim: Phải là số');
  } else {
    const val = parseInt(vitals.nhipTim);
    if (val < 20 || val > 250) errors.push('Nhịp tim: Không hợp lệ (20-250 l/p)');
  }

  // HA tâm thu: 50-300 mmHg
  if (!vitals.huyetApThu) {
    errors.push('HA tâm thu: Vui lòng nhập');
  } else if (isNaN(parseInt(vitals.huyetApThu))) {
    errors.push('HA tâm thu: Phải là số');
  } else {
    const val = parseInt(vitals.huyetApThu);
    if (val < 50 || val > 300) errors.push('HA tâm thu: Không hợp lệ (50-300 mmHg)');
  }

  // HA tâm trương: 30-200 mmHg
  if (!vitals.huyetApTruong) {
    errors.push('HA tâm trương: Vui lòng nhập');
  } else if (isNaN(parseInt(vitals.huyetApTruong))) {
    errors.push('HA tâm trương: Phải là số');
  } else {
    const val = parseInt(vitals.huyetApTruong);
    if (val < 30 || val > 200) errors.push('HA tâm trương: Không hợp lệ (30-200 mmHg)');
  }

  // Nhịp thở: 5-60 l/p
  if (!vitals.nhipTho) {
    errors.push('Nhịp thở: Vui lòng nhập');
  } else if (isNaN(parseInt(vitals.nhipTho))) {
    errors.push('Nhịp thở: Phải là số');
  } else {
    const val = parseInt(vitals.nhipTho);
    if (val < 5 || val > 60) errors.push('Nhịp thở: Không hợp lệ (5-60 l/p)');
  }

  // SpO2: 50-100%
  if (!vitals.spo2) {
    errors.push('SpO2: Vui lòng nhập');
  } else if (isNaN(parseFloat(vitals.spo2))) {
    errors.push('SpO2: Phải là số');
  } else {
    const val = parseFloat(vitals.spo2);
    if (val < 50 || val > 100) errors.push('SpO2: Không hợp lệ (50-100%)');
  }

  // Cân nặng: 2-500 kg
  if (!vitals.canNang) {
    errors.push('Cân nặng: Vui lòng nhập');
  } else if (isNaN(parseFloat(vitals.canNang))) {
    errors.push('Cân nặng: Phải là số');
  } else {
    const val = parseFloat(vitals.canNang);
    if (val < 2 || val > 500) errors.push('Cân nặng: Không hợp lệ (2-500 kg)');
  }

  // Chiều cao: 20-250 cm
  if (!vitals.chieuCao) {
    errors.push('Chiều cao: Vui lòng nhập');
  } else if (isNaN(parseFloat(vitals.chieuCao))) {
    errors.push('Chiều cao: Phải là số');
  } else {
    const val = parseFloat(vitals.chieuCao);
    if (val < 20 || val > 250) errors.push('Chiều cao: Không hợp lệ (20-250 cm)');
  }

  return errors;
};