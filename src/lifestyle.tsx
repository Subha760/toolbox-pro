import React, { useEffect, useId, useRef, useState } from "react";
import {
  localDay,
  toCents,
  splitBill,
  savingsPlan,
  dateDays,
  addDays,
  streak,
  recipeScale,
  comparePrices,
  remainingSeconds,
} from "./daily-engine.mjs";
import {
  useDaily,
  newId,
  exportLocalData,
  validateBackup,
  restoreBackup,
  clearDaily,
  type Task,
  type Habit,
  type ShoppingItem,
  type Budget,
  type Water,
  type Meal,
} from "./storage";
import { routeHref } from "./router";
const money = (cents: number, currency = "INR") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    cents / 100,
  );
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement<any>;
}) {
  const id = useId();
  return (
    <div className="daily-field">
      <label htmlFor={id}>{label}</label>
      {React.cloneElement(children, { id })}
    </div>
  );
}
function Saved({ ok }: { ok: boolean }) {
  return (
    <p className={`storage-note ${ok ? "" : "error-text"}`} role="status">
      {ok
        ? "Saved on this device. Back up your data in My space."
        : "Browser storage is unavailable. Changes work in this tab; keep a separate copy before leaving."}
    </p>
  );
}
function Download({
  data,
  name,
  label = "Export CSV",
}: {
  data: string;
  name: string;
  label?: string;
}) {
  return (
    <button
      className="daily-secondary"
      onClick={() =>
        download(
          new Blob([data], {
            type: name.endsWith(".json")
              ? "application/json"
              : "text/plain;charset=utf-8",
          }),
          name,
        )
      }
    >
      {label}
    </button>
  );
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const csv = (rows: (string | number | boolean)[][]) =>
  rows
    .map((row) =>
      row
        .map(
          (v) =>
            `"${(typeof v === "string" && /^[=+@\-\t\r]/.test(v) ? "'" + v : String(v)).replace(/"/g, '""')}"`,
        )
        .join(","),
    )
    .join("\r\n");
function Tasks({ packing = false }: { packing?: boolean }) {
  const [tasks, setTasks, saved] = useDaily<Task[]>(
    packing ? "packing" : "tasks",
    [],
  );
  const [title, setTitle] = useState(""),
    [due, setDue] = useState(""),
    [priority, setPriority] = useState("Normal"),
    [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Enter an item first.");
    setTasks([
      ...tasks,
      { id: newId(), title: title.trim(), done: false, due, priority },
    ]);
    setTitle("");
    setError("");
  };
  const visible = tasks
    .filter((t) => filter === "all" || (filter === "done" ? t.done : !t.done))
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        ["High", "Normal", "Low"].indexOf(a.priority) -
          ["High", "Normal", "Low"].indexOf(b.priority) ||
        (a.due || "9999").localeCompare(b.due || "9999"),
    );
  return (
    <div className="daily-tool">
      <div className="tool-stat-row">
        <div>
          <strong>{tasks.filter((t) => !t.done).length}</strong>
          <span>still to do</span>
        </div>
        <div>
          <strong>{tasks.filter((t) => t.done).length}</strong>
          <span>completed</span>
        </div>
      </div>
      <form onSubmit={add} className="daily-form">
        <Field label={packing ? "Item to pack" : "Task"}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={
              packing ? "Passport, charger, jacket…" : "What needs doing?"
            }
          />
        </Field>
        {!packing ? (
          <div className="daily-two-col">
            <Field label="Due date (optional)">
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </Field>
            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {["Normal", "High", "Low"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}
        <button className="daily-primary" type="submit">
          {packing ? "Add item" : "Add task"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="error-text">
          {error}
        </p>
      ) : null}
      <div className="daily-actions">
        <Field label="Show">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All items</option>
            <option value="open">To do</option>
            <option value="done">Completed</option>
          </select>
        </Field>
        {packing ? (
          <button
            className="daily-secondary"
            onClick={() => {
              const names = [
                "Passport / ID",
                "Tickets and reservations",
                "Charger",
                "Medication",
                "Clothes",
                "Toiletries",
              ];
              setTasks([
                ...tasks,
                ...names
                  .filter((x) => !tasks.some((t) => t.title === x))
                  .map((title) => ({
                    id: newId(),
                    title,
                    done: false,
                    due: "",
                    priority: "Normal",
                  })),
              ]);
            }}
          >
            Add travel essentials
          </button>
        ) : null}
      </div>
      <ul className="daily-list">
        {visible.map((t) => (
          <li key={t.id}>
            <label className={t.done ? "item-done" : ""}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() =>
                  setTasks(
                    tasks.map((x) =>
                      x.id === t.id ? { ...x, done: !x.done } : x,
                    ),
                  )
                }
              />
              <span>
                {t.title}
                {t.due ? (
                  <small
                    className={
                      !t.done && t.due < localDay() ? "error-text" : ""
                    }
                  >
                    {t.due < localDay() && !t.done ? "Overdue · " : ""}
                    {t.due} · {t.priority}
                  </small>
                ) : null}
              </span>
            </label>
            <button
              className="delete-button"
              aria-label={`Delete ${t.title}`}
              onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {!tasks.length ? (
        <p className="daily-empty">Add your first item to get started.</p>
      ) : null}
      <Download
        data={csv([
          ["Item", "Done", "Due", "Priority"],
          ...tasks.map((t) => [t.title, t.done, t.due, t.priority]),
        ])}
        name={packing ? "packing.csv" : "tasks.csv"}
      />
      <Saved ok={saved} />
    </div>
  );
}
function Habits() {
  const [habits, setHabits, saved] = useDaily<Habit[]>("habits", []);
  const [title, setTitle] = useState("");
  const today = localDay();
  return (
    <div className="daily-tool">
      <form
        className="daily-inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) {
            setHabits([
              ...habits,
              { id: newId(), title: title.trim(), days: [] },
            ]);
            setTitle("");
          }
        }}
      >
        <Field label="New habit">
          <input
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Read for 15 minutes"
          />
        </Field>
        <button className="daily-primary">Add habit</button>
      </form>
      <p className="daily-hint">
        Check in each day. A streak includes yesterday if today is still in
        progress.
      </p>
      <div className="habit-grid">
        {habits.map((h) => (
          <article className="habit-card" key={h.id}>
            <div>
              <h3>{h.title}</h3>
              <button
                className="delete-button"
                aria-label={`Delete ${h.title}`}
                onClick={() => setHabits(habits.filter((x) => x.id !== h.id))}
              >
                ×
              </button>
            </div>
            <strong>
              {streak(h.days, today)} <small>day streak</small>
            </strong>
            <div className="habit-week" aria-label="Last seven days">
              {Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map(
                (day) => (
                  <span
                    key={day}
                    title={day}
                    className={h.days.includes(day) ? "checked" : ""}
                  >
                    {new Date(day + "T12:00:00").toLocaleDateString(undefined, {
                      weekday: "narrow",
                    })}
                  </span>
                ),
              )}
            </div>
            <button
              className={
                h.days.includes(today) ? "daily-secondary" : "daily-primary"
              }
              aria-pressed={h.days.includes(today)}
              onClick={() =>
                setHabits(
                  habits.map((x) =>
                    x.id === h.id
                      ? {
                          ...x,
                          days: x.days.includes(today)
                            ? x.days.filter((d) => d !== today)
                            : [...x.days, today],
                        }
                      : x,
                  ),
                )
              }
            >
              {h.days.includes(today) ? "Done today ✓" : "Mark done today"}
            </button>
          </article>
        ))}
      </div>
      {!habits.length ? (
        <p className="daily-empty">Start small: one habit you can repeat.</p>
      ) : null}
      <Saved ok={saved} />
    </div>
  );
}
function BudgetTracker() {
  const [budget, setBudget, saved] = useDaily<Budget>("budget", {
    limit: 2000000,
    currency: "INR",
    expenses: [],
  });
  const [title, setTitle] = useState(""),
    [amount, setAmount] = useState(""),
    [category, setCategory] = useState("Food"),
    [date, setDate] = useState(localDay()),
    [month, setMonth] = useState(localDay().slice(0, 7)),
    [error, setError] = useState("");
  const expenses = budget.expenses.filter((x) => x.date.startsWith(month)),
    spent = expenses.reduce((sum, x) => sum + x.cents, 0);
  return (
    <div className="daily-tool">
      <div className="daily-two-col">
        <Field label="Monthly budget">
          <input
            type="number"
            min="0"
            step="0.01"
            value={budget.limit / 100}
            onChange={(e) => {
              try {
                setBudget({ ...budget, limit: toCents(e.target.value) });
                setError("");
              } catch {
                setError("Enter a valid budget.");
              }
            }}
          />
        </Field>
        <Field label="Currency">
          <select
            value={budget.currency}
            onChange={(e) => setBudget({ ...budget, currency: e.target.value })}
          >
            {["INR", "USD", "EUR", "GBP"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Month">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </Field>
      <div className="tool-stat-row">
        <div>
          <strong>{money(spent, budget.currency)}</strong>
          <span>spent this month</span>
        </div>
        <div>
          <strong>{money(budget.limit - spent, budget.currency)}</strong>
          <span>{spent > budget.limit ? "over budget" : "remaining"}</span>
        </div>
      </div>
      <progress
        max={Math.max(1, budget.limit)}
        value={spent}
        aria-label="Monthly budget used"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const cents = toCents(amount);
            if (!cents || !title.trim() || !date)
              throw new Error("Add a description, positive amount and date.");
            setBudget({
              ...budget,
              expenses: [
                ...budget.expenses,
                { id: newId(), title: title.trim(), cents, category, date },
              ],
            });
            setTitle("");
            setAmount("");
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        className="daily-form"
      >
        <div className="daily-two-col">
          <Field label="Expense">
            <input
              required
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Groceries"
            />
          </Field>
          <Field label="Amount">
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {["Food", "Transport", "Home", "Health", "Shopping", "Other"].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Date">
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <button className="daily-primary">Add expense</button>
      </form>
      {error ? (
        <p role="alert" className="error-text">
          {error}
        </p>
      ) : null}
      <ul className="daily-list">
        {expenses.map((x) => (
          <li key={x.id}>
            <span>
              {x.title}
              <small>
                {x.category} · {x.date}
              </small>
            </span>
            <strong>{money(x.cents, budget.currency)}</strong>
            <button
              className="delete-button"
              aria-label={`Delete ${x.title}`}
              onClick={() =>
                setBudget({
                  ...budget,
                  expenses: budget.expenses.filter((v) => v.id !== x.id),
                })
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <Download
        name="expenses.csv"
        data={csv([
          ["Date", "Description", "Category", "Amount", "Currency"],
          ...expenses.map((x) => [
            x.date,
            x.title,
            x.category,
            (x.cents / 100).toFixed(2),
            budget.currency,
          ]),
        ])}
      />
      <Saved ok={saved} />
    </div>
  );
}
function Shopping() {
  const [items, setItems, saved] = useDaily<ShoppingItem[]>("shopping", []);
  const [title, setTitle] = useState(""),
    [quantity, setQuantity] = useState("1"),
    [price, setPrice] = useState("0"),
    [error, setError] = useState("");
  const total = items.reduce(
    (sum, x) => sum + Math.round(x.cents * x.quantity),
    0,
  );
  return (
    <div className="daily-tool">
      <div className="tool-stat-row">
        <div>
          <strong>{items.filter((x) => !x.done).length}</strong>
          <span>items left</span>
        </div>
        <div>
          <strong>{(total / 100).toFixed(2)}</strong>
          <span>estimated total · your currency</span>
        </div>
      </div>
      <form
        className="daily-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const q = Number(quantity),
              cents = toCents(price);
            if (!title.trim() || !Number.isFinite(q) || q <= 0 || q > 10000)
              throw new Error("Enter an item and a positive quantity.");
            setItems([
              ...items,
              {
                id: newId(),
                title: title.trim(),
                quantity: q,
                cents,
                done: false,
              },
            ]);
            setTitle("");
            setError("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <Field label="Item">
          <input
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Milk"
          />
        </Field>
        <div className="daily-two-col">
          <Field label="Quantity">
            <input
              required
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field label="Price per item">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        </div>
        <button className="daily-primary">Add to list</button>
      </form>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="daily-list">
        {items.map((x) => (
          <li key={x.id}>
            <label className={x.done ? "item-done" : ""}>
              <input
                type="checkbox"
                checked={x.done}
                onChange={() =>
                  setItems(
                    items.map((i) =>
                      i.id === x.id ? { ...i, done: !i.done } : i,
                    ),
                  )
                }
              />
              <span>
                {x.title}
                <small>
                  {x.quantity} × {(x.cents / 100).toFixed(2)}
                </small>
              </span>
            </label>
            <button
              className="delete-button"
              aria-label={`Delete ${x.title}`}
              onClick={() => setItems(items.filter((i) => i.id !== x.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <Download
        name="shopping-list.txt"
        label="Download list"
        data={items
          .map((x) => `${x.done ? "[x]" : "[ ]"} ${x.title} × ${x.quantity}`)
          .join("\n")}
      />
      <Saved ok={saved} />
    </div>
  );
}
function Focus() {
  const [minutes, setMinutes] = useState(25),
    [left, setLeft] = useState(1500),
    [running, setRunning] = useState(false),
    [rounds, setRounds] = useState(0),
    [status, setStatus] = useState("Ready to focus.");
  const deadline = useRef(0);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const value = remainingSeconds(deadline.current);
      setLeft(value);
      if (!value) {
        setRunning(false);
        setRounds((x) => x + 1);
        setStatus("Session complete. Take a break.");
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [running]);
  return (
    <div className="daily-tool">
      <div className="focus-presets">
        {[25, 5, 15].map((m) => (
          <button
            key={m}
            disabled={running}
            className={minutes === m ? "daily-primary" : "daily-secondary"}
            onClick={() => {
              setMinutes(m);
              setLeft(m * 60);
              setStatus(m === 25 ? "Ready to focus." : "Ready for a break.");
            }}
          >
            {m === 25 ? "Focus" : m === 5 ? "Short break" : "Long break"} · {m}{" "}
            min
          </button>
        ))}
      </div>
      <Field label="Session length (minutes)">
        <input
          type="number"
          min="1"
          max="180"
          disabled={running}
          value={minutes}
          onChange={(e) => {
            const m = Math.min(
              180,
              Math.max(1, Math.round(Number(e.target.value)) || 1),
            );
            setMinutes(m);
            setLeft(m * 60);
          }}
        />
      </Field>
      <div className="focus-display" role="timer" aria-label="Time remaining">
        {String(Math.floor(left / 60)).padStart(2, "0")}:
        {String(left % 60).padStart(2, "0")}
      </div>
      <div className="daily-actions">
        <button
          className="daily-primary"
          disabled={!left}
          onClick={() => {
            if (running) {
              setLeft(remainingSeconds(deadline.current));
              setRunning(false);
              setStatus("Paused.");
            } else {
              deadline.current = Date.now() + left * 1000;
              setRunning(true);
              setStatus("Focus session running.");
            }
          }}
        >
          {running ? "Pause timer" : "Start timer"}
        </button>
        <button
          className="daily-secondary"
          onClick={() => {
            setRunning(false);
            setLeft(minutes * 60);
            setStatus("Timer reset.");
          }}
        >
          Reset timer
        </button>
      </div>
      <p role="status">{status}</p>
      <p className="daily-hint">
        {rounds} sessions completed in this visit. The timer uses elapsed time
        so background tabs stay accurate. Keep this tab open; no background
        notifications are sent.
      </p>
    </div>
  );
}
function Hydration() {
  const today = localDay();
  const [water, setWater, saved] = useDaily<Water>("water", {
    day: today,
    goal: 2000,
    entries: [],
  });
  useEffect(() => {
    if (water.day !== today)
      setWater({ day: today, goal: water.goal, entries: [] });
  }, [today]);
  const total =
    water.day === today ? water.entries.reduce((sum, x) => sum + x.ml, 0) : 0;
  return (
    <div className="daily-tool">
      <div className="water-summary">
        <strong>
          {total} <small>/ {water.goal} ml</small>
        </strong>
        <span>
          {Math.round((total / water.goal) * 100)}% of your daily goal
        </span>
      </div>
      <progress
        max={water.goal}
        value={total}
        aria-label="Water goal progress"
      />
      <Field label="Daily goal (ml)">
        <input
          type="number"
          min="250"
          max="10000"
          step="50"
          value={water.goal}
          onChange={(e) =>
            setWater({
              ...water,
              goal: Math.min(
                10000,
                Math.max(250, Number(e.target.value) || 250),
              ),
            })
          }
        />
      </Field>
      <div className="daily-actions">
        {[150, 250, 500].map((ml) => (
          <button
            className="daily-primary"
            key={ml}
            onClick={() =>
              setWater({
                day: today,
                goal: water.goal,
                entries: [
                  ...(water.day === today ? water.entries : []),
                  { id: newId(), ml },
                ],
              })
            }
          >
            Add {ml} ml
          </button>
        ))}
        <button
          className="daily-secondary"
          disabled={!water.entries.length}
          onClick={() =>
            setWater({ ...water, entries: water.entries.slice(0, -1) })
          }
        >
          Undo last drink
        </button>
      </div>
      <p className="daily-hint">
        A personal log, not a medical recommendation. Your needs depend on
        health, activity and climate.
      </p>
      <Saved ok={saved} />
    </div>
  );
}
function Meals() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const [meals, setMeals, saved] = useDaily<Meal[]>(
    "meals",
    days.map((day) => ({ day, breakfast: "", lunch: "", dinner: "" })),
  );
  const [ingredients, setIngredients] = useState("");
  const [shopping, setShopping] = useDaily<ShoppingItem[]>("shopping", []);
  const [status, setStatus] = useState("");
  return (
    <div className="daily-tool">
      <p className="daily-hint">
        Plan meals that suit your household. Ingredients you add below go into
        your shopping list.
      </p>
      <div className="meal-grid">
        {days.map((day) => {
          const row = meals.find((x) => x.day === day) ?? {
            day,
            breakfast: "",
            lunch: "",
            dinner: "",
          };
          return (
            <section key={day}>
              <h3>{day}</h3>
              {(["breakfast", "lunch", "dinner"] as const).map((key) => (
                <Field key={key} label={`${day} ${key}`}>
                  <input
                    maxLength={200}
                    value={row[key]}
                    onChange={(e) =>
                      setMeals([
                        ...meals.filter((x) => x.day !== day),
                        { ...row, [key]: e.target.value },
                      ])
                    }
                    placeholder={key}
                  />
                </Field>
              ))}
            </section>
          );
        })}
      </div>
      <Field label="Ingredients to buy (one per line)">
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Rice\nTomatoes\nMilk"
        />
      </Field>
      <button
        className="daily-primary"
        onClick={() => {
          const names = [
            ...new Set(
              ingredients
                .split("\n")
                .map((x) => x.trim())
                .filter(Boolean),
            ),
          ];
          const fresh = names.filter(
            (x) =>
              !shopping.some((i) => i.title.toLowerCase() === x.toLowerCase()),
          );
          setShopping([
            ...shopping,
            ...fresh.map((title) => ({
              id: newId(),
              title,
              quantity: 1,
              cents: 0,
              done: false,
            })),
          ]);
          setStatus(`${fresh.length} ingredients added to your shopping list.`);
        }}
      >
        Add ingredients to shopping list
      </button>
      <p role="status">{status}</p>
      <Download
        name="meal-plan.txt"
        label="Download meal plan"
        data={days
          .map((day) => {
            const row = meals.find((x) => x.day === day);
            return `${day}\nBreakfast: ${row?.breakfast || "—"}\nLunch: ${row?.lunch || "—"}\nDinner: ${row?.dinner || "—"}`;
          })
          .join("\n\n")}
      />
      <Saved ok={saved} />
    </div>
  );
}
function Calculator({ mode }: { mode: string }) {
  const defaults: Record<string, string[]> = {
    savings: ["100000", "10000", "5000"],
    split: ["1000", "10", "3"],
    recipe: ["2", "4", "1/2 cup rice\n2 tomatoes"],
    dates: [localDay(), addDays(localDay(), 7), "7"],
    price: ["50", "500", "80", "1000"],
  };
  const [values, setValues] = useState(defaults[mode] ?? []),
    [result, setResult] = useState(""),
    [error, setError] = useState("");
  const labels: Record<string, string[]> = {
    savings: ["Savings goal", "Already saved", "Monthly contribution"],
    split: ["Bill amount", "Tip (%)", "Number of people"],
    recipe: [
      "Original servings",
      "Desired servings",
      "Ingredients (quantity first)",
    ],
    dates: ["Start date", "End date", "Days to add (negative to subtract)"],
    price: [
      "Package A price",
      "Package A quantity",
      "Package B price",
      "Package B quantity",
    ],
  };
  const run = () => {
    try {
      if (mode === "savings") {
        const p = savingsPlan(...(values as [string, string, string]));
        setResult(
          `Remaining: ${(p.remaining / 100).toFixed(2)}\nMonthly contributions needed: ${p.months}\nGoal funded: ${p.progress.toFixed(1)}%\nAssumes no interest and fixed contributions.`,
        );
      } else if (mode === "split") {
        const p = splitBill(...(values as [string, string, string]));
        setResult(
          `Total with tip: ${(p.total / 100).toFixed(2)}\nTip: ${(p.gratuity / 100).toFixed(2)}\n${p.shares.map((v: number, i: number) => `Person ${i + 1}: ${(v / 100).toFixed(2)}`).join("\n")}`,
        );
      } else if (mode === "recipe") {
        setResult(recipeScale(values[2], values[0], values[1]));
      } else if (mode === "dates") {
        setResult(
          `Days between: ${dateDays(values[1]) - dateDays(values[0])}\n${values[2]} days from start: ${addDays(values[0], values[2])}`,
        );
      } else {
        const p = comparePrices(values[0], values[1], values[2], values[3]);
        setResult(
          `A: ${(p.unitA / 100).toFixed(4)} per unit\nB: ${(p.unitB / 100).toFixed(4)} per unit\n${p.winner === "equal" ? "Equal value" : `Package ${p.winner} costs less per unit`}`,
        );
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setResult("");
    }
  };
  return (
    <div className="daily-tool">
      <div className="daily-two-col">
        {labels[mode].map((label, i) => (
          <Field key={label} label={label}>
            {mode === "recipe" && i === 2 ? (
              <textarea
                value={values[i]}
                onChange={(e) =>
                  setValues(
                    values.map((v, n) => (n === i ? e.target.value : v)),
                  )
                }
              />
            ) : (
              <input
                type={mode === "dates" && i < 2 ? "date" : "number"}
                step="any"
                value={values[i]}
                onChange={(e) =>
                  setValues(
                    values.map((v, n) => (n === i ? e.target.value : v)),
                  )
                }
              />
            )}
          </Field>
        ))}
      </div>
      {mode === "price" ? (
        <p className="daily-hint">
          Use the same unit for both packages: grams, millilitres or item count.
        </p>
      ) : null}
      <button className="daily-primary" onClick={run}>
        {mode === "recipe"
          ? "Scale recipe"
          : mode === "dates"
            ? "Calculate dates"
            : "Calculate"}
      </button>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
      <pre className="daily-result" aria-live="polite">
        {result || "Your result will appear here."}
      </pre>
      {result ? (
        <Download
          name="toolinger-result.txt"
          label="Download result"
          data={result}
        />
      ) : null}
    </div>
  );
}
function WorldClock() {
  const [now, setNow] = useState(new Date()),
    [zone, setZone] = useState("Asia/Kolkata"),
    [zones, setZones] = useState([
      "Asia/Kolkata",
      "Europe/London",
      "America/New_York",
    ]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const options = [
    "Asia/Kolkata",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "UTC",
  ];
  return (
    <div className="daily-tool">
      <div className="daily-inline-form">
        <Field label="Time zone">
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            {options.map((x) => (
              <option key={x}>{x.replace(/_/g, " ")}</option>
            ))}
          </select>
        </Field>
        <button
          className="daily-primary"
          onClick={() => setZones([...new Set([...zones, zone])])}
        >
          Add city
        </button>
      </div>
      <div className="clock-grid">
        {zones.map((z) => (
          <article key={z}>
            <h3>{z.replace(/_/g, " ")}</h3>
            <strong>
              {new Intl.DateTimeFormat(undefined, {
                timeZone: z,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }).format(now)}
            </strong>
            <span>
              {new Intl.DateTimeFormat(undefined, {
                timeZone: z,
                weekday: "long",
                month: "short",
                day: "numeric",
                timeZoneName: "short",
              }).format(now)}
            </span>
            <button
              className="text-link"
              onClick={() => setZones(zones.filter((x) => x !== z))}
            >
              Remove city
            </button>
          </article>
        ))}
      </div>
      <p className="daily-hint">
        Time zones and daylight saving are handled by your browser. Keep your
        device clock accurate.
      </p>
    </div>
  );
}
export function LifestyleTool({ mode }: { mode: string }) {
  switch (mode) {
    case "tasks":
      return <Tasks />;
    case "packing":
      return <Tasks packing />;
    case "habits":
      return <Habits />;
    case "budget":
      return <BudgetTracker />;
    case "shopping":
      return <Shopping />;
    case "focus":
      return <Focus />;
    case "hydration":
      return <Hydration />;
    case "meals":
      return <Meals />;
    case "clock":
      return <WorldClock />;
    default:
      return <Calculator mode={mode} />;
  }
}
export function DailyHub() {
  const [tasks] = useDaily<Task[]>("tasks", []),
    [habits] = useDaily<Habit[]>("habits", []),
    [water] = useDaily<Water>("water", {
      day: localDay(),
      goal: 2000,
      entries: [],
    }),
    [budget] = useDaily<Budget>("budget", {
      limit: 2000000,
      currency: "INR",
      expenses: [],
    });
  const today = localDay(),
    active = tasks.filter((x) => !x.done),
    done = habits.filter((x) => x.days.includes(today)).length,
    ml = water.day === today ? water.entries.reduce((s, x) => s + x.ml, 0) : 0,
    spent = budget.expenses
      .filter((x) => x.date.startsWith(today.slice(0, 7)))
      .reduce((s, x) => s + x.cents, 0);
  return (
    <>
      <div className="page-intro">
        <span className="eyeline">YOUR DAILY SPACE</span>
        <h1>A calmer day starts here.</h1>
        <p>
          Keep plans, routines and small decisions together. Saved privately on
          this device.
        </p>
      </div>
      <div className="daily-dashboard-stats">
        <a href={routeHref("tools/daily-planner/")}>
          <span>Tasks to do</span>
          <strong>{active.length}</strong>
          <small>
            {active.filter((t) => t.due && t.due < today).length} overdue
          </small>
        </a>
        <a href={routeHref("tools/habit-tracker/")}>
          <span>Habits today</span>
          <strong>
            {done} / {habits.length}
          </strong>
          <small>Keep showing up</small>
        </a>
        <a href={routeHref("tools/hydration-tracker/")}>
          <span>Water logged</span>
          <strong>{ml} ml</strong>
          <small>Goal: {water.goal} ml</small>
        </a>
        <a href={routeHref("tools/expense-tracker/")}>
          <span>Monthly spending</span>
          <strong>{money(spent, budget.currency)}</strong>
          <small>Budget: {money(budget.limit, budget.currency)}</small>
        </a>
      </div>
      <div className="hub-columns">
        <section className="hub-panel">
          <h2>Your next steps</h2>
          {active.length ? (
            <ul>
              {active.slice(0, 5).map((x) => (
                <li key={x.id}>
                  {x.title}
                  <small>{x.due || "No deadline"}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p>Your list is clear. Add a task when you’re ready.</p>
          )}
          <a className="text-link" href={routeHref("tools/daily-planner/")}>
            Open daily planner →
          </a>
        </section>
        <section className="hub-panel">
          <h2>A little routine</h2>
          <p>
            Focus on one task for 25 minutes, take a short break, then check in
            with your habits.
          </p>
          <div className="daily-actions">
            <a className="daily-primary" href={routeHref("tools/focus-timer/")}>
              Start a focus session
            </a>
            <a
              className="daily-secondary"
              href={routeHref("tools/habit-tracker/")}
            >
              Review habits
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
export function MySpace() {
  const [status, setStatus] = useState(""),
    [pending, setPending] = useState<Record<string, unknown> | null>(null),
    [confirmClear, setConfirmClear] = useState(false);
  return (
    <div className="hub-panel my-space">
      <h2>Your data, your device.</h2>
      <p>
        Backups include tasks, habits, expenses, shopping, meals, packing and
        hydration logs. They may contain private information; store them
        somewhere you trust.
      </p>
      <button
        className="daily-primary"
        onClick={() => {
          try {
            download(
              new Blob([JSON.stringify(exportLocalData(), null, 2)], {
                type: "application/json",
              }),
              `toolinger-backup-${localDay()}.json`,
            );
            setStatus("Backup downloaded.");
          } catch {
            setStatus("Could not access browser storage.");
          }
        }}
      >
        Download backup
      </button>
      <Field label="Restore a Toolinger backup">
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            setPending(null);
            try {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024)
                throw new Error("Use a backup smaller than 2 MB.");
              setPending(validateBackup(JSON.parse(await file.text())));
              setStatus("Backup checked. Review before restoring.");
            } catch (error) {
              setStatus(
                error instanceof Error ? error.message : "Invalid backup.",
              );
            }
          }}
        />
      </Field>
      {pending ? (
        <div className="backup-review">
          <p>
            This replaces the saved sections in this backup:{" "}
            {Object.keys(pending).join(", ")}. Other sections stay unchanged.
          </p>
          <button
            className="daily-primary"
            onClick={() => {
              try {
                restoreBackup(pending);
                setPending(null);
                setStatus("Backup restored.");
              } catch (e) {
                setStatus((e as Error).message);
              }
            }}
          >
            Restore these sections
          </button>
          <button className="daily-secondary" onClick={() => setPending(null)}>
            Cancel restore
          </button>
        </div>
      ) : null}
      <hr />
      <h3>Clear daily-life data</h3>
      <p>
        This removes only daily planner data from this browser. Download a
        backup first if you want to keep it.
      </p>
      {confirmClear ? (
        <div className="daily-actions">
          <button
            className="daily-danger"
            onClick={() => {
              try {
                clearDaily();
                setStatus("Daily-life data cleared.");
                setConfirmClear(false);
              } catch {
                setStatus("Could not clear storage.");
              }
            }}
          >
            Confirm clear daily data
          </button>
          <button
            className="daily-secondary"
            onClick={() => setConfirmClear(false)}
          >
            Keep my data
          </button>
        </div>
      ) : (
        <button
          className="daily-secondary"
          onClick={() => setConfirmClear(true)}
        >
          Clear daily data
        </button>
      )}
      <p role="status">{status}</p>
    </div>
  );
}
