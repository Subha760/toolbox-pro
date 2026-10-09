import { useEffect, useRef, useState } from "react";
import { assetUrl, routeHref } from "./router";
type Config = {
  enabled: boolean;
  provider: string;
  publisherId: string;
  slots: Record<string, string>;
  requireCertifiedCmp: boolean;
};
type Choice = { version: 1; advertising: boolean; updated: string };
const KEY = "toolinger-ad-consent-v1";
let configPromise: Promise<Config> | undefined;
function config() {
  return (configPromise ??= fetch(assetUrl("ad-config.json"), {
    cache: "no-store",
  })
    .then((r) => {
      if (!r.ok) throw new Error("No ad configuration");
      return r.json();
    })
    .catch(() => ({
      enabled: false,
      provider: "adsense",
      publisherId: "",
      slots: {},
      requireCertifiedCmp: true,
    })));
}
const privacySignal = () =>
  Boolean(
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl,
  ) || navigator.doNotTrack === "1";
function choice(): Choice | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    return c?.version === 1 && typeof c.advertising === "boolean" ? c : null;
  } catch {
    return null;
  }
}
function useChoice() {
  const [consent, setConsent] = useState(choice);
  useEffect(() => {
    const update = () => setConsent(choice());
    window.addEventListener("toolinger:consent", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("toolinger:consent", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return consent;
}
export function ConsentControls() {
  const consent = useChoice(),
    [open, setOpen] = useState(false),
    [enabled, setEnabled] = useState(false);
  useEffect(() => {
    config().then((c) => setEnabled(c.enabled));
    const open = () => setOpen(true);
    window.addEventListener("toolinger:privacy", open);
    return () => window.removeEventListener("toolinger:privacy", open);
  }, []);
  const save = (advertising: boolean) => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          version: 1,
          advertising: advertising && !privacySignal(),
          updated: new Date().toISOString(),
        }),
      );
    } catch {}
    window.dispatchEvent(new Event("toolinger:consent"));
    setOpen(false);
    if (!advertising) location.reload();
  };
  if (!open && (!enabled || consent || privacySignal())) return null;
  return (
    <section className="consent-panel" aria-label="Advertising privacy choices">
      <h2>Your privacy choices</h2>
      <p>
        Essential storage keeps your plans and settings on this device. Optional
        advertising can use cookies and device information.{" "}
        {enabled
          ? "Your choice is applied before ads load."
          : "Advertising is currently disabled."}{" "}
        {privacySignal()
          ? "Your browser’s privacy signal blocks advertising."
          : ""}
      </p>
      <div className="daily-actions">
        <button className="daily-secondary" onClick={() => save(false)}>
          Necessary only
        </button>
        <button
          className="daily-primary"
          disabled={privacySignal()}
          onClick={() => save(true)}
        >
          Allow advertising
        </button>
        <a className="daily-secondary" href={routeHref("privacy/")}>
          Read privacy policy
        </a>
      </div>
      <button className="text-link" onClick={() => setOpen(false)}>
        Close preferences
      </button>
    </section>
  );
}
let adScript: Promise<void> | undefined;
function loadAdScript(publisherId: string) {
  return (adScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.onload = () => resolve();
    script.onerror = () => {
      adScript = undefined;
      reject(new Error("Ad script unavailable"));
    };
    document.head.appendChild(script);
  }));
}
export function AdPlacement({ placement }: { placement: string }) {
  const consent = useChoice(),
    [settings, setSettings] = useState<Config | null>(null),
    [approved, setApproved] = useState(false),
    ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    config().then(setSettings);
  }, []);
  useEffect(() => {
    setApproved(false);
    if (!settings?.enabled || !consent?.advertising || privacySignal()) return;
    const tcf = (window as any).__tcfapi;
    if (settings.requireCertifiedCmp) {
      if (typeof tcf !== "function") return;
      let listenerId: number | undefined;
      tcf("addEventListener", 2, (data: any, ok: boolean) => {
        listenerId = data?.listenerId;
        setApproved(
          Boolean(
            ok &&
            ["tcloaded", "useractioncomplete"].includes(data.eventStatus) &&
            data.purpose?.consents?.["1"] &&
            data.vendor?.consents?.["755"],
          ),
        );
      });
      return () => {
        if (listenerId) tcf("removeEventListener", 2, () => {}, listenerId);
      };
    }
    return;
  }, [settings, consent?.advertising]);
  const slot = settings?.slots[placement];
  const eligible =
    approved &&
    settings?.enabled &&
    /^ca-pub-\d{16}$/.test(settings.publisherId) &&
    /^\d+$/.test(slot || "");
  useEffect(() => {
    if (!eligible || !settings) return;
    let active = true;
    loadAdScript(settings.publisherId)
      .then(() => {
        if (
          active &&
          ref.current &&
          ref.current.dataset.adInitialized !== "yes"
        ) {
          (window as any).adsbygoogle = (window as any).adsbygoogle || [];
          (window as any).adsbygoogle.push({});
          ref.current.dataset.adInitialized = "yes";
        }
      })
      .catch(() => setApproved(false));
    return () => {
      active = false;
    };
  }, [eligible, settings?.publisherId, slot]);
  if (!eligible || !settings) return null;
  return (
    <aside className="ad-placement" aria-label="Advertisement">
      <span>Advertisement</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={settings.publisherId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
