export function normalizeDecimalInput(raw: string, maxDecimals: number): string {
  let value = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
  const decimals = value.split(".")[1];
  if (decimals && decimals.length > maxDecimals)
    value = value.split(".")[0] + "." + decimals.slice(0, maxDecimals);
  return value;
}
