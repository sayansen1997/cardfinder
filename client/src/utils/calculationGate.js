const STORAGE_KEY = 'cf_calc_count';
const PENDING_CALC_KEY = 'cf_pending_calc';

export function getCalculationCount() {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function incrementCalculationCount() {
  try {
    const current = getCalculationCount();
    localStorage.setItem(STORAGE_KEY, String(current + 1));
  } catch {
    // localStorage unavailable — fail silently
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('userToken');
}

export function shouldBlockCalculation() {
  if (isAuthenticated()) return false;
  return getCalculationCount() >= 1;
}

export function savePendingCalc(data) {
  try {
    localStorage.setItem(PENDING_CALC_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getPendingCalc() {
  try {
    const raw = localStorage.getItem(PENDING_CALC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingCalc() {
  try {
    localStorage.removeItem(PENDING_CALC_KEY);
  } catch {
    // ignore
  }
}
