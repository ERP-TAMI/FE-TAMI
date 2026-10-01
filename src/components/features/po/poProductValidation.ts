export function getPoProductTodayDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function getPoProductDeadlineError(
  deadline: string,
  today = getPoProductTodayDate(),
): string | undefined {
  const normalizedDeadline = deadline.trim();
  if (!normalizedDeadline) return "Vui lòng chọn hạn giao sản phẩm.";
  if (normalizedDeadline < today) {
    return "Hạn giao sản phẩm không được là ngày trong quá khứ.";
  }
  return undefined;
}
