export const localDay = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
export function toCents(raw) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(raw).trim()))
    throw new Error(
      "Enter a non-negative amount with at most two decimal places.",
    );
  const cents = Math.round(Number(raw) * 100);
  if (!Number.isSafeInteger(cents) || cents > 1e12)
    throw new Error("Amount is too large.");
  return cents;
}
export function splitBill(bill, tip, people) {
  const cents = toCents(bill),
    rate = Number(tip),
    count = Number(people);
  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 100
  )
    throw new Error("Use a tip from 0–100% and 1–100 people.");
  const gratuity = Math.round((cents * rate) / 100),
    total = cents + gratuity;
  return {
    total,
    gratuity,
    shares: Array.from(
      { length: count },
      (_, i) => Math.floor(total / count) + (i < total % count ? 1 : 0),
    ),
  };
}
export function savingsPlan(target, saved, monthly) {
  const total = toCents(target),
    balance = toCents(saved),
    deposit = toCents(monthly);
  if (total <= 0 || deposit <= 0)
    throw new Error("Goal and monthly contribution must be greater than zero.");
  return {
    remaining: Math.max(0, total - balance),
    months: Math.ceil(Math.max(0, total - balance) / deposit),
    progress: Math.min(100, (balance / total) * 100),
  };
}
export function dateDays(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error("Select a valid date.");
  const [y, m, d] = date.split("-").map(Number);
  const value = new Date(Date.UTC(y, m - 1, d));
  if (value.toISOString().slice(0, 10) !== date)
    throw new Error("Select a valid date.");
  return value.getTime() / 86400000;
}
export function addDays(date, days) {
  const amount = Number(days);
  if (!Number.isInteger(amount) || Math.abs(amount) > 365000)
    throw new Error("Use a whole number of days between -365000 and 365000.");
  return new Date((dateDays(date) + amount) * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function streak(completions, today = localDay()) {
  const done = new Set(completions);
  let day = dateDays(today);
  if (!done.has(today)) day--;
  let count = 0;
  while (done.has(new Date(day * 86400000).toISOString().slice(0, 10))) {
    count++;
    day--;
  }
  return count;
}
export function recipeScale(lines, original, desired) {
  const from = Number(original),
    to = Number(desired);
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    from <= 0 ||
    to <= 0 ||
    from > 1000 ||
    to > 1000
  )
    throw new Error("Use serving counts between 0 and 1000.");
  return lines
    .split("\n")
    .filter((x) => x.trim())
    .map((line) => {
      const match = line
        .trim()
        .match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s+(.+)$/);
      if (!match)
        throw new Error(
          "Start each ingredient with a quantity, for example: 1/2 cup rice.",
        );
      const quantity = match[1].split(/\s+/).reduce((sum, x) => {
        if (!x.includes("/")) return sum + Number(x);
        const [n, d] = x.split("/").map(Number);
        if (!d) throw new Error("Fraction denominator cannot be zero.");
        return sum + n / d;
      }, 0);
      return `${Number(((quantity * to) / from).toFixed(3))} ${match[2]}`;
    })
    .join("\n");
}
export function comparePrices(priceA, quantityA, priceB, quantityB) {
  const a = toCents(priceA),
    b = toCents(priceB),
    qa = Number(quantityA),
    qb = Number(quantityB);
  if (!Number.isFinite(qa) || !Number.isFinite(qb) || qa <= 0 || qb <= 0)
    throw new Error("Quantities must be positive and in the same unit.");
  const unitA = a / qa,
    unitB = b / qb;
  return {
    unitA,
    unitB,
    winner:
      Math.abs(unitA - unitB) < 1e-9 ? "equal" : unitA < unitB ? "A" : "B",
  };
}
export function remainingSeconds(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
