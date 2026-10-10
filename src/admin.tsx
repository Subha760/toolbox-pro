import { useEffect, useState } from "react";
import { TOOL_LIST } from "./catalog";
import { saveDownload } from "./download";
import { ToolIcon } from "./tool-icons";
import { control, CONTROL_ORIGIN } from "./control-api";
import "./admin.css";
type Data = {
  totals: { visitors: number; opens: number; attempts: number };
  returning: number;
  daily: any[];
  tools: any[];
  visitors: any[];
  reports: any[];
  settings: any;
  audit: any[];
  days: number;
};
const sections = [
  "Overview",
  "Visitors",
  "Tools",
  "Reports",
  "Advertising",
  "Announcements",
  "Audit & exports",
];
export default function Admin() {
  const [data, setData] = useState<Data | null>(null),
    [tab, setTab] = useState("Overview"),
    [days, setDays] = useState(30),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [filter, setFilter] = useState("");
  const load = async () => {
    try {
      setData(await control(`admin/dashboard?days=${days}`));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, [days]);
  async function save(key: string, value: unknown) {
    setBusy(true);
    setToast("");
    try {
      await control("admin/settings", { key, value });
      await load();
      setToast("Saved to the live website.");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportData() {
    if (data)
      saveDownload(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        `toolinger-dashboard-${new Date().toISOString().slice(0, 10)}.json`,
      );
  }
  async function remove(type: "visitor" | "report", id: string) {
    if (
      !confirm(`Delete this ${type}'s stored records? This cannot be undone.`)
    )
      return;
    setBusy(true);
    try {
      await control("admin/delete", { type, id });
      await load();
      setToast("Stored records deleted.");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="owner-app">
      <aside className="owner-rail">
        <a className="owner-brand" href="/">
          T
          <span>
            Toolinger<small>OWNER CONSOLE</small>
          </span>
        </a>
        <nav aria-label="Admin sections">
          {sections.map((s, i) => (
            <button
              key={s}
              className={tab === s ? "selected" : ""}
              onClick={() => setTab(s)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s}
            </button>
          ))}
        </nav>
        <a href="/" target="_blank" rel="noreferrer">
          ↗ Open website
        </a>
        <a href="/cdn-cgi/access/logout">Sign out</a>
      </aside>
      <main className="owner-main">
        <header>
          <div>
            <p className="owner-eyebrow">
              PRIVATE WORKSPACE / {new Date().toLocaleDateString("en-IN")}
            </p>
            <h1>{tab}</h1>
          </div>
          <div>
            <select
              aria-label="Dashboard date range"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={() => void load()}>Refresh</button>
          </div>
        </header>
        {error ? (
          <section className="owner-panel">
            <h2>Dashboard could not load</h2>
            <p role="alert">{error}</p>
            <a className="owner-primary" href={`${CONTROL_ORIGIN}/admin/`}>
              Check owner sign-in
            </a>
          </section>
        ) : !data ? (
          <p role="status">Loading your workspace…</p>
        ) : (
          <>
            {toast && (
              <p className="owner-toast" role="status">
                {toast}
              </p>
            )}
            {tab === "Overview" && (
              <>
                <div className="owner-stats">
                  {[
                    ["Consented visitors", data.totals.visitors],
                    ["Returning browsers", data.returning],
                    ["Tool opens", data.totals.opens],
                    ["Action attempts", data.totals.attempts],
                    [
                      "Open reports",
                      data.reports.filter((r) => r.status === "open").length,
                    ],
                    [
                      "Available tools",
                      TOOL_LIST.filter(
                        (t) => data.settings.tools[t.id]?.enabled !== false,
                      ).length,
                    ],
                  ].map(([label, n]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{n || 0}</strong>
                    </article>
                  ))}
                </div>
                <section className="owner-panel">
                  <h2>Activity over time</h2>
                  {data.daily.length ? (
                    <div className="owner-chart">
                      {data.daily.map((day) => (
                        <div
                          key={day.day}
                          title={`${day.day}: ${day.visitors} visitors, ${day.events} events`}
                        >
                          <i
                            style={{
                              height: `${Math.max(3, (day.events / Math.max(...data.daily.map((d) => d.events))) * 150)}px`,
                            }}
                          />
                          <small>{day.day.slice(5)}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>
                      No consented activity yet. Counts begin when visitors opt
                      in.
                    </p>
                  )}
                </section>
                <div className="owner-columns">
                  <section className="owner-panel">
                    <h2>Popular tools</h2>
                    {data.tools.slice(0, 8).map((t) => (
                      <p key={t.tool}>
                        {TOOL_LIST.find((x) => x.id === t.tool)?.name}
                        <strong>{t.opens} opens</strong>
                      </p>
                    ))}
                  </section>
                  <section className="owner-panel">
                    <h2>System status</h2>
                    <p>
                      Owner access <strong>Cloudflare Access</strong>
                    </p>
                    <p>
                      Storage <strong>Cloudflare D1</strong>
                    </p>
                    <p>
                      AdSense{" "}
                      <strong>
                        {data.settings.ads.enabled
                          ? "Enabled with consent"
                          : "Disabled"}
                      </strong>
                    </p>
                    <p>
                      Tool processing <strong>On device</strong>
                    </p>
                    <p>
                      Release checks{" "}
                      <a
                        href="https://github.com/Subha760/toolbox-pro/actions"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View actual CI results ↗
                      </a>
                    </p>
                  </section>
                </div>
                <p className="owner-note">
                  Visitors are anonymous opted-in browsers, not registered
                  accounts or a count of people. Action attempts do not claim
                  successful processing. Returning browsers have activity on at
                  least two different dates in the selected range. Event dates
                  and stored timestamps use UTC.
                </p>
              </>
            )}
            {tab === "Visitors" && (
              <section className="owner-panel">
                <h2>Consented browser activity</h2>
                <p>
                  Anonymous identifiers only. Files, text inputs, and locally
                  saved personal data are never included.
                </p>
                <div className="owner-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Browser ID</th>
                        <th>First seen</th>
                        <th>Last seen</th>
                        <th>Actions</th>
                        <th>Tools</th>
                        <th>Privacy action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.visitors.map((v) => (
                        <tr key={v.visitor}>
                          <td>{v.visitor.slice(0, 8)}</td>
                          <td>{v.first_seen}</td>
                          <td>{v.last_seen}</td>
                          <td>{v.actions}</td>
                          <td>{v.tools}</td>
                          <td>
                            <button
                              disabled={busy}
                              onClick={() => void remove("visitor", v.visitor)}
                            >
                              Delete activity
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {tab === "Tools" && (
              <section className="owner-panel">
                <h2>Tool controls</h2>
                <input
                  placeholder="Find a tool"
                  aria-label="Find a tool"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <div className="owner-tools">
                  {TOOL_LIST.filter((t) =>
                    t.name.toLowerCase().includes(filter.toLowerCase()),
                  ).map((t) => {
                    const setting = data.settings.tools[t.id] || {
                      enabled: true,
                      featured: false,
                      message: "",
                    };
                    return (
                      <article key={t.id}>
                        <ToolIcon tool={t} />
                        <div>
                          <a
                            href={`/tools/${t.id}/`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t.name} ↗
                          </a>
                          <small>
                            {data.tools.find((x) => x.tool === t.id)?.opens ||
                              0}{" "}
                            opens · {t.category}
                          </small>
                          <input
                            aria-label={`${t.name} maintenance message`}
                            maxLength={200}
                            value={setting.message}
                            onChange={(e) =>
                              setData({
                                ...data,
                                settings: {
                                  ...data.settings,
                                  tools: {
                                    ...data.settings.tools,
                                    [t.id]: {
                                      ...setting,
                                      message: e.target.value,
                                    },
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <label>
                          <input
                            type="checkbox"
                            checked={setting.enabled}
                            onChange={(e) =>
                              void save("tools", {
                                ...data.settings.tools,
                                [t.id]: {
                                  ...setting,
                                  enabled: e.target.checked,
                                },
                              })
                            }
                            disabled={busy}
                          />
                          Enabled
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={setting.featured}
                            onChange={(e) =>
                              void save("tools", {
                                ...data.settings.tools,
                                [t.id]: {
                                  ...setting,
                                  featured: e.target.checked,
                                },
                              })
                            }
                            disabled={busy}
                          />
                          Featured
                        </label>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void save("tools", data.settings.tools)
                          }
                        >
                          Save note
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
            {tab === "Reports" && (
              <section className="owner-panel">
                <h2>Feedback & issue inbox</h2>
                {!data.reports.length && (
                  <p>
                    No reports yet. Visitors can report a problem from each tool
                    page.
                  </p>
                )}
                {data.reports.map((r) => (
                  <article className="owner-report" key={r.id}>
                    <div>
                      <span>
                        {r.kind} / {r.tool}
                      </span>
                      <time>{r.created}</time>
                    </div>
                    <p>{r.message}</p>
                    {r.email && <p>Reply address: {r.email}</p>}
                    <label>
                      Status
                      <select
                        value={r.status}
                        onChange={(e) =>
                          setData({
                            ...data,
                            reports: data.reports.map((x) =>
                              x.id === r.id
                                ? { ...x, status: e.target.value }
                                : x,
                            ),
                          })
                        }
                      >
                        {["open", "investigating", "resolved", "closed"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      Private note
                      <textarea
                        maxLength={2000}
                        value={r.note}
                        onChange={(e) =>
                          setData({
                            ...data,
                            reports: data.reports.map((x) =>
                              x.id === r.id
                                ? { ...x, note: e.target.value }
                                : x,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await control("admin/report", {
                            id: r.id,
                            status: r.status,
                            note: r.note,
                          });
                          await load();
                          setToast("Report updated.");
                        } catch (e) {
                          setToast((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Save report
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => void remove("report", r.id)}
                    >
                      Delete report
                    </button>
                  </article>
                ))}
              </section>
            )}
            {tab === "Advertising" && (
              <section className="owner-panel">
                <h2>Google AdSense</h2>
                <p>
                  Ad positions are reserved in the directory, tools and guides.
                  Ads remain off until valid publisher and slot IDs are
                  supplied. A Google-certified consent platform is also required
                  before ads load in the browser.
                </p>
                <label>
                  Publisher ID
                  <input
                    placeholder="ca-pub-…"
                    value={data.settings.ads.publisherId}
                    onChange={(e) =>
                      setData({
                        ...data,
                        settings: {
                          ...data.settings,
                          ads: {
                            ...data.settings.ads,
                            publisherId: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
                {["directory", "tool", "guide"].map((slot) => (
                  <label key={slot}>
                    {slot} slot ID
                    <input
                      inputMode="numeric"
                      value={data.settings.ads.slots[slot]}
                      onChange={(e) =>
                        setData({
                          ...data,
                          settings: {
                            ...data.settings,
                            ads: {
                              ...data.settings.ads,
                              slots: {
                                ...data.settings.ads.slots,
                                [slot]: e.target.value,
                              },
                            },
                          },
                        })
                      }
                    />
                  </label>
                ))}
                <label>
                  <input
                    type="checkbox"
                    checked={data.settings.ads.enabled}
                    onChange={(e) =>
                      setData({
                        ...data,
                        settings: {
                          ...data.settings,
                          ads: {
                            ...data.settings.ads,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  Enable advertising
                </label>
                <button
                  className="owner-primary"
                  disabled={busy}
                  onClick={() => void save("ads", data.settings.ads)}
                >
                  Save ad settings
                </button>
                <p>
                  Public ads.txt is generated from enabled publisher settings.
                  No script code or secret API keys belong in these fields.
                </p>
              </section>
            )}
            {tab === "Announcements" && (
              <section className="owner-panel">
                <h2>Website announcement</h2>
                <label>
                  Message
                  <textarea
                    maxLength={250}
                    value={data.settings.announcement.text}
                    onChange={(e) =>
                      setData({
                        ...data,
                        settings: {
                          ...data.settings,
                          announcement: {
                            ...data.settings.announcement,
                            text: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={data.settings.announcement.enabled}
                    onChange={(e) =>
                      setData({
                        ...data,
                        settings: {
                          ...data.settings,
                          announcement: {
                            ...data.settings.announcement,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                  />
                  Show on public website
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    void save("announcement", data.settings.announcement)
                  }
                >
                  Publish announcement
                </button>
              </section>
            )}
            {tab === "Audit & exports" && (
              <section className="owner-panel">
                <h2>Accountability & data export</h2>
                <button className="owner-primary" onClick={exportData}>
                  Download dashboard JSON
                </button>
                <p>
                  <a
                    className="owner-primary"
                    href="/admin/downloads/signing-backup.zip"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download private signing backup
                  </a>
                </p>
                <p>
                  Keep an offline copy of your Android signing backup. It
                  contains private keys and passwords; never upload it publicly.
                </p>
                <p>
                  <a
                    href="https://github.com/Subha760/toolbox-pro/releases/download/v4.2.0/Toolinger-Owner-4.2.0.apk"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download owner Android app ↗
                  </a>
                </p>
                <p>
                  Usage is retained for 90 days; reports for 180 days; owner
                  audit records for 365 days. Cleanup runs daily. Exports
                  include submitted email addresses: keep them private.
                </p>
                <div className="owner-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Owner</th>
                        <th>Action</th>
                        <th>Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.audit.map((a) => (
                        <tr key={a.id}>
                          <td>{a.created}</td>
                          <td>{a.actor}</td>
                          <td>{a.action}</td>
                          <td>{a.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
