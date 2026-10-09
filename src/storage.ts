import { useEffect, useState } from "react";
export type Task = {
  id: string;
  title: string;
  done: boolean;
  due: string;
  priority: string;
};
export type Habit = { id: string; title: string; days: string[] };
export type Expense = {
  id: string;
  title: string;
  cents: number;
  category: string;
  date: string;
};
export type ShoppingItem = {
  id: string;
  title: string;
  quantity: number;
  cents: number;
  done: boolean;
};
export type Budget = { limit: number; currency: string; expenses: Expense[] };
export type Water = {
  day: string;
  goal: number;
  entries: { id: string; ml: number }[];
};
export type Meal = {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
};
export const DAILY_PREFIX = "toolinger-daily-";
const text = (v: unknown): v is string =>
  typeof v === "string" && v.length < 20000;
const date = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
const nonnegative = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e12;
const list = (v: unknown, validate: (item: any) => boolean) =>
  Array.isArray(v) && v.length <= 10000 && v.every(validate);
export const SCHEMAS: Record<string, (v: any) => boolean> = {
  tasks: (v) =>
    list(
      v,
      (x) =>
        x &&
        text(x.id) &&
        text(x.title) &&
        typeof x.done === "boolean" &&
        (x.due === "" || date(x.due)) &&
        ["Normal", "High", "Low"].includes(x.priority),
    ),
  packing: (v) =>
    list(
      v,
      (x) =>
        x &&
        text(x.id) &&
        text(x.title) &&
        typeof x.done === "boolean" &&
        text(x.due) &&
        text(x.priority),
    ),
  habits: (v) =>
    list(v, (x) => x && text(x.id) && text(x.title) && list(x.days, date)),
  budget: (v) =>
    v &&
    nonnegative(v.limit) &&
    Number.isSafeInteger(v.limit) &&
    ["INR", "USD", "EUR", "GBP"].includes(v.currency) &&
    list(
      v.expenses,
      (x) =>
        x &&
        text(x.id) &&
        text(x.title) &&
        nonnegative(x.cents) &&
        Number.isSafeInteger(x.cents) &&
        text(x.category) &&
        date(x.date),
    ),
  shopping: (v) =>
    list(
      v,
      (x) =>
        x &&
        text(x.id) &&
        text(x.title) &&
        nonnegative(x.quantity) &&
        x.quantity > 0 &&
        nonnegative(x.cents) &&
        Number.isSafeInteger(x.cents) &&
        typeof x.done === "boolean",
    ),
  water: (v) =>
    v &&
    date(v.day) &&
    nonnegative(v.goal) &&
    v.goal > 0 &&
    list(v.entries, (x) => x && text(x.id) && nonnegative(x.ml) && x.ml > 0),
  meals: (v) =>
    list(
      v,
      (x) =>
        x &&
        text(x.day) &&
        text(x.breakfast) &&
        text(x.lunch) &&
        text(x.dinner),
    ),
};
export function readDaily<T>(key: string, fallback: T): T {
  try {
    const raw = JSON.parse(localStorage.getItem(DAILY_PREFIX + key) || "null");
    return SCHEMAS[key]?.(raw) ? raw : fallback;
  } catch {
    return fallback;
  }
}
export function writeDaily(key: string, value: unknown) {
  if (!SCHEMAS[key]?.(value)) throw new Error("This data could not be saved.");
  try {
    localStorage.setItem(DAILY_PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("toolinger:storage", { detail: key }));
    return true;
  } catch {
    return false;
  }
}
export function useDaily<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readDaily(key, fallback));
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    const refresh = () => setValue(readDaily(key, fallback));
    window.addEventListener("toolinger:storage", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("toolinger:storage", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [key]);
  const update = (next: T) => {
    setValue(next);
    setSaved(writeDaily(key, next));
  };
  return [value, update, saved] as const;
}
export const newId = () => crypto.randomUUID();
export function exportLocalData() {
  const data: Record<string, unknown> = {};
  for (const key of Object.keys(SCHEMAS)) {
    const raw = localStorage.getItem(DAILY_PREFIX + key);
    if (raw) {
      const value = JSON.parse(raw);
      if (SCHEMAS[key](value)) data[key] = value;
    }
  }
  return {
    format: "toolinger-backup",
    version: 1,
    created: new Date().toISOString(),
    data,
  };
}
export function validateBackup(raw: unknown): Record<string, unknown> {
  const b = raw as any;
  if (
    !b ||
    b.format !== "toolinger-backup" ||
    b.version !== 1 ||
    !b.data ||
    Array.isArray(b.data) ||
    typeof b.data !== "object"
  )
    throw new Error("Choose a Toolinger version 1 backup.");
  const entries = Object.entries(b.data);
  if (!entries.length)
    throw new Error("This backup contains no daily-life data.");
  for (const [key, value] of entries)
    if (!Object.hasOwn(SCHEMAS, key) || !SCHEMAS[key](value))
      throw new Error(`Invalid backup data: ${key}. Nothing was imported.`);
  return b.data;
}
export function restoreBackup(data: Record<string, unknown>) {
  const previous = new Map<string, string | null>();
  try {
    for (const [key, value] of Object.entries(data)) {
      const full = DAILY_PREFIX + key;
      previous.set(full, localStorage.getItem(full));
      localStorage.setItem(full, JSON.stringify(value));
    }
  } catch {
    for (const [key, value] of previous) {
      try {
        value === null
          ? localStorage.removeItem(key)
          : localStorage.setItem(key, value);
      } catch {}
    }
    throw new Error("Storage is unavailable or full. Import was rolled back.");
  }
  window.dispatchEvent(new Event("toolinger:storage"));
}
export function clearDaily() {
  for (const key of Object.keys(SCHEMAS))
    localStorage.removeItem(DAILY_PREFIX + key);
  window.dispatchEvent(new Event("toolinger:storage"));
}
