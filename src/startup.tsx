import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Volume2, VolumeX } from "lucide-react";
const SOUND_KEY = "toolinger-startup-sound-v1";
const EVENT = "toolinger:sound-choice";
function soundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) === "on";
  } catch {
    return false;
  }
}
function chime() {
  try {
    const context = new AudioContext();
    void context
      .resume()
      .then(() => {
        [523.25, 783.99, 1046.5].forEach((frequency, i) => {
          const tone = context.createOscillator(),
            gain = context.createGain();
          const start = context.currentTime + i * 0.085;
          tone.type = "sine";
          tone.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.035, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
          tone.connect(gain);
          gain.connect(context.destination);
          tone.start(start);
          tone.stop(start + 0.25);
        });
        setTimeout(() => {
          void context.close();
        }, 650);
      })
      .catch(() => {
        void context.close();
      });
  } catch {
    /* Audio is optional; tools still work when unavailable. */
  }
}
export function StartupSoundButton() {
  const [enabled, setEnabled] = useState(soundEnabled);
  return (
    <button
      className="startup-sound-choice"
      aria-pressed={enabled}
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        try {
          localStorage.setItem(SOUND_KEY, next ? "on" : "off");
        } catch {}
        window.dispatchEvent(new Event(EVENT));
        if (next) chime();
      }}
    >
      {enabled ? <Volume2 size={15} /> : <VolumeX size={15} />} Startup sound:{" "}
      {enabled ? "on" : "off"}
    </button>
  );
}
export function StartupExperience() {
  const [show, setShow] = useState(() => {
    if (Capacitor.isNativePlatform()) return true;
    try {
      return sessionStorage.getItem("toolinger-intro-seen") !== "yes";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem("toolinger-intro-seen", "yes");
    } catch {}
    const timer = setTimeout(
      () => setShow(false),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 400 : 1100,
    );
    let played = false;
    const play = (event: Event) => {
      if ((event.target as HTMLElement)?.closest?.(".startup-sound-choice"))
        return;
      if (!played && soundEnabled()) {
        played = true;
        chime();
      }
    };
    const update = () => {
      played = true;
    };
    window.addEventListener("pointerdown", play);
    window.addEventListener("keydown", play);
    window.addEventListener(EVENT, update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("keydown", play);
      window.removeEventListener(EVENT, update);
    };
  }, []);
  if (!show) return null;
  return (
    <div className="startup-intro" aria-hidden="true">
      <div className="startup-brand">
        <div className="startup-logo-orbit" />
        <img
          src={`${import.meta.env.BASE_URL}app-icons/toolinger-192.png`}
          alt=""
        />
        <strong>
          toolinger<span>.</span>
        </strong>
        <small>A little easier, every day.</small>
      </div>
    </div>
  );
}
