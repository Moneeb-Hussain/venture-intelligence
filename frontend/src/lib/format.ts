// Deterministic formatters: fixed locale and UTC so server and client render
// identically (timestamps in the contract are ISO 8601 UTC).

const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTs(ts: string): string {
  const d = new Date(ts);
  return `${dateFmt.format(d)} · ${timeFmt.format(d)} UTC`;
}

export function formatDate(ts: string): string {
  return dateFmt.format(new Date(ts));
}

export function formatTime(ts: string): string {
  return `${timeFmt.format(new Date(ts))} UTC`;
}

export function formatMinutes(min: number): string {
  const rounded = Math.round(min * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} min`;
}

export function formatAmount(amount: number): string {
  if (amount >= 1000 && amount % 1000 === 0) return `$${amount / 1000}K`;
  return `$${amount.toLocaleString("en-US")}`;
}

export function scoreRange(score: number, band: number) {
  return {
    lo: Math.max(0, score - band),
    hi: Math.min(100, score + band),
  };
}
