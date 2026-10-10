import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Search,
  Pause,
  Play,
  ScanFace,
  FileStack,
  CalendarCheck,
  ShieldCheck,
  Zap,
  ChevronRight,
} from "lucide-react";
import { TOOL_LIST } from "./catalog";
import { ToolIcon } from "./tool-icons";
import { routeHref } from "./router";

export function HomeExperience() {
  const [query, setQuery] = useState("");
  const [paused, setPaused] = useState(false);
  const stage = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    if (stage.current) observer.observe(stage.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const matches = query.trim()
    ? TOOL_LIST.filter((t) =>
        `${t.name} ${t.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ).slice(0, 5)
    : [];
  return (
    <section
      ref={stage}
      className={`experience page-width ${paused || !visible ? "motion-paused" : ""}`}
    >
      <div className="experience-copy">
        <span className="experience-label">
          <span /> YOUR EVERYDAY SUPERPOWER
        </span>
        <h1>
          Less busywork.
          <br />
          <em>More living.</em>
        </h1>
        <p>
          Your photos, files and daily plans. One beautifully simple toolkit to
          move things forward.
        </p>
        <div className="experience-search">
          <Search size={21} />
          <input
            aria-label="Find a tool on the homepage"
            placeholder="What would you like to do?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <a href={routeHref("tools/")} aria-label="Browse all tools">
            <ArrowUpRight size={23} />
          </a>
          {query.trim() && (
            <div className="experience-results" aria-live="polite">
              {matches.length ? (
                matches.map((t) => (
                  <a key={t.id} href={routeHref(`tools/${t.id}/`)}>
                    <ToolIcon tool={t} size={21} />
                    <span>{t.name}</span>
                    <ChevronRight size={16} />
                  </a>
                ))
              ) : (
                <p>No matches. Try “photo”, “PDF” or “planner”.</p>
              )}
            </div>
          )}
        </div>
        <div className="experience-shortcuts">
          <span>Try</span>
          {["passport-photo-maker", "merge-pdf", "daily-planner"].map((id) => {
            const t = TOOL_LIST.find((t) => t.id === id)!;
            return (
              <a key={id} href={routeHref(`tools/${id}/`)}>
                {t.name}
                <ArrowUpRight size={13} />
              </a>
            );
          })}
        </div>
        <div className="experience-actions">
          <a className="experience-primary" href={routeHref("tools/")}>
            Explore {TOOL_LIST.length} tools <ArrowUpRight size={19} />
          </a>
          <a href={routeHref("daily/")}>
            Build your daily routine <ChevronRight size={17} />
          </a>
        </div>
        <div className="experience-trust">
          <span>
            <ShieldCheck size={16} /> Files stay on your device
          </span>
          <span>
            <Zap size={16} /> Free to use
          </span>
        </div>
      </div>
      <div className="motion-world">
        <div className="world-glow" aria-hidden="true" />
        <div className="world-ring" aria-hidden="true" />
        <div className="world-label">
          A LITTLE SPACE. A LOT OF POSSIBILITIES.
        </div>
        <a
          className="world-photo"
          href={routeHref("tools/passport-photo-maker/")}
          aria-label="Open passport photo studio"
        >
          <div className="world-card-title">
            <ScanFace size={18} />
            <span>Photo studio</span>
            <ArrowUpRight size={17} />
          </div>
          <div className="portrait-motion">
            <svg
              viewBox="0 0 220 220"
              role="img"
              aria-label="Animated illustration of a portrait in the photo studio"
            >
              <defs>
                <linearGradient id="portrait-sky" x2="1" y2="1">
                  <stop stopColor="#b5cbff" />
                  <stop offset="1" stopColor="#eee5ff" />
                </linearGradient>
              </defs>
              <rect width="220" height="220" fill="url(#portrait-sky)" />
              <circle cx="176" cy="40" r="62" fill="#ffffff" opacity=".25" />
              <path d="M38 220c0-50 29-78 72-78s72 28 72 78" fill="#394579" />
              <path d="M93 120h34v34c-7 12-27 12-34 0" fill="#bf825f" />
              <ellipse cx="110" cy="88" rx="40" ry="49" fill="#dca782" />
              <path
                d="M68 87c-12-69 88-83 85-9-17-1-42-12-53-27-6 20-18 26-32 36"
                fill="#292535"
              />
              <path
                d="M89 92h8m27 0h8"
                stroke="#332d36"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M102 115q9 6 17 0"
                fill="none"
                stroke="#874b45"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="portrait-scan" aria-hidden="true" />
            <span className="portrait-badge">Make it yours</span>
          </div>
          <div className="studio-swatches" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>Backgrounds & print sheets</span>
          </div>
        </a>
        <a className="world-file" href={routeHref("tools/merge-pdf/")}>
          <FileStack size={33} />
          <span>
            <b>Files, simplified.</b>
            <small>Merge · compress · convert</small>
          </span>
          <ArrowUpRight size={21} />
        </a>
        <a className="world-day" href={routeHref("daily/")}>
          <CalendarCheck size={21} />
          <b>A calmer kind of day.</b>
          <span>
            <i /> Plan your priorities
          </span>
          <span>
            <i /> Make time for yourself
          </span>
          <ArrowUpRight size={19} />
        </a>
        <div className="world-orb" aria-hidden="true">
          ✳
        </div>
        <button
          className="motion-control"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}{" "}
          {paused ? "Play motion" : "Pause motion"}
        </button>
      </div>
    </section>
  );
}
