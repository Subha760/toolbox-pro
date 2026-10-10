import React, { useEffect, useRef, useState } from "react";
import { TOOL_LIST } from "./catalog";
import { routeHref } from "./router";
import { ToolIcon } from "./tool-icons";
import "./app-upgrades.css";

export function QuickLaunch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const status = () => setOnline(navigator.onLine);
    const keys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setOpen(v => !v);
      }
    };
    window.addEventListener("online", status); window.addEventListener("offline", status);
    window.addEventListener("keydown", keys);
    return () => { window.removeEventListener("online", status); window.removeEventListener("offline", status); window.removeEventListener("keydown", keys); };
  }, []);
  useEffect(() => {
    if (open) { setQuery(""); dialog.current?.showModal(); input.current?.focus(); }
    else if (dialog.current?.open) { dialog.current.close(); trigger.current?.focus(); }
  }, [open]);
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = TOOL_LIST.filter(t => words.every(w => `${t.name} ${t.description} ${t.keywords.join(" ")}`.toLowerCase().includes(w))).slice(0, 9);
  return <>
    <div className="quick-dock">
      {!online && <span role="status" className="offline-pill">Offline · available tools work locally</span>}
      <button ref={trigger} className="quick-launch" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Quick tool search"><span aria-hidden="true">⌕</span> Quick search <kbd>Ctrl K</kbd></button>
    </div>
    <dialog ref={dialog} className="quick-dialog" aria-labelledby="quick-title" onCancel={e => { e.preventDefault(); setOpen(false); }} onClick={e => { if(e.target === dialog.current) setOpen(false); }}>
      <div className="quick-heading"><h2 id="quick-title">What do you need?</h2><button aria-label="Close quick search" onClick={() => setOpen(false)}>×</button></div>
      <input ref={input} aria-label="Find a tool quickly" placeholder="Try passport, PDF, expenses…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="quick-results">{results.map(t => <a key={t.id} href={routeHref(`tools/${t.id}/`)} onClick={() => setOpen(false)}><ToolIcon tool={t} /><span><strong>{t.name}</strong><small>{t.description}</small></span><span aria-hidden="true">↗</span></a>)}{!results.length && <p role="status">No matching tools. Try a shorter phrase.</p>}</div>
      <p className="quick-foot">Esc to close · Tab to select · Enter to open</p>
    </dialog>
  </>;
}

export function EverydayCosts() {
  const [tab, setTab] = useState("budget");
  const [income, setIncome] = useState("30000");
  const [distance, setDistance] = useState("20");
  const [efficiency, setEfficiency] = useState("15");
  const [fuel, setFuel] = useState("100");
  const [watts, setWatts] = useState("1000");
  const [hours, setHours] = useState("2");
  const [days, setDays] = useState("30");
  const [tariff, setTariff] = useState("8");
  const positive = (s: string) => s.trim() !== "" && Number.isFinite(Number(s)) && Number(s) >= 0;
  const cash = (n: number) => new Intl.NumberFormat(undefined, {style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);
  const valid = tab === "budget" ? positive(income) : tab === "fuel" ? [distance,efficiency,fuel].every(positive) && +efficiency > 0 : [watts,hours,days,tariff].every(positive) && +hours <= 24 && +days <= 366;
  const field = (label: string, value: string, setter: (v: string) => void, max?: number) => <label className="cost-field">{label}<input type="number" min="0" max={max} step="any" inputMode="decimal" value={value} onChange={e => setter(e.target.value)} /></label>;
  return <section className="daily-costs" aria-labelledby="cost-title"><div className="cost-header"><span className="eyeline">SMALL DECISIONS, CLEAR NUMBERS</span><h2 id="cost-title">Plan everyday costs.</h2><p>Estimate before you spend. These calculations stay on your device.</p></div>
    <div className="cost-tabs" role="group" aria-label="Choose cost calculator">{[["budget","Monthly budget"],["fuel","Fuel cost"],["power","Electricity"]].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</div>
    <div className="cost-layout"><div className="cost-fields">{tab === "budget" ? field("Monthly take-home income (₹)",income,setIncome) : tab === "fuel" ? <>{field("Total journey distance (km)",distance,setDistance)}{field("Vehicle efficiency (km/litre)",efficiency,setEfficiency)}{field("Fuel price (₹/litre)",fuel,setFuel)}</> : <>{field("Appliance power (watts)",watts,setWatts)}{field("Hours used per day",hours,setHours,24)}{field("Number of days",days,setDays,366)}{field("Electricity rate (₹/kWh)",tariff,setTariff)}</>}</div>
    <div className="cost-results" aria-live="polite">{!valid ? <p>Enter valid non-negative numbers.{tab==="fuel"?" Efficiency must be greater than zero.":tab==="power"?" Use at most 24 hours per day and 366 days.":""}</p> : tab === "budget" ? <><h3>50 / 30 / 20 starting plan</h3><dl><div><dt>Needs · 50%</dt><dd>{cash(+income*.5)}</dd></div><div><dt>Wants · 30%</dt><dd>{cash(+income*.3)}</dd></div><div><dt>Savings & debt · 20%</dt><dd>{cash(+income*.2)}</dd></div></dl><small>A starting guideline. Adjust for rent, obligations, and your goals.</small></> : tab === "fuel" ? <><h3>Estimated journey cost</h3><strong className="cost-total">{cash(+distance / +efficiency * +fuel)}</strong><p>{(+distance / +efficiency).toFixed(2)} litres · {cash(+fuel / +efficiency)} per km</p><small>Enter the full distance, including your return trip. Traffic and driving conditions change actual consumption.</small></> : <><h3>Estimated energy cost</h3><strong className="cost-total">{cash(+watts / 1000 * +hours * +days * +tariff)}</strong><p>{(+watts / 1000 * +hours * +days).toFixed(2)} kWh over {days} days</p><small>For one appliance. Fixed charges, taxes, tariff slabs, and standby use are excluded.</small></>}</div></div>
  </section>;
}
