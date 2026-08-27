export function normalizeSizeChartText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function parseSizeLabels(value: string): string[] {
  return value
    .split(/[,\n]+/)
    .map(normalizeSizeChartText)
    .filter(Boolean);
}

export function findDuplicateSize(labels: string[]): string | undefined {
  const normalized = new Set<string>();
  for (const label of labels) {
    const key = label.toLocaleUpperCase("vi");
    if (normalized.has(key)) return label;
    normalized.add(key);
  }
  return undefined;
}
