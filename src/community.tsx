import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { control } from "./control-api";
const KEY = "toolinger-usage-consent-v1",
  VISITOR = "toolinger-visitor-v1";
const blocked = () =>
  navigator.doNotTrack === "1" ||
  Boolean(
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl,
  );
function allowed() {
  try {
    return !blocked() && localStorage.getItem(KEY) === "yes";
  } catch {
    return false;
  }
}
export function record(tool: string, kind: "open" | "action") {
  if (
    !allowed() ||
    (location.hostname !== "tools.choicematrix.in" &&
      !Capacitor.isNativePlatform())
  )
    return;
  try {
    let visitor = localStorage.getItem(VISITOR);
    if (!visitor) {
      visitor = crypto.randomUUID();
      localStorage.setItem(VISITOR, visitor);
    }
    void control("event", {
      id: crypto.randomUUID(),
      visitor,
      tool,
      kind,
      consent: true,
    }).catch(() => {});
  } catch {}
}
export function useCommunity(tool?: string) {
  const [settings, setSettings] = useState<any>({
    tools: {},
    announcement: { enabled: false, text: "" },
  });
  useEffect(() => {
    if (
      location.hostname === "tools.choicematrix.in" ||
      Capacitor.isNativePlatform()
    )
      control("config")
        .then(setSettings)
        .catch(() => {});
  }, []);
  useEffect(() => {
    if (!tool) return;
    record(tool, "open");
    const target = document.querySelector('[data-testid="tool-content"]');
    let previous = 0;
    const click = (event: Event) => {
      const button = (event.target as Element).closest("button");
      if (button && Date.now() - previous > 1000) {
        previous = Date.now();
        record(tool, "action");
      }
    };
    target?.addEventListener("click", click);
    return () => target?.removeEventListener("click", click);
  }, [tool]);
  return settings;
}
export function UsageChoice() {
  const [choice, setChoice] = useState(() => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return "no";
      }
    }),
    [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("toolinger:usage-privacy", fn);
    return () => window.removeEventListener("toolinger:usage-privacy", fn);
  }, []);
  if (!open && choice !== null) return null;
  function save(value: string) {
    try {
      localStorage.setItem(KEY, value);
      if (value === "no") localStorage.removeItem(VISITOR);
    } catch {}
    setChoice(value);
    setOpen(false);
  }
  return (
    <section className="usage-choice" aria-label="Optional usage measurement">
      <strong>Help improve the toolkit?</strong>
      <p>
        Allow anonymous tool-open and button-action counts. Your files, text and
        daily entries stay on your device.
      </p>
      <div>
        <button onClick={() => save("no")}>Keep usage private</button>
        <button disabled={blocked()} onClick={() => save("yes")}>
          Allow anonymous counts
        </button>
      </div>
      <a href={`${import.meta.env.BASE_URL}privacy/`}>Privacy details</a>
    </section>
  );
}
export function ReportTool({ tool }: { tool: string }) {
  const [open, setOpen] = useState(false),
    [kind, setKind] = useState("bug"),
    [message, setMessage] = useState(""),
    [email, setEmail] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="tool-report">
      <button
        className="daily-secondary"
        onClick={() => {
          setOpen(!open);
          setStatus("");
        }}
      >
        {open ? "Close report" : "Report a problem / suggest a feature"}
      </button>
      {open && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              await control("report", {
                tool,
                kind,
                message,
                email,
                website: "",
              });
              setStatus("Report received. Thank you.");
              setMessage("");
              setEmail("");
            } catch (e) {
              setStatus((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>Help us improve this tool</h3>
          <label>
            Report type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="bug">Something isn’t working</option>
              <option value="feature">Feature suggestion</option>
              <option value="feedback">General feedback</option>
            </select>
          </label>
          <label>
            What happened?
            <textarea
              required
              minLength={10}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the steps and your browser. Don’t include sensitive input or files."
            />
          </label>
          <label>
            Email for follow-up (optional)
            <input
              type="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <p>
            Your message and optional email are sent to Toolinger and retained
            for up to 180 days. Tool inputs and files are not attached.
          </p>
          <button className="daily-primary" disabled={busy}>
            {busy ? "Sending…" : "Send report"}
          </button>
          <p role="status">{status}</p>
        </form>
      )}
    </section>
  );
}
