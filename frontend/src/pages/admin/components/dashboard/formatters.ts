export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function formatGrowthLabel(growthPercent: number | null): string {
  if (growthPercent === null) return 'New';
  const sign = growthPercent > 0 ? '+' : '';
  return `${sign}${growthPercent}%`;
}
