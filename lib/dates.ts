export function getLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function diffDays(fromDate: string, toDate: string): number {
  const [fromYear, fromMonth, fromDay] = fromDate.split("-").map(Number);
  const [toYear, toMonth, toDay] = toDate.split("-").map(Number);
  const fromTime = new Date(fromYear, fromMonth - 1, fromDay).getTime();
  const toTime = new Date(toYear, toMonth - 1, toDay).getTime();
  return Math.round((toTime - fromTime) / 86400000);
}

export function buildDateRange(startDate: string, totalDays: number): string[] {
  return Array.from({ length: totalDays }, (_, index) => addDays(startDate, index));
}

export function formatMonthDay(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${month}/${day}`;
}

export function weekdayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(year, month - 1, day));
}
