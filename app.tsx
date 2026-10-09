import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  useContext,
} from "react";
import { validatePhoto } from "./src/background-removal.mjs";
import { localCutout } from "./src/local-cutout.mjs";
import type { PDFDocument } from "pdf-lib";

import { useCommunity, UsageChoice, ReportTool } from "./src/community";
import { saveDownload } from "./src/download";
import { ToolIcon } from "./src/tool-icons";
import { LEGAL_CONTENT } from "./src/policies";
import {
  parsePageSelection,
  securePassword,
  portraitLayout,
  sheetLayout,
} from "./src/tool-utils.mjs";

import {
  TOOL_LIST,
  CATEGORY_LABELS,
  type CategoryId,
  type ToolConfig,
} from "./src/catalog";
import { LifestyleTool, DailyHub, MySpace } from "./src/lifestyle";
import { useRoute, navigate, routeHref, assetUrl } from "./src/router";
import { GUIDES } from "./src/guides";
import { ConsentControls, AdPlacement } from "./src/advertising";
const UNIT_OPTIONS: Record<
  string,
  {
    units: string[];
    toBase: (value: number, unit: string) => number;
    fromBase: (value: number, unit: string) => number;
  }
> = {
  length: {
    units: ["meter", "kilometer", "centimeter", "mile", "foot", "inch"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        meter: 1,
        kilometer: 1000,
        centimeter: 0.01,
        mile: 1609.344,
        foot: 0.3048,
        inch: 0.0254,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        meter: 1,
        kilometer: 0.001,
        centimeter: 100,
        mile: 0.000621371,
        foot: 3.28084,
        inch: 39.3701,
      };
      return value * map[unit];
    },
  },
  weight: {
    units: ["kilogram", "gram", "pound", "ounce"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        kilogram: 1,
        gram: 0.001,
        pound: 0.453592,
        ounce: 0.0283495,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        kilogram: 1,
        gram: 1000,
        pound: 2.20462,
        ounce: 35.274,
      };
      return value * map[unit];
    },
  },
  temperature: {
    units: ["celsius", "fahrenheit", "kelvin"],
    toBase: (value, unit) => {
      if (unit === "celsius") return value;
      if (unit === "fahrenheit") return ((value - 32) * 5) / 9;
      return value - 273.15;
    },
    fromBase: (value, unit) => {
      if (unit === "celsius") return value;
      if (unit === "fahrenheit") return (value * 9) / 5 + 32;
      return value + 273.15;
    },
  },
  area: {
    units: ["sq-meter", "sq-kilometer", "sq-foot", "acre"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        "sq-meter": 1,
        "sq-kilometer": 1_000_000,
        "sq-foot": 0.092903,
        acre: 4046.86,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        "sq-meter": 1,
        "sq-kilometer": 0.000001,
        "sq-foot": 10.7639,
        acre: 0.000247105,
      };
      return value * map[unit];
    },
  },
  volume: {
    units: ["liter", "milliliter", "cubic-meter", "gallon"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        liter: 1,
        milliliter: 0.001,
        "cubic-meter": 1000,
        gallon: 3.78541,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        liter: 1,
        milliliter: 1000,
        "cubic-meter": 0.001,
        gallon: 0.264172,
      };
      return value * map[unit];
    },
  },
  speed: {
    units: ["mps", "kph", "mph"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        mps: 1,
        kph: 0.277778,
        mph: 0.44704,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { mps: 1, kph: 3.6, mph: 2.23694 };
      return value * map[unit];
    },
  },
  storage: {
    units: ["byte", "kb", "mb", "gb", "tb"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        byte: 1,
        kb: 1024,
        mb: 1024 ** 2,
        gb: 1024 ** 3,
        tb: 1024 ** 4,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        byte: 1,
        kb: 1 / 1024,
        mb: 1 / 1024 ** 2,
        gb: 1 / 1024 ** 3,
        tb: 1 / 1024 ** 4,
      };
      return value * map[unit];
    },
  },
  time: {
    units: ["second", "minute", "hour", "day"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        second: 1,
        minute: 60,
        hour: 3600,
        day: 86400,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        second: 1,
        minute: 1 / 60,
        hour: 1 / 3600,
        day: 1 / 86400,
      };
      return value * map[unit];
    },
  },
  energy: {
    units: ["joule", "kilojoule", "calorie", "kwh"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        joule: 1,
        kilojoule: 1000,
        calorie: 4.184,
        kwh: 3_600_000,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        joule: 1,
        kilojoule: 0.001,
        calorie: 0.239006,
        kwh: 1 / 3_600_000,
      };
      return value * map[unit];
    },
  },
  pressure: {
    units: ["pascal", "bar", "psi", "atm"],
    toBase: (value, unit) => {
      const map: Record<string, number> = {
        pascal: 1,
        bar: 100000,
        psi: 6894.76,
        atm: 101325,
      };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = {
        pascal: 1,
        bar: 0.00001,
        psi: 0.000145038,
        atm: 0.00000986923,
      };
      return value * map[unit];
    },
  },
};

const UNIT_LABELS: Record<string, string> = {
  meter: "Meters",
  kilometer: "Kilometers",
  centimeter: "Centimeters",
  mile: "Miles",
  foot: "Feet",
  inch: "Inches",
  kilogram: "Kilograms",
  gram: "Grams",
  pound: "Pounds",
  ounce: "Ounces",
  celsius: "Celsius",
  fahrenheit: "Fahrenheit",
  kelvin: "Kelvin",
  "sq-meter": "Square Meters",
  "sq-kilometer": "Square Kilometers",
  "sq-foot": "Square Feet",
  acre: "Acres",
  liter: "Liters",
  milliliter: "Milliliters",
  "cubic-meter": "Cubic Meters",
  gallon: "Gallons",
  mps: "Meters/Second",
  kph: "Kilometers/Hour",
  mph: "Miles/Hour",
  byte: "Bytes",
  kb: "KB",
  mb: "MB",
  gb: "GB",
  tb: "TB",
  second: "Seconds",
  minute: "Minutes",
  hour: "Hours",
  day: "Days",
  joule: "Joules",
  kilojoule: "Kilojoules",
  calorie: "Calories",
  kwh: "kWh",
  pascal: "Pascals",
  bar: "Bar",
  psi: "PSI",
  atm: "Atmospheres",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm text-slate-900 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-200";

const primaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const secondaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700";

const glassPanel =
  "rounded-2xl border border-white/70 bg-white/75 p-4 shadow-xl shadow-indigo-100 backdrop-blur";

const resultBox =
  "rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700";

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toSentenceCase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const formatNumber = (value: number) =>
  Number.isFinite(value)
    ? Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(value)
    : "-";

const rgbaToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const downloadBlob = saveDownload;

const readAsArrayBuffer = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsArrayBuffer(blob);
  });

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = source;
  });

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const output = new Uint8Array(bytes.byteLength);
  output.set(bytes);
  return output.buffer;
};

const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // fall through to legacy copy
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Select the result and copy it manually.");
};

const generateUuid = () => {
  const cryptoObj = globalThis.crypto as Crypto | undefined;

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const randomPassword = (
  length: number,
  upper: boolean,
  lower: boolean,
  numbers: boolean,
  symbols: boolean,
) =>
  securePassword(
    length,
    [
      upper && "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lower && "abcdefghijklmnopqrstuvwxyz",
      numbers && "0123456789",
      symbols && "!@#$%^&*()-_=+[]{};:,.?/",
    ].filter(Boolean),
  );

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas export failed"));
      },
      type,
      quality,
    );
  });

const drawImageToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
  const src = await readAsDataUrl(file);
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas not supported");
  context.drawImage(image, 0, 0);
  return canvas;
};

const drawImageCover = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) / 2;
  context.drawImage(image, dx, dy, drawWidth, drawHeight);
};

const embedImageInPdf = async (pdf: PDFDocument, file: File) => {
  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    const bytes = await readAsArrayBuffer(file);
    return pdf.embedJpg(bytes);
  }

  if (file.type === "image/png") {
    const bytes = await readAsArrayBuffer(file);
    return pdf.embedPng(bytes);
  }

  const canvas = await drawImageToCanvas(file);
  const blob = await canvasToBlob(canvas, "image/png", 1);
  const bytes = await readAsArrayBuffer(blob);
  return pdf.embedPng(bytes);
};

function ToolPanel({ children }: { children: React.ReactNode }) {
  return <div className={`${glassPanel} tool-panel space-y-4`}>{children}</div>;
}

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (!text.trim()) return null;

  return (
    <button
      type="button"
      className={secondaryBtn}
      onClick={async () => {
        try {
          await copyToClipboard(text);
          setCopyError(false);
        } catch {
          setCopyError(true);
          return;
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copyError ? "Select text to copy" : copied ? "Copied" : label}
    </button>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`block text-sm font-medium text-slate-700 ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className="mt-1">
        {React.Children.map(children, (child) =>
          React.isValidElement(child) &&
          typeof child.type === "string" &&
          ["input", "textarea", "select"].includes(child.type)
            ? React.cloneElement(child as React.ReactElement<{ id?: string }>, {
                id,
              })
            : child,
        )}
      </div>
    </div>
  );
}

const SampleContext = React.createContext("");

function TextTransformTool({ mode }: { mode: string }) {
  const [input, setInput] = useState(useContext(SampleContext));
  const [output, setOutput] = useState("");

  const runTool = async () => {
    if (mode === "txt-download") {
      if (!input.trim()) {
        setOutput("Please enter text to download.");
        return;
      }
      downloadBlob(
        new Blob([input], { type: "text/plain;charset=utf-8" }),
        "toolinger-note.txt",
      );
      setOutput("TXT downloaded.");
      return;
    }

    if (mode === "lorem") {
      const paragraph =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sit amet posuere lacus. Sed sagittis, est non porttitor pulvinar, neque justo dapibus mauris. Vivamus at sapien non velit tincidunt pretium. Curabitur pretium, nisl eget pulvinar gravida, nunc ipsum varius justo, id euismod elit quam.";
      setOutput(Array.from({ length: 4 }, () => paragraph).join("\n\n"));
      return;
    }

    if (!input) {
      setOutput("Please enter some text.");
      return;
    }

    switch (mode) {
      case "case":
        setOutput(
          [
            `UPPERCASE:\n${input.toUpperCase()}`,
            `lowercase:\n${input.toLowerCase()}`,
            `Title Case:\n${toTitleCase(input)}`,
            `Sentence case:\n${toSentenceCase(input)}`,
          ].join("\n\n"),
        );
        break;
      case "spaces":
        setOutput(input.replace(/\s+/g, " ").trim());
        break;
      case "reverse":
        setOutput(
          [
            `Characters:\n${Array.from(input).reverse().join("")}`,
            `Lines:\n${input.split("\n").reverse().join("\n")}`,
          ].join("\n\n"),
        );
        break;
      case "slug":
        setOutput(
          input
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-"),
        );
        break;
      case "clean":
        setOutput(
          input
            .replace(/[^\w\s.,!?@#%&*()\-:+/\\]/g, "")
            .replace(/\s+/g, " ")
            .trim(),
        );
        break;
      case "binary": {
        const trimmed = input.trim();
        const maybeBinary = /^[01\s]+$/.test(trimmed);
        if (maybeBinary) {
          const bytes = trimmed.split(/\s+/);
          if (bytes.some((byte) => byte.length !== 8)) {
            setOutput("Use eight-bit bytes separated by spaces.");
            break;
          }
          try {
            setOutput(
              new TextDecoder("utf-8", { fatal: true }).decode(
                Uint8Array.from(bytes, (byte) => parseInt(byte, 2)),
              ),
            );
          } catch {
            setOutput("These bytes are not valid UTF-8 text.");
          }
        } else {
          setOutput(
            Array.from(new TextEncoder().encode(input), (byte) =>
              byte.toString(2).padStart(8, "0"),
            ).join(" "),
          );
        }
        break;
      }
      case "html-format":
      case "css-format":
      case "js-format": {
        try {
          const prettier = await import("prettier/standalone");
          const parser =
            mode === "html-format"
              ? "html"
              : mode === "css-format"
                ? "css"
                : "babel";
          const plugin =
            parser === "html"
              ? await import("prettier/plugins/html")
              : parser === "css"
                ? await import("prettier/plugins/postcss")
                : await import("prettier/plugins/babel");
          const estree =
            parser === "babel" ? await import("prettier/plugins/estree") : null;
          setOutput(
            await prettier.format(input, {
              parser,
              plugins: estree ? [plugin, estree] : [plugin],
            }),
          );
        } catch {
          setOutput("Could not format this code. Check its syntax.");
        }
        break;
      }
      default:
        setOutput(input);
    }
  };

  const downloadTxt = () => {
    if (!input.trim()) return;
    downloadBlob(
      new Blob([input], { type: "text/plain;charset=utf-8" }),
      "toolinger-note.txt",
    );
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Enter text"
        className={`${inputClass} min-h-40`}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryBtn} onClick={runTool}>
          Run Tool
        </button>
        <CopyButton text={output} label="Copy Result" />
        {input ? (
          <button type="button" className={secondaryBtn} onClick={downloadTxt}>
            Download TXT
          </button>
        ) : null}
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => {
            setInput("");
            setOutput("");
          }}
        >
          Clear
        </button>
      </div>
      <textarea
        value={output}
        aria-label="Result"
        readOnly
        className={`${inputClass} min-h-40`}
        placeholder="Result"
      />
    </ToolPanel>
  );
}

function TextAnalysisTool({ mode }: { mode: string }) {
  const [text, setText] = useState(useContext(SampleContext));

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const lines = text ? text.split("\n").length : 0;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
    const sentenceCount = text
      .split(/[.!?]+/)
      .filter((value) => value.trim()).length;
    return { words, chars, charsNoSpaces, lines, paragraphs, sentenceCount };
  }, [text]);

  const readingTime = Math.ceil(stats.words / 220);

  const summary = [
    `Words: ${stats.words}`,
    `Characters: ${stats.chars}`,
    `Characters (no spaces): ${stats.charsNoSpaces}`,
    `Lines: ${stats.lines}`,
    `Paragraphs: ${stats.paragraphs}`,
    `Sentences: ${stats.sentenceCount}`,
    `Reading Time: ${readingTime} min`,
  ].join("\n");

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className={`${inputClass} min-h-44`}
        placeholder="Paste text"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {(mode === "words" ||
          mode === "characters" ||
          mode === "lines" ||
          mode === "sentences" ||
          mode === "reading") && (
          <>
            <div className={resultBox}>Words: {stats.words}</div>
            <div className={resultBox}>Characters: {stats.chars}</div>
            <div className={resultBox}>
              Characters (no spaces): {stats.charsNoSpaces}
            </div>
            <div className={resultBox}>Lines: {stats.lines}</div>
            <div className={resultBox}>Paragraphs: {stats.paragraphs}</div>
            <div className={resultBox}>Sentences: {stats.sentenceCount}</div>
            <div className={resultBox}>Reading Time: {readingTime} min</div>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={summary} label="Copy Stats" />
      </div>
    </ToolPanel>
  );
}

function TextLinesTool({ mode }: { mode: string }) {
  const [input, setInput] = useState(useContext(SampleContext));
  const [output, setOutput] = useState("");

  const process = () => {
    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      setOutput("Add one or more lines first.");
      return;
    }

    if (mode === "unique") {
      setOutput(Array.from(new Set(lines)).join("\n"));
      return;
    }

    if (mode === "sort") {
      setOutput([...lines].sort((a, b) => a.localeCompare(b)).join("\n"));
      return;
    }

    const selected = lines[Math.floor(Math.random() * lines.length)] ?? "";
    setOutput(selected);
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        className={`${inputClass} min-h-40`}
        placeholder="One item per line"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryBtn} onClick={process}>
          Run Tool
        </button>
        <CopyButton text={output} label="Copy Result" />
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => {
            setInput("");
            setOutput("");
          }}
        >
          Clear
        </button>
      </div>
      <textarea
        value={output}
        aria-label="Result"
        readOnly
        className={`${inputClass} min-h-32`}
        placeholder="Result"
      />
    </ToolPanel>
  );
}

function FindReplaceTool() {
  const [text, setText] = useState(useContext(SampleContext));
  const [find, setFind] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [result, setResult] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);

  const run = () => {
    if (!find) {
      setResult("Please enter text to find.");
      return;
    }
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = caseSensitive ? "g" : "gi";
    setResult(text.replace(new RegExp(escaped, flags), replaceWith));
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-36`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Original text"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={inputClass}
          value={find}
          onChange={(event) => setFind(event.target.value)}
          placeholder="Find"
        />
        <input
          className={inputClass}
          value={replaceWith}
          onChange={(event) => setReplaceWith(event.target.value)}
          placeholder="Replace with"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(event) => setCaseSensitive(event.target.checked)}
          className="h-5 w-5 accent-violet-600"
        />
        Case sensitive
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Replace All
        </button>
        <CopyButton text={result} label="Copy Result" />
      </div>
      <textarea
        className={`${inputClass} min-h-36`}
        value={result}
        aria-label="Result"
        readOnly
        placeholder="Result"
      />
    </ToolPanel>
  );
}

function MarkdownPreviewTool() {
  const [text, setText] = useState("# Toolinger\n\nWrite markdown here.");

  const preview = useMemo(() => {
    const escaped = escapeHtml(text);
    return escaped
      .replace(
        /^###\s(.+)$/gm,
        '<h3 class="mt-4 text-xl font-bold text-slate-900">$1</h3>',
      )
      .replace(
        /^##\s(.+)$/gm,
        '<h2 class="mt-5 text-2xl font-bold text-slate-900">$1</h2>',
      )
      .replace(
        /^#\s(.+)$/gm,
        '<h1 class="mt-6 text-3xl font-extrabold text-slate-900">$1</h1>',
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(
        /`(.+?)`/g,
        '<code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85rem]">$1</code>',
      )
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) =>
        /^(https?:\/\/|mailto:|#)/i.test(url)
          ? `<a href="${url}" target="_blank" rel="noreferrer" class="font-medium text-violet-700 underline">${label}</a>`
          : label,
      )
      .replace(/\n/g, "<br />");
  }, [text]);

  return (
    <ToolPanel>
      <div className="grid gap-3 md:grid-cols-2">
        <textarea
          aria-label="Input text"
          className={`${inputClass} min-h-48`}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div
          className={`${inputClass} min-h-48 overflow-auto`}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy Markdown" />
      </div>
    </ToolPanel>
  );
}

function JsonTool({ mode }: { mode: string }) {
  const [input, setInput] = useState(
    useContext(SampleContext) || '{"tool":"toolinger"}',
  );
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const run = () => {
    try {
      const parsed = JSON.parse(input);
      if (mode === "format") {
        setResult(JSON.stringify(parsed, null, 2));
      } else {
        setResult("Valid JSON");
      }
      setError("");
    } catch (err) {
      setResult("Invalid JSON");
      setError((err as Error).message);
    }
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-44`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Run Tool
        </button>
        <CopyButton text={result} label="Copy Result" />
      </div>
      {error ? (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <textarea
        className={`${inputClass} min-h-32`}
        value={result}
        aria-label="Result"
        readOnly
      />
    </ToolPanel>
  );
}

function Base64Tool({ mode }: { mode: string }) {
  const [input, setInput] = useState(useContext(SampleContext));
  const [result, setResult] = useState("");

  const run = () => {
    try {
      if (mode === "encode") {
        const bytes = new TextEncoder().encode(input);
        const binString = Array.from(bytes, (byte) =>
          String.fromCharCode(byte),
        ).join("");
        setResult(btoa(binString));
      } else {
        const binString = atob(input.trim());
        const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
        setResult(new TextDecoder().decode(bytes));
      }
    } catch {
      setResult("Invalid input for this operation.");
    }
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-40`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Enter text"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Run Tool
        </button>
        <CopyButton text={result} label="Copy Result" />
      </div>
      <textarea
        className={`${inputClass} min-h-40`}
        value={result}
        aria-label="Result"
        readOnly
        placeholder="Result"
      />
    </ToolPanel>
  );
}

function UrlTool({ mode }: { mode: string }) {
  const [input, setInput] = useState(useContext(SampleContext));
  const [result, setResult] = useState("");

  const run = () => {
    try {
      setResult(
        mode === "encode"
          ? encodeURIComponent(input)
          : decodeURIComponent(input),
      );
    } catch {
      setResult("Unable to decode this URL string.");
    }
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-36`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="URL text"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Run Tool
        </button>
        <CopyButton text={result} label="Copy Result" />
      </div>
      <textarea
        className={`${inputClass} min-h-36`}
        value={result}
        aria-label="Result"
        readOnly
      />
    </ToolPanel>
  );
}

function UuidTool() {
  const [countRaw, setCountRaw] = useState("5");
  const [result, setResult] = useState("");

  const generate = () => {
    const count = clamp(Math.floor(Number(countRaw) || 5), 1, 100);
    setResult(Array.from({ length: count }, () => generateUuid()).join("\n"));
  };

  return (
    <ToolPanel>
      <Field label="How many UUIDs? (1-100)">
        <input
          type="number"
          min={1}
          max={100}
          className={inputClass}
          value={countRaw}
          onChange={(event) => setCountRaw(event.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={generate} className={primaryBtn}>
          Generate UUIDs
        </button>
        <CopyButton text={result} label="Copy UUIDs" />
      </div>
      <textarea
        className={`${inputClass} min-h-44`}
        aria-label="Result"
        readOnly
        value={result}
      />
    </ToolPanel>
  );
}

function PasswordTool() {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [result, setResult] = useState("");

  const generate = () => {
    const safeLength = clamp(length, 8, 64);
    if (
      ![includeUpper, includeLower, includeNumbers, includeSymbols].some(
        Boolean,
      )
    )
      return;
    setResult(
      randomPassword(
        safeLength,
        includeUpper,
        includeLower,
        includeNumbers,
        includeSymbols,
      ),
    );
  };

  const enabledTypes = [
    includeUpper,
    includeLower,
    includeNumbers,
    includeSymbols,
  ].filter(Boolean).length;
  const strength =
    length >= 16 && enabledTypes === 4
      ? "Strong"
      : length >= 12 && enabledTypes >= 3
        ? "Good"
        : length >= 10 && enabledTypes >= 2
          ? "Fair"
          : "Weak";

  return (
    <ToolPanel>
      <Field label="Length">
        <input
          className={inputClass}
          min={8}
          max={64}
          type="number"
          value={length}
          onChange={(event) =>
            setLength(clamp(Number(event.target.value), 8, 64))
          }
        />
      </Field>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeUpper}
            onChange={(event) => setIncludeUpper(event.target.checked)}
            className="h-5 w-5 accent-violet-600"
          />
          Uppercase (A-Z)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeLower}
            onChange={(event) => setIncludeLower(event.target.checked)}
            className="h-5 w-5 accent-violet-600"
          />
          Lowercase (a-z)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(event) => setIncludeNumbers(event.target.checked)}
            className="h-5 w-5 accent-violet-600"
          />
          Numbers (0-9)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeSymbols}
            onChange={(event) => setIncludeSymbols(event.target.checked)}
            className="h-5 w-5 accent-violet-600"
          />
          Symbols (!@#$)
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={generate} className={primaryBtn}>
          Generate Password
        </button>
        <CopyButton text={result} label="Copy Password" />
      </div>
      <input
        className={inputClass}
        value={result}
        aria-label="Result"
        readOnly
        placeholder="Password"
      />
      <div className={resultBox}>Strength: {strength}</div>
      {!enabledTypes ? (
        <p role="alert">Choose at least one character type.</p>
      ) : null}
    </ToolPanel>
  );
}

function HashTool() {
  const [input, setInput] = useState(useContext(SampleContext));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA-256");

  const generate = async () => {
    if (!input) {
      setResult("");
      setError("Please enter text.");
      return;
    }

    const subtle = (window.crypto as Crypto | undefined)?.subtle;
    if (!subtle) {
      setResult("");
      setError(
        "Web Crypto is unavailable. Use HTTPS or localhost for SHA hashing.",
      );
      return;
    }

    try {
      const buffer = new TextEncoder().encode(input);
      const hash = await subtle.digest(algorithm, buffer);
      const view = Array.from(new Uint8Array(hash));
      setResult(
        view.map((value) => value.toString(16).padStart(2, "0")).join(""),
      );
      setError("");
    } catch {
      setResult("");
      setError("Unable to generate hash.");
    }
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-32`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Text to hash"
      />
      <select
        className={inputClass}
        aria-label="Hash algorithm"
        value={algorithm}
        onChange={(event) => setAlgorithm(event.target.value)}
      >
        <option>SHA-256</option>
        <option>SHA-384</option>
        <option>SHA-512</option>
      </select>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={generate} className={primaryBtn}>
          Generate Hash
        </button>
        <CopyButton text={result} label="Copy Hash" />
      </div>
      {error ? (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      ) : null}
      <textarea
        className={`${inputClass} min-h-32`}
        value={result}
        aria-label="Result"
        readOnly
      />
    </ToolPanel>
  );
}

function TimestampTool() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [timestamp, setTimestamp] = useState(() =>
    Math.floor(Date.now() / 1000).toString(),
  );

  const safeDate = new Date(date);
  const timestampFromDate = Number.isNaN(safeDate.getTime())
    ? ""
    : Math.floor(safeDate.getTime() / 1000);
  const safeTimestamp = Number(timestamp);
  const dateFromTimestamp = Number.isNaN(safeTimestamp)
    ? "Invalid timestamp"
    : new Date(safeTimestamp * 1000).toString();

  return (
    <ToolPanel>
      <Field label="Date and Time">
        <input
          type="datetime-local"
          className={inputClass}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </Field>
      <div className={resultBox}>
        Unix Timestamp:{" "}
        {timestampFromDate !== "" ? timestampFromDate : "Enter a valid date"}
      </div>
      <Field label="Unix Timestamp (seconds)">
        <input
          className={inputClass}
          value={timestamp}
          onChange={(event) => setTimestamp(event.target.value)}
        />
      </Field>
      <div className={resultBox}>Date: {dateFromTimestamp}</div>
    </ToolPanel>
  );
}

function RegexTool() {
  const [pattern, setPattern] = useState("\\btool\\w*");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState(
    "Toolinger offers tool access in one place.",
  );
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const run = () => {
    try {
      const regex = new RegExp(pattern, flags);
      const found = regex.global
        ? Array.from(text.matchAll(regex))
        : [regex.exec(text)].filter((match): match is RegExpExecArray =>
            Boolean(match),
          );
      const matches = found.map(
        (match, index) =>
          `${index + 1}. ${JSON.stringify(match[0])} @ index ${match.index}`,
      );
      setResult(matches.length ? matches.join("\n") : "No match found.");
      setError("");
    } catch {
      setResult("");
      setError("Invalid regex pattern or flags.");
    }
  };

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={inputClass}
          aria-label="Pattern"
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          placeholder="Pattern"
        />
        <input
          className={inputClass}
          aria-label="Flags"
          value={flags}
          onChange={(event) => setFlags(event.target.value)}
          placeholder="Flags"
        />
      </div>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-32`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Test text"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Test Regex
        </button>
        <CopyButton text={result} label="Copy Matches" />
      </div>
      {error ? (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <textarea
        className={`${inputClass} min-h-32`}
        aria-label="Result"
        readOnly
        value={result}
      />
    </ToolPanel>
  );
}

function ColorTool() {
  const [hex, setHex] = useState("#5B4BFF");
  const [rgb, setRgb] = useState("91,75,255");
  const [message, setMessage] = useState("");

  const hexToRgb = () => {
    const cleaned = hex.replace("#", "");
    if (!/^[A-Fa-f0-9]{6}$/.test(cleaned)) {
      setMessage("Enter a valid 6-digit HEX value.");
      return;
    }
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    setRgb(`${r},${g},${b}`);
    setMessage("Converted HEX to RGB.");
  };

  const rgbToHex = () => {
    const parts = rgb.split(",").map((value) => Number(value.trim()));
    if (
      parts.length !== 3 ||
      parts.some((value) => Number.isNaN(value) || value < 0 || value > 255)
    ) {
      setMessage("Use RGB format: 0-255,0-255,0-255");
      return;
    }
    setHex(rgbaToHex(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0));
    setMessage("Converted RGB to HEX.");
  };

  const colorInputValue = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#5B4BFF";

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="HEX">
          <input
            className={inputClass}
            value={hex}
            onChange={(event) => setHex(event.target.value)}
          />
        </Field>
        <Field label="RGB">
          <input
            className={inputClass}
            value={rgb}
            onChange={(event) => setRgb(event.target.value)}
          />
        </Field>
        <Field label="Picker">
          <input
            type="color"
            className={`${inputClass} h-11`}
            value={colorInputValue}
            onChange={(event) => {
              setHex(event.target.value.toUpperCase());
              setMessage("Color selected.");
            }}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryBtn} onClick={hexToRgb}>
          HEX to RGB
        </button>
        <button type="button" className={secondaryBtn} onClick={rgbToHex}>
          RGB to HEX
        </button>
        <CopyButton text={hex} label="Copy HEX" />
        <CopyButton text={rgb} label="Copy RGB" />
      </div>
      <div className={resultBox}>
        {message || "Pick a color or convert values."}
      </div>
      <div
        className="h-16 rounded-xl border border-white/70"
        style={{ background: hex }}
      />
    </ToolPanel>
  );
}

function SimpleCalculatorTool({ mode }: { mode: string }) {
  const [values, setValues] = useState<Record<string, string>>({
    a: "",
    b: "",
    c: "",
    d: "",
  });
  const [nonce, setNonce] = useState(0);

  const isRandom = mode === "random-number";

  const result = useMemo(() => {
    const a = Number(values.a);
    const b = Number(values.b);
    const c = Number(values.c);
    const rand = Math.random();

    switch (mode) {
      case "emi": {
        if (a <= 0 || c <= 0 || !Number.isFinite(b))
          return "Enter principal, annual interest %, and tenure months.";
        const r = b / 1200;
        const payment =
          r === 0 ? a / c : (a * r * (1 + r) ** c) / ((1 + r) ** c - 1);
        return `Monthly EMI: ${formatNumber(payment)}`;
      }
      case "simple-interest":
        return a > 0 && c > 0 && Number.isFinite(b)
          ? `Interest: ${formatNumber((a * b * c) / 100)}`
          : "Enter principal, rate %, and years.";
      case "compound-interest":
        return a > 0 && c > 0 && Number.isFinite(b)
          ? `Future Value: ${formatNumber(a * (1 + b / 100) ** c)}`
          : "Enter principal, annual rate %, and years.";
      case "loan": {
        if (a <= 0 || c <= 0 || !Number.isFinite(b))
          return "Enter amount, annual rate %, and months.";
        const r = b / 1200;
        const emi =
          r === 0 ? a / c : (a * r * (1 + r) ** c) / ((1 + r) ** c - 1);
        return `EMI: ${formatNumber(emi)} | Total: ${formatNumber(emi * c)}`;
      }
      case "discount":
        return a > 0 && Number.isFinite(b)
          ? `Final Price: ${formatNumber(a - (a * b) / 100)} | Saved: ${formatNumber((a * b) / 100)}`
          : "Enter original price and discount %.";
      case "gst":
        return a > 0 && Number.isFinite(b)
          ? `Price with GST: ${formatNumber(a + (a * b) / 100)} | GST amount: ${formatNumber((a * b) / 100)}`
          : "Enter amount and GST %.";
      case "profit":
        return a > 0 && b > 0
          ? `Profit: ${formatNumber(b - a)} | Margin: ${formatNumber(((b - a) / b) * 100)}% | Markup: ${formatNumber(
              ((b - a) / a) * 100,
            )}%`
          : "Enter cost and selling price.";
      case "percentage": {
        if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(b))
          return "Enter base value and percentage.";
        const percentValue = (b / 100) * a;
        if (!Number.isFinite(c) || c === 0) {
          return `${formatNumber(percentValue)} is ${b}% of ${a}.`;
        }
        const change = (((c || 0) - a) / a) * 100;
        return `${formatNumber(percentValue)} is ${b}% of ${a}. Change from ${a} to ${c}: ${formatNumber(change)}%`;
      }
      case "random-number": {
        const min = Number.isFinite(a) ? Math.floor(a) : 0;
        const max = Number.isFinite(b) ? Math.floor(b) : 100;
        if (max < min) return "Max should be greater than or equal to min.";
        return `Random number: ${Math.floor(rand * (max - min + 1)) + min}`;
      }
      case "countdown": {
        const target = new Date(values.a).getTime();
        if (Number.isNaN(target)) return "Select a target date.";
        const days = Math.ceil((target - Date.now()) / 86_400_000);
        return days >= 0
          ? `${days} days remaining.`
          : `${Math.abs(days)} days passed.`;
      }
      case "age": {
        const birth = new Date(values.a);
        const now = new Date();
        if (Number.isNaN(birth.getTime())) return "Select date of birth.";
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && now.getDate() < birth.getDate())
        )
          age -= 1;
        const days = Math.floor((now.getTime() - birth.getTime()) / 86_400_000);
        return `Age: ${age} years (${formatNumber(days)} days)`;
      }
      case "tip": {
        if (a <= 0) return "Enter bill amount.";
        const percent = Number.isFinite(b) ? b : 10;
        const people = Math.max(1, Number.isFinite(c) ? c : 1);
        const tip = (a * percent) / 100;
        const total = a + tip;
        return `Tip: ${formatNumber(tip)} | Total: ${formatNumber(total)} | Per person: ${formatNumber(total / people)}`;
      }
      default:
        return "Provide values to calculate.";
    }
  }, [mode, values, nonce]);

  const labels: Record<string, [string, string, string, string]> = {
    emi: ["Principal", "Annual Interest %", "Tenure Months", ""],
    "simple-interest": ["Principal", "Rate %", "Years", ""],
    "compound-interest": ["Principal", "Rate %", "Years", ""],
    loan: ["Loan Amount", "Annual Interest %", "Months", ""],
    discount: ["Original Price", "Discount %", "", ""],
    gst: ["Amount", "GST %", "", ""],
    profit: ["Cost Price", "Selling Price", "", ""],
    percentage: ["Base Value", "Percent", "Compare Value (optional)", ""],
    "random-number": ["Min", "Max", "", ""],
    countdown: ["Target Date", "", "", ""],
    age: ["Birth Date", "", "", ""],
    tip: ["Bill Amount", "Tip %", "People", ""],
  };

  const fieldLabels = labels[mode] ?? [
    "Value A",
    "Value B",
    "Value C",
    "Value D",
  ];

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["a", "b", "c", "d"] as const).map((field, index) => {
          const label = fieldLabels[index] ?? "";
          if (!label) return null;
          const dateField = mode === "countdown" || mode === "age";
          return (
            <Field key={field} label={label}>
              <input
                type={index === 0 && dateField ? "date" : "number"}
                className={inputClass}
                value={values[field] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            </Field>
          );
        })}
      </div>
      {isRandom ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryBtn}
            onClick={() => setNonce((n) => n + 1)}
          >
            Generate Number
          </button>
        </div>
      ) : null}
      <div className={`${resultBox} break-words`}>{result}</div>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={result} label="Copy Result" />
      </div>
    </ToolPanel>
  );
}

function BmiTool() {
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("70");

  const summary = useMemo(() => {
    const heightM = Number(heightCm) / 100;
    const weight = Number(weightKg);
    if (heightM <= 0 || weight <= 0) return null;
    const bmi = weight / (heightM * heightM);
    let classification = "Normal Weight";
    if (bmi < 18.5) classification = "Underweight";
    else if (bmi >= 25 && bmi < 30) classification = "Overweight";
    else if (bmi >= 30) classification = "Obesity";

    const minHealthy = 18.5 * heightM * heightM;
    const maxHealthy = 24.9 * heightM * heightM;
    const delta =
      weight < minHealthy
        ? minHealthy - weight
        : weight > maxHealthy
          ? weight - maxHealthy
          : 0;

    return {
      bmi,
      classification,
      minHealthy,
      maxHealthy,
      delta,
      message:
        weight < minHealthy
          ? "Approximate weight to gain"
          : weight > maxHealthy
            ? "Approximate weight to lose"
            : "You are in the healthy range",
    };
  }, [heightCm, weightKg]);

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Height (cm)">
          <input
            className={inputClass}
            value={heightCm}
            onChange={(event) => setHeightCm(event.target.value)}
          />
        </Field>
        <Field label="Weight (kg)">
          <input
            className={inputClass}
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
          />
        </Field>
      </div>
      {summary ? (
        <div className="space-y-2">
          <div className={resultBox}>BMI: {formatNumber(summary.bmi)}</div>
          <div className={resultBox}>
            Classification: {summary.classification}
          </div>
          <div className={resultBox}>
            Healthy range: {formatNumber(summary.minHealthy)}kg -{" "}
            {formatNumber(summary.maxHealthy)}kg
          </div>
          <div className={resultBox}>
            {summary.message}:{" "}
            {summary.delta ? `${formatNumber(summary.delta)}kg` : "0kg"}
          </div>
        </div>
      ) : (
        <div className={resultBox}>Enter valid height and weight.</div>
      )}
      <p className="text-xs text-slate-600">
        Disclaimer: This calculator is for informational purposes and not a
        medical diagnosis.
      </p>
    </ToolPanel>
  );
}

function BmrTool() {
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("30");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("170");

  const bmr = useMemo(() => {
    const a = Number(age);
    const w = Number(weight);
    const h = Number(height);
    if (a <= 0 || w <= 0 || h <= 0) return null;
    return sex === "male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
  }, [sex, age, weight, height]);

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sex">
          <select
            className={inputClass}
            value={sex}
            onChange={(event) => setSex(event.target.value)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Age">
          <input
            className={inputClass}
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
        </Field>
        <Field label="Weight (kg)">
          <input
            className={inputClass}
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </Field>
        <Field label="Height (cm)">
          <input
            className={inputClass}
            value={height}
            onChange={(event) => setHeight(event.target.value)}
          />
        </Field>
      </div>
      <div className={resultBox}>
        BMR: {bmr ? `${formatNumber(bmr)} kcal/day` : "Enter valid values."}
      </div>
    </ToolPanel>
  );
}

function CalorieTool() {
  const [activity, setActivity] = useState(1.375);
  const [bmrValue, setBmrValue] = useState("1600");
  const tdee = Number(bmrValue) * activity;

  return (
    <ToolPanel>
      <Field label="BMR (kcal/day)">
        <input
          className={inputClass}
          value={bmrValue}
          onChange={(event) => setBmrValue(event.target.value)}
        />
      </Field>
      <Field label="Activity Level">
        <select
          className={inputClass}
          value={activity}
          onChange={(event) => setActivity(Number(event.target.value))}
        >
          <option value={1.2}>Sedentary</option>
          <option value={1.375}>Lightly Active</option>
          <option value={1.55}>Moderately Active</option>
          <option value={1.725}>Very Active</option>
        </select>
      </Field>
      <div className={resultBox}>
        Maintenance calories: {formatNumber(tdee)} kcal/day
      </div>
      <div className={resultBox}>
        Weight loss target: {formatNumber(tdee - 500)} kcal/day
      </div>
      <div className={resultBox}>
        Weight gain target: {formatNumber(tdee + 300)} kcal/day
      </div>
    </ToolPanel>
  );
}

function WaterTool() {
  const [weight, setWeight] = useState("70");
  const liters = (Number(weight) * 35) / 1000;
  return (
    <ToolPanel>
      <Field label="Weight (kg)">
        <input
          className={inputClass}
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      </Field>
      <div className={resultBox}>
        Suggested water intake: {formatNumber(liters)} liters/day
      </div>
    </ToolPanel>
  );
}

function BodyFatTool() {
  const [sex, setSex] = useState("male");
  const [waist, setWaist] = useState("80");
  const [neck, setNeck] = useState("38");
  const [height, setHeight] = useState("170");
  const [hip, setHip] = useState("95");

  const estimate = useMemo(() => {
    const w = Number(waist);
    const n = Number(neck);
    const h = Number(height);
    const hp = Number(hip);
    if (w <= 0 || n <= 0 || h <= 0) return null;
    if (sex === "male") {
      return (
        495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) -
        450
      );
    }
    if (hp <= 0) return null;
    return (
      495 /
        (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.221 * Math.log10(h)) -
      450
    );
  }, [sex, waist, neck, height, hip]);

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sex">
          <select
            className={inputClass}
            value={sex}
            onChange={(event) => setSex(event.target.value)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Waist (cm)">
          <input
            className={inputClass}
            value={waist}
            onChange={(event) => setWaist(event.target.value)}
          />
        </Field>
        <Field label="Neck (cm)">
          <input
            className={inputClass}
            value={neck}
            onChange={(event) => setNeck(event.target.value)}
          />
        </Field>
        <Field label="Height (cm)">
          <input
            className={inputClass}
            value={height}
            onChange={(event) => setHeight(event.target.value)}
          />
        </Field>
        {sex === "female" ? (
          <Field label="Hip (cm)" className="sm:col-span-2">
            <input
              className={inputClass}
              value={hip}
              onChange={(event) => setHip(event.target.value)}
            />
          </Field>
        ) : null}
      </div>
      <div className={resultBox}>
        Estimated Body Fat:{" "}
        {estimate ? `${formatNumber(estimate)}%` : "Enter valid measurements."}
      </div>
      <p className="text-xs text-slate-600">
        Disclaimer: Informational estimate only.
      </p>
    </ToolPanel>
  );
}

function UnitTool({ mode }: { mode: string }) {
  const config = UNIT_OPTIONS[mode] ?? UNIT_OPTIONS.length;
  const [fromUnit, setFromUnit] = useState(config.units[0]);
  const [toUnit, setToUnit] = useState(config.units[1] ?? config.units[0]);
  const [value, setValue] = useState("1");

  const output = useMemo(() => {
    const number = Number(value);
    if (Number.isNaN(number)) return "Enter a valid number.";
    const base = config.toBase(number, fromUnit);
    return formatNumber(config.fromBase(base, toUnit));
  }, [config, fromUnit, toUnit, value]);

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Value">
          <input
            className={inputClass}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <Field label="From">
          <select
            className={inputClass}
            value={fromUnit}
            onChange={(event) => setFromUnit(event.target.value)}
          >
            {config.units.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit] ?? unit}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select
            className={inputClass}
            value={toUnit}
            onChange={(event) => setToUnit(event.target.value)}
          >
            {config.units.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit] ?? unit}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryBtn} onClick={swap}>
          Swap Units
        </button>
        <CopyButton text={output} label="Copy Result" />
      </div>
      <div className={resultBox}>Result: {output}</div>
    </ToolPanel>
  );
}

function QrTool() {
  const [text, setText] = useState("https://tools.choicematrix.in/");
  const [sizeRaw, setSizeRaw] = useState("600");
  const [qrSrc, setQrSrc] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    if (!text.trim()) {
      setError("Please enter text or URL.");
      return;
    }
    try {
      const size = clamp(Math.floor(Number(sizeRaw) || 600), 128, 1024);
      const { default: QRCode } = await import("qrcode");
      const url = await QRCode.toDataURL(text.trim(), {
        width: size,
        margin: 1,
        color: { dark: "#1E1B4B", light: "#FFFFFF" },
      });
      setQrSrc(url);
      setError("");
    } catch {
      setError("Unable to generate QR code.");
    }
  };

  return (
    <ToolPanel>
      <Field label="URL or text">
        <input
          className={inputClass}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="URL or text"
        />
      </Field>
      <Field label="Size (128-1024)">
        <input
          className={inputClass}
          value={sizeRaw}
          onChange={(event) => setSizeRaw(event.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryBtn} onClick={generate}>
          Generate QR
        </button>
      </div>
      {error ? (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {qrSrc ? (
        <div className="space-y-3">
          <img
            src={qrSrc}
            alt="Generated QR code"
            className="mx-auto w-full max-w-56 rounded-xl bg-white p-2"
          />
          <button
            type="button"
            className={secondaryBtn}
            onClick={async () => {
              const response = await fetch(qrSrc);
              const blob = await response.blob();
              downloadBlob(blob, "toolinger-qr.png");
            }}
          >
            Download PNG
          </button>
        </div>
      ) : null}
    </ToolPanel>
  );
}

function CoinTool() {
  const [isFlipping, setIsFlipping] = useState(false);
  const [landing, setLanding] = useState("Heads");
  const [result, setResult] = useState("Heads");
  const [sound, setSound] = useState(true);

  const playFlipSound = () => {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;

      const context = new Ctor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(650, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        170,
        context.currentTime + 0.35,
      );

      gain.gain.setValueAtTime(0.2, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.35,
      );

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);

      window.setTimeout(() => {
        context.close?.();
      }, 500);
    } catch {
      // ignore audio errors
    }
  };

  const flip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    if (sound) playFlipSound();
    const next = Math.random() > 0.5 ? "Heads" : "Tails";
    setLanding(next);
    window.setTimeout(() => {
      setResult(next);
      setIsFlipping(false);
    }, 1400);
  };

  return (
    <ToolPanel>
      <label className="flex items-center justify-between text-sm font-medium text-slate-700">
        Coin sound
        <input
          type="checkbox"
          checked={sound}
          onChange={(event) => setSound(event.target.checked)}
          className="h-5 w-5 accent-violet-600"
        />
      </label>
      <div className="coin-zone">
        <div
          className={`coin ${landing === "Tails" ? "coin-tails" : "coin-heads"} ${isFlipping ? "coin-flipping" : ""}`}
          aria-label={isFlipping ? "Coin is flipping" : landing}
        >
          <div className="coin-face coin-head">H</div>
          <div className="coin-face coin-tail">T</div>
        </div>
      </div>
      <button type="button" onClick={flip} className={primaryBtn}>
        Flip Coin
      </button>
      <div className={resultBox}>Result: {result}</div>
    </ToolPanel>
  );
}

function NotepadTool() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem("toolinger-notepad") ?? "";
    } catch {
      return "";
    }
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("toolinger-notepad", text);
    } catch {
      // ignore storage errors
    }
  }, [text]);

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    return { words, chars };
  }, [text]);

  const exportPdf = async () => {
    if (!text.trim()) {
      setStatus("Nothing to export.");
      return;
    }

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      let page = pdf.addPage([595, 842]);
      let y = 800;

      for (const line of text.split("\n")) {
        for (let i = 0; i < line.length; i += 95) {
          if (y < 40) {
            page = pdf.addPage([595, 842]);
            y = 800;
          }
          page.drawText(line.slice(i, i + 95), {
            x: 40,
            y,
            size: 11,
            font,
            color: rgb(0.1, 0.1, 0.2),
          });
          y -= 14;
        }
      }

      const bytes = await pdf.save();
      downloadBlob(
        new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
        "toolinger-notepad.pdf",
      );
      setStatus("PDF exported.");
    } catch {
      setStatus("Unable to export PDF.");
    }
  };

  const printNote = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      setStatus("Popup blocked. Enable popups to print.");
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Toolinger Note</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; white-space: pre-wrap; }
            @media print { body { margin: 24px; } }
          </style>
        </head>
        <body>${escapeHtml(text)}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 350);
    setStatus("Print window opened.");
  };

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-64`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write notes here"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={resultBox}>Words: {stats.words}</div>
        <div className={resultBox}>Characters: {stats.chars}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryBtn}
          onClick={() => {
            downloadBlob(
              new Blob([text], { type: "text/plain" }),
              "toolinger-note.txt",
            );
            setStatus("TXT saved.");
          }}
        >
          Save TXT
        </button>
        <button type="button" className={secondaryBtn} onClick={exportPdf}>
          Export PDF
        </button>
        <button type="button" className={secondaryBtn} onClick={printNote}>
          Print
        </button>
        <CopyButton text={text} label="Copy Note" />
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => {
            setText("");
            setStatus("Note cleared.");
          }}
        >
          Clear
        </button>
      </div>
      <div className={resultBox}>
        {status || "Autosaved locally in your browser."}
      </div>
    </ToolPanel>
  );
}

function SocialTool({ mode }: { mode: string }) {
  const [input, setInput] = useState(useContext(SampleContext));
  const [secondary, setSecondary] = useState("");

  const output = useMemo(() => {
    switch (mode) {
      case "post":
        return `${input.trim()}\n\nWhat do you think? Share your thoughts below.`;
      case "caption":
      case "reel":
        return `${input.trim()}\n\n${secondary.trim() || "Save this for later and share with a friend."}`;
      case "hashtags": {
        const tags = input
          .split(/[\s,]+/)
          .map((tag) => tag.replace(/[^a-zA-Z0-9_]/g, ""))
          .filter(Boolean)
          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
        return Array.from(new Set(tags)).join(" ");
      }
      case "planner":
        return "Best engagement windows:\n- Weekdays: 11:00-13:00\n- Evenings: 18:00-20:00\n- Weekends: 10:00-12:00";
      case "dimensions":
        return "Common dimensions:\n- Square post: 1080 x 1080\n- Story/Reel: 1080 x 1920\n- YouTube thumb: 1280 x 720\n- FB cover: 851 x 315";
      case "bio":
        return `Characters: ${input.length}/150`;
      case "yt-title":
        return `Title length: ${input.length}/100 characters`;
      case "yt-description":
        return `${input.trim()}\n\nChapters\n00:00 Intro\n00:45 Main Topic\n02:00 Summary\n\nSubscribe for more.`;
      case "yt-tags":
        return input
          .split(/[\n,]+/)
          .map((tag) => tag.trim())
          .filter(Boolean)
          .join(", ");
      case "yt-timestamps": {
        const lines = input
          .split("\n")
          .map(
            (line, index) =>
              `${String(index).padStart(2, "0")}:00 ${line || `Section ${index + 1}`}`,
          );
        return lines.length ? lines.join("\n") : "Add one line per chapter.";
      }
      case "yt-template":
        return `Title: ${input || "Video title"}\n\nAbout this video:\n${secondary || "Add concise summary."}\n\nLinks:\n- Website\n- Social profiles\n\nTimestamps:\n00:00 Intro\n`;
      default:
        return input;
    }
  }, [input, mode, secondary]);

  return (
    <ToolPanel>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-36`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Enter draft content"
      />
      {(mode === "caption" || mode === "reel" || mode === "yt-template") && (
        <textarea
          aria-label="Input text"
          className={`${inputClass} min-h-24`}
          value={secondary}
          onChange={(event) => setSecondary(event.target.value)}
          placeholder="Optional supporting line"
        />
      )}
      <textarea
        className={`${inputClass} min-h-44`}
        aria-label="Result"
        readOnly
        value={output}
      />
      <div className="flex flex-wrap gap-2">
        <CopyButton text={output} label="Copy Output" />
      </div>
    </ToolPanel>
  );
}

function PdfTool({ mode }: { mode: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("Toolinger PDF Builder\n");
  const [info, setInfo] = useState("Select files or enter content.");
  const [pageInput, setPageInput] = useState("1");
  const [angle, setAngle] = useState("90");
  const [order, setOrder] = useState("1,2");
  const [html, setHtml] = useState(
    "<h1>Toolinger</h1><p>Print this as PDF.</p>",
  );
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const parsePages = parsePageSelection;

  const run = async () => {
    try {
      const { PDFDocument, StandardFonts, rgb, degrees } =
        await import("pdf-lib");
      if (mode === "text-to-pdf") {
        if (!text.trim()) {
          setInfo("Please type content first.");
          return;
        }
        const pdf = await PDFDocument.create();
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        let page = pdf.addPage([595, 842]);
        let y = 800;

        for (const line of text.split("\n")) {
          for (let i = 0; i < line.length; i += 95) {
            if (y < 40) {
              page = pdf.addPage([595, 842]);
              y = 800;
            }
            page.drawText(line.slice(i, i + 95), {
              x: 40,
              y,
              size: 11,
              font,
              color: rgb(0.1, 0.1, 0.2),
            });
            y -= 14;
          }
        }

        const bytes = await pdf.save();
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-text.pdf",
        );
        setInfo("PDF downloaded.");
        return;
      }

      if (mode === "html-to-pdf") {
        const frame = window.open("", "_blank", "width=900,height=700");
        if (!frame) {
          setInfo("Popup blocked. Allow popups to print PDF.");
          return;
        }
        frame.opener = null;
        const cleanDocument = new DOMParser().parseFromString(
          html,
          "text/html",
        );
        cleanDocument
          .querySelectorAll("script,iframe,object,embed,link,meta,base,form")
          .forEach((node) => node.remove());
        cleanDocument.querySelectorAll("*").forEach((node) =>
          Array.from(node.attributes).forEach((attr) => {
            if (
              attr.name.startsWith("on") ||
              /^(javascript:|https?:|\/\/)/i.test(attr.value.trim())
            )
              node.removeAttribute(attr.name);
          }),
        );
        frame.document.write(`
          <html>
            <head>
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:">
              <title>Toolinger</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
                img { max-width: 100%; }
              </style>
            </head>
            <body>${cleanDocument.body.innerHTML}</body>
          </html>
        `);
        frame.document.close();
        window.setTimeout(() => {
          frame.focus();
          frame.print();
        }, 350);
        setInfo("Use browser print dialog to save as PDF.");
        return;
      }

      if (files.length === 0) {
        setInfo("Please select at least one PDF file.");
        return;
      }

      if (mode === "merge") {
        const output = await PDFDocument.create();
        for (const file of files) {
          const src = await PDFDocument.load(await readAsArrayBuffer(file));
          const copied = await output.copyPages(src, src.getPageIndices());
          copied.forEach((page) => output.addPage(page));
        }
        const bytes = await output.save({ useObjectStreams: true });
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-merged.pdf",
        );
        setInfo("Merged PDF downloaded.");
        return;
      }

      const first = files[0] as File;

      if (mode === "preview") {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const src = URL.createObjectURL(first);
        previewUrlRef.current = src;
        if (previewRef.current) previewRef.current.src = src;
        setInfo("PDF loaded in preview.");
        return;
      }

      if (mode === "metadata") {
        const pdf = await PDFDocument.load(await readAsArrayBuffer(first));
        const title = pdf.getTitle() || "(none)";
        const author = pdf.getAuthor() || "(none)";
        setInfo(
          `Pages: ${pdf.getPageCount()} | File: ${first.name} | Size: ${(first.size / 1024).toFixed(1)}KB | Title: ${title} | Author: ${author}`,
        );
        return;
      }

      const source = await PDFDocument.load(await readAsArrayBuffer(first));
      const total = source.getPageCount();
      const indexes = ["split", "extract-pages", "delete-pages"].includes(mode)
        ? parsePages(pageInput, total)
        : [];

      if (mode === "split" || mode === "extract-pages") {
        if (indexes.length === 0) {
          setInfo("Enter page numbers like: 1,2,3");
          return;
        }
        const out = await PDFDocument.create();
        const pages = await out.copyPages(source, indexes);
        pages.forEach((page) => out.addPage(page));
        const bytes = await out.save({ useObjectStreams: true });
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-extracted.pdf",
        );
        setInfo("New PDF downloaded.");
        return;
      }

      if (mode === "delete-pages") {
        const deleteSet = new Set(indexes);
        const keep = source
          .getPageIndices()
          .filter((index) => !deleteSet.has(index));
        if (keep.length === 0) {
          setInfo("Cannot remove every page from a PDF.");
          return;
        }
        const out = await PDFDocument.create();
        const pages = await out.copyPages(source, keep);
        pages.forEach((page) => out.addPage(page));
        const bytes = await out.save({ useObjectStreams: true });
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-pages-deleted.pdf",
        );
        setInfo("PDF with removed pages downloaded.");
        return;
      }

      if (mode === "rearrange-pages") {
        const requested = parsePages(order, total);
        if (requested.length === 0) {
          setInfo("Enter new order like: 3,1,2");
          return;
        }
        const out = await PDFDocument.create();
        const pages = await out.copyPages(source, requested);
        pages.forEach((page) => out.addPage(page));
        const bytes = await out.save({ useObjectStreams: true });
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-reordered.pdf",
        );
        setInfo("Reordered PDF downloaded.");
        return;
      }

      if (mode === "rotate") {
        const safeAngle = Number(angle) || 0;
        source
          .getPages()
          .forEach((page) => page.setRotation(degrees(safeAngle)));
        const bytes = await source.save({ useObjectStreams: true });
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-rotated.pdf",
        );
        setInfo("Rotated PDF downloaded.");
        return;
      }

      if (mode === "page-numbers") {
        const font = await source.embedFont(StandardFonts.Helvetica);
        const pages = source.getPages();
        pages.forEach((page, index) => {
          const { width } = page.getSize();
          page.drawText(`${index + 1}/${pages.length}`, {
            x: width - 70,
            y: 20,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        });
        const bytes = await source.save({ useObjectStreams: true });
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-numbered.pdf",
        );
        setInfo("Numbered PDF downloaded.");
        return;
      }

      if (mode === "compress") {
        const bytes = await source.save({
          useObjectStreams: true,
          objectsPerTick: 2000,
        });
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-compressed.pdf",
        );
        setInfo(
          `Compressed PDF exported (${(bytes.byteLength / 1024).toFixed(1)} KB). Original: ${(first.size / 1024).toFixed(1)} KB.`,
        );
        return;
      }

      setInfo("Unsupported PDF mode.");
    } catch (error) {
      setInfo(
        error instanceof Error
          ? error.message
          : "Unable to process this file. Please check your input.",
      );
    }
  };

  return (
    <ToolPanel>
      {mode === "text-to-pdf" ? (
        <textarea
          aria-label="Input text"
          className={`${inputClass} min-h-44`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Enter text"
        />
      ) : null}
      {mode === "html-to-pdf" ? (
        <textarea
          aria-label="Input text"
          className={`${inputClass} min-h-44`}
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          placeholder="Enter simple HTML"
        />
      ) : null}
      {mode !== "text-to-pdf" && mode !== "html-to-pdf" ? (
        <input
          className={inputClass}
          type="file"
          accept="application/pdf"
          aria-label="Choose PDF files"
          multiple={mode === "merge"}
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      ) : null}
      {mode === "split" ||
      mode === "extract-pages" ||
      mode === "delete-pages" ? (
        <input
          className={inputClass}
          aria-label="Page numbers or ranges"
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          placeholder="Page numbers: 1,2,3"
        />
      ) : null}
      {mode === "rearrange-pages" ? (
        <input
          className={inputClass}
          aria-label="New page order"
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          placeholder="New order: 3,1,2"
        />
      ) : null}
      {mode === "rotate" ? (
        <select
          className={inputClass}
          aria-label="Rotation angle"
          value={angle}
          onChange={(event) => setAngle(event.target.value)}
        >
          <option value="90">90 degrees</option>
          <option value="180">180 degrees</option>
          <option value="270">270 degrees</option>
        </select>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryBtn} onClick={run}>
          Run Tool
        </button>
      </div>
      <div className={`${resultBox} break-words`}>{info}</div>
      {mode === "preview" ? (
        <iframe
          ref={previewRef}
          title="PDF Preview"
          className="h-80 w-full rounded-xl border border-slate-200 bg-white"
        />
      ) : null}
    </ToolPanel>
  );
}

function ImageTool({ mode }: { mode: string }) {
  const [busy, setBusy] = useState(false);
  const imageWorker = useRef<Worker | null>(null);
  useEffect(() => () => imageWorker.current?.terminate(), []);
  const [files, setFiles] = useState<File[]>([]);
  const [resultUrl, setResultUrl] = useState("");
  const [resultText, setResultText] = useState("Select an image to begin.");
  const [quality, setQuality] = useState("0.8");
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("800");
  const [rotation, setRotation] = useState("90");
  const [flipDirection, setFlipDirection] = useState("horizontal");
  const [targetFormat, setTargetFormat] = useState("auto");
  const [watermark, setWatermark] = useState("Toolinger");
  const [brightness, setBrightness] = useState("0");
  const [contrast, setContrast] = useState("0");
  const [pickedColor, setPickedColor] = useState("#000000");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const exportCanvas = async (
    canvas: HTMLCanvasElement,
    type = "image/png",
    fileName = "toolinger-image.png",
    exportQuality = 0.92,
  ) => {
    try {
      let finalCanvas = canvas;

      if (type.includes("jpeg")) {
        const white = document.createElement("canvas");
        white.width = canvas.width;
        white.height = canvas.height;
        const whiteContext = white.getContext("2d");
        if (whiteContext) {
          whiteContext.fillStyle = "#ffffff";
          whiteContext.fillRect(0, 0, white.width, white.height);
          whiteContext.drawImage(canvas, 0, 0);
          finalCanvas = white;
        }
      }

      const blob = await canvasToBlob(finalCanvas, type, exportQuality);
      downloadBlob(blob, fileName);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setResultText("Unable to export image.");
    }
  };

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "quote") {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 628;
        const context = canvas.getContext("2d");
        if (!context) return;

        const gradient = context.createLinearGradient(0, 0, 1200, 628);
        gradient.addColorStop(0, "#164b3b");
        gradient.addColorStop(1, "#4c9a7f");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "white";
        context.font = "bold 58px system-ui";
        context.fillText(watermark || "Your quote", 70, 300, 1060);

        await exportCanvas(canvas, "image/png", "toolinger-quote-card.png");
        setResultText("Quote card downloaded.");
        return;
      }

      if (files.length === 0) {
        setResultText("Please select a valid image file.");
        return;
      }

      if (
        files.length > 30 ||
        files.some((file) => file.size > 25 * 1024 * 1024)
      )
        throw new Error("Use at most 30 images, each smaller than 25 MB.");
      const first = files[0] as File;
      const qualityValue = clamp(Number(quality) || 0.8, 0.2, 1);

      if (mode === "metadata") {
        const img = await loadImage(await readAsDataUrl(first));
        setResultText(
          `Name: ${first.name} | Type: ${first.type} | Size: ${(first.size / 1024).toFixed(1)}KB | Dimensions: ${img.width}x${img.height}`,
        );
        return;
      }

      if (mode === "base64") {
        setResultText(await readAsDataUrl(first));
        return;
      }

      if (mode === "image-to-pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const pdf = await PDFDocument.create();
        for (const file of files) {
          const embedded = await embedImageInPdf(pdf, file);
          const page = pdf.addPage([embedded.width, embedded.height]);
          page.drawImage(embedded, {
            x: 0,
            y: 0,
            width: embedded.width,
            height: embedded.height,
          });
        }
        const bytes = await pdf.save();
        downloadBlob(
          new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }),
          "toolinger-images.pdf",
        );
        setResultText("PDF downloaded.");
        return;
      }

      if (mode === "collage") {
        const selected = files.slice(0, 4);
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1200;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.fillStyle = "#eef2ff";
        context.fillRect(0, 0, 1200, 1200);

        for (let index = 0; index < selected.length; index += 1) {
          const file = selected[index] as File;
          const image = await loadImage(await readAsDataUrl(file));
          const x = (index % 2) * 600;
          const y = Math.floor(index / 2) * 600;
          context.save();
          context.beginPath();
          context.rect(x + 10, y + 10, 580, 580);
          context.clip();
          drawImageCover(context, image, x + 10, y + 10, 580, 580);
          context.restore();
        }

        await exportCanvas(canvas, "image/png", "toolinger-collage.png");
        setResultText("Collage downloaded.");
        return;
      }

      const canvas = await drawImageToCanvas(first);
      if (canvas.width * canvas.height > 24_000_000)
        throw new Error("Use an image with at most 24 megapixels.");
      const context = canvas.getContext("2d");
      if (!context) {
        setResultText("Canvas not supported in this browser.");
        return;
      }
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (mode === "resize" || mode === "crop") {
        if (
          ![Number(width), Number(height)].every(
            (n) => Number.isInteger(n) && n >= 32 && n <= 5000,
          )
        )
          throw new Error(
            "Width and height must be whole numbers from 32 to 5000.",
          );
      }
      if (mode === "resize") {
        const nw = clamp(Number(width), 32, 5000);
        const nh = clamp(Number(height), 32, 5000);
        const resized = document.createElement("canvas");
        resized.width = nw;
        resized.height = nh;
        const resizedContext = resized.getContext("2d");
        if (!resizedContext) return;
        resizedContext.drawImage(canvas, 0, 0, nw, nh);
        await exportCanvas(resized, "image/png", "toolinger-resized.png");
        setResultText("Resized image downloaded.");
        return;
      }

      if (mode === "crop") {
        const cw = clamp(Number(width), 32, canvas.width);
        const ch = clamp(Number(height), 32, canvas.height);
        const x = (canvas.width - cw) / 2;
        const y = (canvas.height - ch) / 2;
        const cropped = document.createElement("canvas");
        cropped.width = cw;
        cropped.height = ch;
        const cropContext = cropped.getContext("2d");
        if (!cropContext) return;
        cropContext.drawImage(canvas, x, y, cw, ch, 0, 0, cw, ch);
        await exportCanvas(cropped, "image/png", "toolinger-crop.png");
        setResultText("Cropped image downloaded.");
        return;
      }

      if (mode === "format") {
        const sourceType = first.type ?? "";
        let type = "image/png";
        let fileName = "toolinger-convert.png";

        if (targetFormat === "auto") {
          if (sourceType.includes("png")) {
            type = "image/jpeg";
            fileName = "toolinger-convert.jpg";
          } else {
            type = "image/png";
            fileName = "toolinger-convert.png";
          }
        } else if (targetFormat === "png") {
          type = "image/png";
          fileName = "toolinger-convert.png";
        } else if (targetFormat === "jpeg") {
          type = "image/jpeg";
          fileName = "toolinger-convert.jpg";
        } else if (targetFormat === "webp") {
          type = "image/webp";
          fileName = "toolinger-convert.webp";
        }

        await exportCanvas(canvas, type, fileName, qualityValue);
        setResultText("Format converted image downloaded.");
        return;
      }

      if (mode === "compress") {
        await exportCanvas(
          canvas,
          "image/jpeg",
          "toolinger-compressed.jpg",
          qualityValue,
        );
        setResultText("Compressed image downloaded.");
        return;
      }

      if (mode === "rotate") {
        const angle = Number(rotation);
        const radians = (angle * Math.PI) / 180;
        const rotated = document.createElement("canvas");
        const swap = Math.abs(angle % 180) === 90;
        rotated.width = swap ? canvas.height : canvas.width;
        rotated.height = swap ? canvas.width : canvas.height;
        const rotateContext = rotated.getContext("2d");
        if (!rotateContext) return;

        rotateContext.translate(rotated.width / 2, rotated.height / 2);
        rotateContext.rotate(radians);
        rotateContext.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        await exportCanvas(rotated, "image/png", "toolinger-rotated.png");
        setResultText("Rotated image downloaded.");
        return;
      }

      if (mode === "flip") {
        const flipped = document.createElement("canvas");
        flipped.width = canvas.width;
        flipped.height = canvas.height;
        const flipContext = flipped.getContext("2d");
        if (!flipContext) return;

        if (flipDirection === "vertical") {
          flipContext.translate(0, canvas.height);
          flipContext.scale(1, -1);
        } else {
          flipContext.translate(canvas.width, 0);
          flipContext.scale(-1, 1);
        }

        flipContext.drawImage(canvas, 0, 0);
        await exportCanvas(flipped, "image/png", "toolinger-flipped.png");
        setResultText("Flipped image downloaded.");
        return;
      }

      if (mode === "watermark") {
        context.font = `${Math.max(22, Math.round(canvas.width / 18))}px system-ui`;
        context.fillStyle = "rgba(255,255,255,0.78)";
        context.fillText(watermark || "Toolinger", 30, canvas.height - 40);
        context.strokeStyle = "rgba(0,0,0,0.25)";
        context.strokeText(watermark || "Toolinger", 30, canvas.height - 40);
        await exportCanvas(canvas, "image/png", "toolinger-watermark.png");
        setResultText("Watermarked image downloaded.");
        return;
      }

      if (
        [
          "brightness-contrast",
          "grayscale",
          "sepia",
          "blur",
          "sharpen",
        ].includes(mode)
      ) {
        const pixels = await new Promise<Uint8ClampedArray>(
          (resolve, reject) => {
            const worker = new Worker(
              new URL("./src/image-worker.ts", import.meta.url),
              { type: "module" },
            );
            imageWorker.current = worker;
            worker.onmessage = ({ data: reply }) => {
              worker.terminate();
              imageWorker.current = null;
              reply.error
                ? reject(new Error(reply.error))
                : resolve(new Uint8ClampedArray(reply.buffer));
            };
            worker.onerror = () => {
              worker.terminate();
              imageWorker.current = null;
              reject(
                new Error(
                  "Image engine unavailable. Please reload and try again.",
                ),
              );
            };
            worker.postMessage(
              {
                buffer: data.buffer,
                width: canvas.width,
                height: canvas.height,
                mode,
                brightness: Number(brightness),
                contrast: Number(contrast),
              },
              [data.buffer],
            );
          },
        );
        context.putImageData(
          new ImageData(
            new Uint8ClampedArray(pixels),
            canvas.width,
            canvas.height,
          ),
          0,
          0,
        );
      }

      if (mode === "color-picker" && canvasRef.current) {
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        const targetContext = canvasRef.current.getContext("2d");
        targetContext?.drawImage(canvas, 0, 0);
        setResultText("Tap the image preview to pick a color.");
      } else {
        await exportCanvas(canvas, "image/png", `toolinger-${mode}.png`);
        setResultText("Image processed and downloaded.");
      }
    } catch (error) {
      setResultText(
        error instanceof Error
          ? error.message
          : "Unable to process file. Please use a valid image.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPanel>
      {mode === "quote" ? null : (
        <input
          className={inputClass}
          type="file"
          accept="image/*"
          aria-label="Choose image files"
          multiple={mode === "collage" || mode === "image-to-pdf"}
          disabled={busy}
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
            setResultUrl("");
            setResultText("Image selected. Choose settings and run the tool.");
          }}
        />
      )}

      {(mode === "resize" || mode === "crop") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Width">
            <input
              className={inputClass}
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              placeholder="Width"
            />
          </Field>
          <Field label="Height">
            <input
              className={inputClass}
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              placeholder="Height"
            />
          </Field>
        </div>
      )}

      {(mode === "compress" || mode === "format") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quality (0.2-1)">
            <input
              className={inputClass}
              value={quality}
              onChange={(event) => setQuality(event.target.value)}
              placeholder="Quality 0.2 - 1"
            />
          </Field>
          {mode === "format" ? (
            <Field label="Target Format">
              <select
                className={inputClass}
                value={targetFormat}
                onChange={(event) => setTargetFormat(event.target.value)}
              >
                <option value="auto">Auto</option>
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </Field>
          ) : null}
        </div>
      )}

      {mode === "rotate" && (
        <Field label="Rotate">
          <select
            className={inputClass}
            value={rotation}
            onChange={(event) => setRotation(event.target.value)}
          >
            <option value="90">90 degrees</option>
            <option value="180">180 degrees</option>
            <option value="270">270 degrees</option>
          </select>
        </Field>
      )}

      {mode === "flip" && (
        <Field label="Flip Direction">
          <select
            className={inputClass}
            value={flipDirection}
            onChange={(event) => setFlipDirection(event.target.value)}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </Field>
      )}

      {(mode === "watermark" || mode === "quote") && (
        <Field label="Text">
          <input
            className={inputClass}
            value={watermark}
            onChange={(event) => setWatermark(event.target.value)}
            placeholder="Text"
          />
        </Field>
      )}

      {mode === "brightness-contrast" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Brightness (-100 to 100)">
            <input
              type="number"
              className={inputClass}
              value={brightness}
              onChange={(event) => setBrightness(event.target.value)}
            />
          </Field>
          <Field label="Contrast (-100 to 100)">
            <input
              type="number"
              className={inputClass}
              value={contrast}
              onChange={(event) => setContrast(event.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryBtn}
          onClick={run}
          disabled={busy}
        >
          {busy ? "Processing…" : "Run Tool"}
        </button>
        {resultText ? (
          <CopyButton text={resultText} label="Copy Result" />
        ) : null}
      </div>

      <div className={`${resultBox} break-all whitespace-pre-wrap`}>
        {resultText}
      </div>

      {mode === "color-picker" && (
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            className="h-auto max-h-72 w-auto max-w-full rounded-xl border border-slate-200 bg-white"
            onClick={(event) => {
              if (!canvasRef.current) return;
              const rect = canvasRef.current.getBoundingClientRect();
              const x = Math.floor(
                ((event.clientX - rect.left) / rect.width) *
                  canvasRef.current.width,
              );
              const y = Math.floor(
                ((event.clientY - rect.top) / rect.height) *
                  canvasRef.current.height,
              );
              const context = canvasRef.current.getContext("2d");
              if (!context) return;
              const pixel = context.getImageData(x, y, 1, 1).data;
              const hex = rgbaToHex(
                pixel[0] ?? 0,
                pixel[1] ?? 0,
                pixel[2] ?? 0,
              );
              setPickedColor(hex);
              setResultText(`Selected color: ${hex}`);
            }}
          />
          <div className={resultBox}>Selected color: {pickedColor}</div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={pickedColor} label="Copy Color" />
          </div>
        </div>
      )}

      {resultUrl && mode !== "color-picker" ? (
        <img
          src={resultUrl}
          alt="Result preview"
          className="h-auto max-h-72 w-auto max-w-full rounded-xl border border-slate-200 bg-white object-contain"
        />
      ) : null}
    </ToolPanel>
  );
}

const INDIA_PHOTO_PRESETS = {
  passport: { label: "35 × 45 mm — common ID format", width: 413, height: 531 },
  pan: { label: "PAN application — 25 × 35 mm", width: 295, height: 413 },
  aadhaar: {
    label: "35 × 45 mm — document attachment",
    width: 413,
    height: 531,
  },
  uan: {
    label: "35 × 45 mm — application attachment",
    width: 413,
    height: 531,
  },
  visa: { label: "2 × 2 inch — square photo", width: 600, height: 600 },
};

function PassportTool() {
  const [file, setFile] = useState<File | null>(null),
    [sourceUrl, setSourceUrl] = useState(""),
    [cutoutUrl, setCutoutUrl] = useState("");
  const [background, setBackground] = useState("#FFFFFF"),
    [format, setFormat] = useState("passport"),
    [customWidth, setCustomWidth] = useState(413),
    [customHeight, setCustomHeight] = useState(531);
  const [zoom, setZoom] = useState(100),
    [horizontal, setHorizontal] = useState(50),
    [vertical, setVertical] = useState(50),
    [enhance, setEnhance] = useState(false),
    [guides, setGuides] = useState(true);
  const [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(false),
    [generating, setGenerating] = useState(false),
    [status, setStatus] = useState("Upload a portrait to start."),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const pendingRequest = useRef<AbortController | null>(null),
    photoUrls = useRef({ source: "", cutout: "" }),
    uploadVersion = useRef(0);
  useEffect(
    () => () => {
      uploadVersion.current++;
      pendingRequest.current?.abort();
      URL.revokeObjectURL(photoUrls.current.source);
      URL.revokeObjectURL(photoUrls.current.cutout);
    },
    [],
  );
  const preset =
    format === "custom"
      ? {
          label: "Custom",
          width: Math.min(
            4000,
            Math.max(100, Math.round(Number(customWidth)) || 100),
          ),
          height: Math.min(
            4000,
            Math.max(100, Math.round(Number(customHeight)) || 100),
          ),
        }
      : INDIA_PHOTO_PRESETS[format as keyof typeof INDIA_PHOTO_PRESETS];
  const selectFile = async (next: File | null) => {
    if (!next) return;
    const version = ++uploadVersion.current;
    setError("");
    setStatus("Preparing your portrait…");
    setBusy(true);
    let raw = "";
    try {
      validatePhoto(next);
      raw = URL.createObjectURL(next);
      const image = await loadImage(raw);
      // Reduce oversized camera photos before segmentation or preview rendering.
      const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("This browser cannot create a photo canvas.");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const normalized = await canvasToBlob(canvas, "image/png");
      if (version !== uploadVersion.current) return;
      const prepared = new File([normalized], "portrait.png", {
        type: "image/png",
      });
      const url = URL.createObjectURL(prepared);
      URL.revokeObjectURL(photoUrls.current.source);
      URL.revokeObjectURL(photoUrls.current.cutout);
      photoUrls.current = { source: url, cutout: "" };
      setFile(prepared);
      setSourceUrl(url);
      setCutoutUrl("");
      setZoom(100);
      setVertical(50);
      setHorizontal(50);
      setPreview("");
      setStatus("Portrait ready. Your preview updates automatically.");
    } catch (e) {
      if (version === uploadVersion.current) {
        setError(
          e instanceof Error
            ? e.message
            : "This photo could not open. Try a JPG, PNG or WebP.",
        );
        setStatus("Choose a supported portrait to continue.");
      }
    } finally {
      if (raw) URL.revokeObjectURL(raw);
      if (version === uploadVersion.current) setBusy(false);
    }
  };
  useEffect(() => {
    const input = cutoutUrl || sourceUrl;
    if (!input) {
      setPreview("");
      return;
    }
    let active = true;
    setGenerating(true);
    const timer = setTimeout(async () => {
      try {
        const image = await loadImage(input),
          canvas = document.createElement("canvas");
        canvas.width = preset.width;
        canvas.height = preset.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is unavailable.");
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const { dx, dy, drawWidth, drawHeight } = portraitLayout(
          image.width,
          image.height,
          canvas.width,
          canvas.height,
          zoom,
          horizontal,
          vertical,
        );
        ctx.filter = enhance
          ? "brightness(1.035) contrast(1.07) saturate(1.035)"
          : "none";
        ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
        if (active) {
          setPreview(canvas.toDataURL("image/png"));
          setGenerating(false);
        }
      } catch (e) {
        if (active) {
          setPreview("");
          setGenerating(false);
          setError((e as Error).message);
        }
      }
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    sourceUrl,
    cutoutUrl,
    background,
    preset.width,
    preset.height,
    zoom,
    horizontal,
    vertical,
    enhance,
    revision,
  ]);
  const useCutout = async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    try {
      await loadImage(url);
    } catch {
      URL.revokeObjectURL(url);
      throw new Error("The processed image could not open.");
    }
    URL.revokeObjectURL(photoUrls.current.cutout);
    photoUrls.current.cutout = url;
    setCutoutUrl(url);
    setStatus("Background removed. Choose a colour and download your photo.");
  };
  const removeBackground = async () => {
    if (!file || busy) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setBusy(true);
    setError("");
    try {
      const blob = await localCutout(file, controller.signal, setStatus);
      if (!controller.signal.aborted) await useCutout(blob);
    } catch (e) {
      setError(
        controller.signal.aborted
          ? "Processing stopped. You can still crop and download your original."
          : (e as Error).message,
      );
      setStatus(
        "Your original portrait is safe. Retry AI, or use plain-wall removal.",
      );
    } finally {
      pendingRequest.current = null;
      setBusy(false);
    }
  };
  const removePlain = async () => {
    if (!sourceUrl || busy) return;
    setBusy(true);
    setError("");
    setStatus("Removing the edge-connected plain background…");
    try {
      const image = await loadImage(sourceUrl),
        scale = Math.min(1, 960 / Math.max(image.width, image.height)),
        c = document.createElement("canvas");
      c.width = Math.round(image.width * scale);
      c.height = Math.round(image.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable.");
      ctx.drawImage(image, 0, 0, c.width, c.height);
      const pixels = ctx.getImageData(0, 0, c.width, c.height);
      const { removePlainPixels } =
        await import("./src/portrait-background.mjs");
      removePlainPixels(pixels.data, c.width, c.height);
      ctx.putImageData(pixels, 0, 0);
      await useCutout(await canvasToBlob(c, "image/png"));
    } catch (e) {
      setError((e as Error).message);
      setStatus(
        "Plain-wall removal could not isolate this portrait. Try AI or keep the original.",
      );
    } finally {
      setBusy(false);
    }
  };
  const ready = Boolean(preview) && !busy && !generating;
  const downloadPhoto = async (type: "png" | "jpeg") => {
    if (!ready) return;
    try {
      const image = await loadImage(preview),
        c = document.createElement("canvas");
      c.width = image.width;
      c.height = image.height;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable.");
      ctx.drawImage(image, 0, 0);
      downloadBlob(
        await canvasToBlob(c, `image/${type}`, 0.94),
        `toolinger-passport.${type === "jpeg" ? "jpg" : "png"}`,
      );
      setStatus("Photo downloaded. Check the saved image before submitting.");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const downloadSheet = async () => {
    if (!ready) return;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const photo = await loadImage(preview),
        layout = sheetLayout(photo.width, photo.height);
      if (!layout.positions.length)
        throw new Error(
          "This custom size is too large for a 4 × 6 inch sheet.",
        );
      const pdf = await PDFDocument.create(),
        page = pdf.addPage([288, 432]),
        image = await pdf.embedPng(await (await fetch(preview)).arrayBuffer());
      for (const { x, y } of layout.positions)
        page.drawImage(image, {
          x: x * 0.24,
          y: 432 - (y + photo.height) * 0.24,
          width: photo.width * 0.24,
          height: photo.height * 0.24,
        });
      downloadBlob(
        new Blob([toArrayBuffer(await pdf.save())], {
          type: "application/pdf",
        }),
        "toolinger-4x6-print.pdf",
      );
      setStatus(
        `${layout.positions.length} photos on a 4 × 6 inch sheet. Print at actual size / 100%.`,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="tool-panel photo-studio">
      <div className="studio-topline">
        <span>PHOTO LAB / 01</span>
        <span>
          <i /> Private, on your device
        </span>
      </div>
      <div className="studio-grid">
        <div className="studio-controls">
          <section className="studio-step">
            <div className="step-heading">
              <span>01</span>
              <h2>Your portrait</h2>
            </div>
            <label
              className={`studio-upload ${sourceUrl ? "has-photo" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy) void selectFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              {sourceUrl ? (
                <img src={sourceUrl} alt="Original portrait" />
              ) : (
                <Icon name="image" size={40} />
              )}
              <strong>
                {sourceUrl ? "Change your photo" : "Drop a portrait here"}
              </strong>
              <span>or tap to browse · JPG, PNG, WebP · max 10 MB</span>
              <input
                aria-label="Choose portrait"
                disabled={busy}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void selectFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </section>
          <section className="studio-step">
            <div className="step-heading">
              <span>02</span>
              <h2>Background</h2>
              <small>Optional</small>
            </div>
            <div className="studio-actions">
              <button
                className="studio-primary"
                disabled={busy || !file}
                onClick={removeBackground}
              >
                {busy && pendingRequest.current
                  ? "Processing…"
                  : "Remove Background with AI"}
                <Icon name="spark" size={16} />
              </button>
              <button
                className="studio-secondary"
                disabled={busy || !file}
                onClick={removePlain}
              >
                Remove plain background
              </button>
            </div>
            <p className="studio-hint">
              AI works best with one well-lit person. Plain removal is for
              evenly lit, solid-colour walls.
            </p>
            {busy && pendingRequest.current ? (
              <button
                className="studio-link"
                onClick={() => pendingRequest.current?.abort()}
              >
                Cancel processing
              </button>
            ) : null}
            {cutoutUrl ? (
              <>
                <img
                  src={cutoutUrl}
                  alt="AI background removed"
                  className="studio-cutout"
                />
                <button
                  className="studio-link"
                  disabled={busy}
                  onClick={() => {
                    URL.revokeObjectURL(photoUrls.current.cutout);
                    photoUrls.current.cutout = "";
                    setCutoutUrl("");
                    setStatus("Using the original background.");
                  }}
                >
                  Use original photo
                </button>
              </>
            ) : null}
            <div
              className="studio-swatches"
              role="group"
              aria-label="Studio background colours"
            >
              {[
                { name: "White", color: "#FFFFFF" },
                { name: "Navy blue", color: "#163A70" },
                { name: "Red", color: "#B91C1C" },
                { name: "Soft grey", color: "#E5E7EB" },
              ].map((x) => (
                <button
                  key={x.name}
                  aria-label={x.name}
                  aria-pressed={background === x.color}
                  style={{ background: x.color }}
                  onClick={() => setBackground(x.color)}
                >
                  <span>{background === x.color ? "✓" : ""}</span>
                </button>
              ))}
              <Field label="Custom background colour">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                />
              </Field>
            </div>
            {!cutoutUrl ? (
              <p className="studio-hint">
                Remove the background first to apply a new colour. Cropping and
                downloads work with the original too.
              </p>
            ) : null}
          </section>
          <section className="studio-step">
            <div className="step-heading">
              <span>03</span>
              <h2>Size & framing</h2>
            </div>
            <Field label="Photo dimensions">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                {Object.entries(INDIA_PHOTO_PRESETS).map(([id, x]) => (
                  <option key={id} value={id}>
                    {x.label}
                  </option>
                ))}
                <option value="custom">Custom pixel size</option>
              </select>
            </Field>
            {format === "custom" ? (
              <div className="studio-two">
                <Field label="Width (px)">
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                  />
                </Field>
                <Field label="Height (px)">
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                  />
                </Field>
              </div>
            ) : null}
            <Field label={`Zoom — ${zoom}%`}>
              <input
                type="range"
                min="100"
                max="180"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </Field>
            <Field label="Horizontal position">
              <input
                type="range"
                min="0"
                max="100"
                value={horizontal}
                onChange={(e) => setHorizontal(Number(e.target.value))}
              />
            </Field>
            <Field label="Vertical position">
              <input
                type="range"
                min="0"
                max="100"
                value={vertical}
                onChange={(e) => setVertical(Number(e.target.value))}
              />
            </Field>
            <label className="studio-check">
              <input
                type="checkbox"
                checked={enhance}
                onChange={(e) => setEnhance(e.target.checked)}
              />{" "}
              Auto-enhance brightness, colour and contrast
            </label>
            <button
              className="studio-secondary"
              disabled={busy || !file}
              onClick={() => setRevision((x) => x + 1)}
            >
              Create Studio Photo
            </button>
          </section>
        </div>
        <aside className="studio-output">
          <div className="studio-preview-header">
            <span>LIVE PREVIEW</span>
            <span>
              {generating
                ? "Updating…"
                : preview
                  ? "Ready to export"
                  : "Waiting for your photo"}
            </span>
          </div>
          <div className="studio-preview-stage">
            <div
              className="portrait-preview"
              style={{ aspectRatio: `${preset.width}/${preset.height}` }}
            >
              {preview ? (
                <img src={preview} alt="Passport preview" />
              ) : (
                <div className="studio-placeholder">
                  <svg viewBox="0 0 160 200" aria-hidden="true">
                    <circle cx="80" cy="65" r="32" />
                    <path d="M25 184v-27c0-38 110-38 110 0v27" />
                  </svg>
                  <span>Your photo goes here</span>
                </div>
              )}
              {guides && preview ? (
                <div className="portrait-guides" aria-hidden="true">
                  <span />
                </div>
              ) : null}
            </div>
            <span className="studio-size">
              {preset.width} × {preset.height} px · 300 DPI print sizing
            </span>
          </div>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={guides}
              onChange={(e) => setGuides(e.target.checked)}
            />{" "}
            Show framing guides (excluded from downloads)
          </label>
          <div className="studio-export">
            <button
              className="studio-primary"
              disabled={!ready}
              onClick={() => void downloadPhoto("jpeg")}
            >
              Download JPG <Icon name="arrow" size={16} />
            </button>
            <button
              className="studio-secondary"
              disabled={!ready}
              onClick={() => void downloadPhoto("png")}
            >
              Download PNG
            </button>
            <button
              className="studio-secondary studio-print"
              disabled={!ready}
              onClick={downloadSheet}
            >
              Download 4 × 6 print PDF
            </button>
          </div>
          <p className="studio-status" role="status" aria-live="polite">
            {status}
          </p>
          {error ? (
            <p className="studio-error" role="alert">
              {error}
            </p>
          ) : null}
          <p className="studio-hint">
            Check your issuing authority’s current dimensions and editing rules.
            Templates are not approval checks. Aadhaar enrolment requires a live
            photo.
          </p>
        </aside>
      </div>
    </div>
  );
}

const localAiPipelines = new Map<string, Promise<any>>();

function getLocalAiPipeline(task: string, model: string) {
  const key = `${task}:${model}`;
  if (!localAiPipelines.has(key)) {
    localAiPipelines.set(
      key,
      import("@huggingface/transformers")
        .then(({ pipeline, env }) => {
          env.allowLocalModels = false;
          env.useBrowserCache = true;
          return pipeline(task as any, model, { dtype: "q8" });
        })
        .catch((error) => {
          localAiPipelines.delete(key);
          throw error;
        }),
    );
  }
  return localAiPipelines.get(key)!;
}

function cosine(a: ArrayLike<number>, b: ArrayLike<number>) {
  let dot = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    aa += a[i] ** 2;
    bb += b[i] ** 2;
  }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb) || 1);
}

function rowsFromTensor(tensor: any): number[][] {
  const data = Array.from(tensor.data as ArrayLike<number>);
  const rows = tensor.dims?.[0] || 1;
  const width = data.length / rows;
  return Array.from({ length: rows }, (_, row) =>
    data.slice(row * width, (row + 1) * width),
  );
}

function LocalAiTool({ mode }: { mode: string }) {
  const [text, setText] = useState(useContext(SampleContext));
  const [second, setSecond] = useState("");
  const [result, setResult] = useState("Your result will appear here.");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!text.trim()) {
      setResult("Enter some text first.");
      return;
    }
    if (mode === "similarity" && !second.trim()) {
      setResult("Enter both passages.");
      return;
    }
    setBusy(true);
    setResult(
      "Loading the compact model on this device. The first run may take a minute; later runs use the browser cache.",
    );
    try {
      if (mode === "sentiment") {
        const classifier = await getLocalAiPipeline(
          "sentiment-analysis",
          "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
        );
        const output = await classifier(text.slice(0, 4000));
        const best = Array.isArray(output) ? output[0] : output;
        setResult(
          `${String(best.label).replace("POSITIVE", "Positive").replace("NEGATIVE", "Negative")} · ${(best.score * 100).toFixed(1)}% confidence`,
        );
      } else {
        const embed = await getLocalAiPipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
        );
        if (mode === "similarity") {
          if (!second.trim()) throw new Error("Enter both passages.");
          const vectors = rowsFromTensor(
            await embed([text, second], { pooling: "mean", normalize: true }),
          );
          setResult(
            `Semantic similarity: ${(Math.max(0, cosine(vectors[0], vectors[1])) * 100).toFixed(1)}%`,
          );
        } else if (mode === "summary") {
          const sentences =
            text
              .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
              ?.map((item) => item.trim())
              .filter(Boolean) ?? [];
          if (sentences.length < 2)
            throw new Error("Enter at least two sentences.");
          const vectors = rowsFromTensor(
            await embed(sentences.slice(0, 40), {
              pooling: "mean",
              normalize: true,
            }),
          );
          const centroid = vectors[0].map(
            (_, col) =>
              vectors.reduce((sum, row) => sum + row[col], 0) / vectors.length,
          );
          const keep = Math.max(1, Math.ceil(vectors.length * 0.3));
          const chosen = vectors
            .map((row, index) => ({ index, score: cosine(row, centroid) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, keep)
            .sort((a, b) => a.index - b.index);
          setResult(chosen.map(({ index }) => sentences[index]).join(" "));
        } else {
          const words = text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
          const stop = new Set([
            "this",
            "that",
            "with",
            "from",
            "have",
            "will",
            "your",
            "about",
            "there",
            "their",
            "what",
            "when",
            "where",
            "which",
            "would",
            "could",
            "should",
            "into",
            "than",
            "then",
            "they",
            "them",
            "were",
            "been",
            "being",
          ]);
          const candidates = [
            ...new Set(words.filter((word) => !stop.has(word))),
          ].slice(0, 35);
          if (!candidates.length)
            throw new Error("Enter a longer English passage.");
          const vectors = rowsFromTensor(
            await embed([text.slice(0, 4000), ...candidates], {
              pooling: "mean",
              normalize: true,
            }),
          );
          const ranked = candidates
            .map((word, index) => ({
              word,
              score: cosine(vectors[0], vectors[index + 1]),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
          setResult(ranked.map(({ word }) => word).join(", "));
        }
      }
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "The local model could not run in this browser.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPanel>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        Your text stays in this browser. The model downloads once and is cached
        locally. No API key or account is needed.
      </div>
      <textarea
        aria-label="Input text"
        className={`${inputClass} min-h-44`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={mode === "similarity" ? "First passage" : "Paste text"}
      />
      {mode === "similarity" ? (
        <textarea
          aria-label="Input text"
          className={`${inputClass} min-h-32`}
          value={second}
          onChange={(event) => setSecond(event.target.value)}
          placeholder="Second passage"
        />
      ) : null}
      <button
        type="button"
        className={primaryBtn}
        onClick={run}
        disabled={busy}
      >
        {busy ? "Running locally…" : "Run local AI"}
      </button>
      <div className={`${resultBox} whitespace-pre-wrap`} aria-live="polite">
        {result}
      </div>
    </ToolPanel>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  image: "image",
  pdf: "file",
  text: "text",
  document: "file",
  developer: "code",
  health: "heart",
  finance: "chart",
  converter: "swap",
  facebook: "chat",
  instagram: "image",
  youtube: "play",
  ai: "spark",
  utility: "grid",
};
function Icon({ name = "grid", size = 20 }: { name?: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8" cy="8" r="1.5" />
        <path d="m3 17 6-6 4 4 3-3 5 5" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
        <path d="M14 3v6h6M8 13h8m-8 4h6" />
      </>
    ),
    text: (
      <>
        <path d="M4 5h16M12 5v14m-4 0h8" />
      </>
    ),
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />,
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    chart: (
      <>
        <path d="M4 3v18h17M8 16l4-5 4 2 5-8" />
      </>
    ),
    swap: <path d="M3 7h18m-4-4 4 4-4 4M21 17H3m4-4-4 4 4 4" />,
    chat: <path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z" />,
    play: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="4" />
        <path d="m10 8 6 4-6 4Z" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
      </>
    ),
    moon: <path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    link: (
      <>
        <path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 0 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" />
      </>
    ),
    reset: (
      <>
        <path d="M3 10a9 9 0 1 1 2 8M3 3v7h7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.grid}
    </svg>
  );
}
function readPreference<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function savePreference(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage is optional. */
  }
}
function Dialog({
  title,
  children,
  close,
  drawer = false,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={drawer ? "site-dialog drawer-dialog" : "site-dialog"}
      aria-labelledby={id}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-heading">
        <h2 id={id}>{title}</h2>
        <button
          autoFocus
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
class ToolBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty-state" role="alert">
        <h2>This tool could not open.</h2>
        <p>Reset the workspace or try another tool.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
function sampleFor(tool: ToolConfig) {
  if (tool.engine === "json-tool")
    return '{"project":"Toolinger","tools":["photo","pdf"],"free":true}';
  if (tool.engine === "base64")
    return tool.mode === "decode"
      ? "SGVsbG8sIFRvb2xpbmdlciE="
      : "Hello, Toolinger!";
  if (tool.engine === "url-encode")
    return tool.mode === "decode" ? "Hello%20Toolinger%21" : "Hello Toolinger!";
  if (tool.mode === "html-format")
    return "<section><h1>Hello Toolinger</h1><p>Make everyday tasks easier.</p></section>";
  if (tool.mode === "css-format") return "body{color:#24735c;margin:0;}";
  if (tool.mode === "js-format")
    return 'const tools=["photo","pdf"];tools.forEach(tool=>console.log(tool));';
  if (tool.engine === "text-lines") return "Orange\nApple\nOrange\nBanana";
  return "Hello, Toolinger! Small tasks, sorted.\nTry a tool and make your day a little easier.";
}
function App() {
  const route = useRoute();
  const lastFocusedRoute = useRef(route);
  const tiltFrame = useRef(0);
  useEffect(() => {
    const fail = (event: Event) =>
      setNotice((event as CustomEvent<string>).detail);
    window.addEventListener("toolinger:download-error", fail);
    return () => window.removeEventListener("toolinger:download-error", fail);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false),
    [search, setSearch] = useState(""),
    [legalPage, setLegalPage] = useState<string | null>(null),
    [reset, setReset] = useState(0),
    [sampleTool, setSampleTool] = useState(""),
    [notice, setNotice] = useState("");
  const [theme, setTheme] = useState(() =>
    readPreference(
      "toolinger-theme",
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    ),
  );
  const [favourites, setFavourites] = useState<string[]>(() => {
    const v = readPreference("toolinger-favourites", []);
    return Array.isArray(v) ? v.filter((id) => typeof id === "string") : [];
  });
  const [recent, setRecent] = useState<string[]>(() => {
    const v = readPreference("toolinger-recent", []);
    return Array.isArray(v) ? v.filter((id) => typeof id === "string") : [];
  });
  const [sort, setSort] = useState("popular");
  const searchRef = useRef<HTMLInputElement>(null);
  const activeTool = route.startsWith("tools/")
    ? TOOL_LIST.find((t) => t.id === route.split("/")[1])
    : undefined;
  const community = useCommunity(activeTool?.id);
  const category = route.startsWith("categories/")
    ? route.split("/")[1]
    : route === "saved"
      ? "favourites"
      : "all";
  const guide = GUIDES.find((g) => route === `guides/${g.slug}`);
  const policy = LEGAL_CONTENT[route];
  const known =
    [
      "",
      "tools",
      "daily",
      "saved",
      "guides",
      "my-space",
      ...Object.keys(LEGAL_CONTENT),
    ].includes(route) ||
    Boolean(activeTool) ||
    Boolean(guide) ||
    (route.startsWith("categories/") && category in CATEGORY_LABELS);
  const tools = TOOL_LIST.filter(
    (t) =>
      (category === "all" ||
        (category === "favourites"
          ? favourites.includes(t.id)
          : t.category === category)) &&
      `${t.name} ${t.description} ${t.keywords.join(" ")} ${CATEGORY_LABELS[t.category]}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  ).sort((a, b) =>
    sort === "az"
      ? a.name.localeCompare(b.name)
      : Number(Boolean(community.tools[b.id]?.featured)) -
        Number(Boolean(community.tools[a.id]?.featured)),
  );
  const openTool = (id: string) => {
    navigate(`tools/${id}`);
    setMenuOpen(false);
    setSearch("");
  };
  const home = () => {
    navigate("");
    setSearch("");
  };
  const toggleFavourite = (id: string) =>
    setFavourites((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    savePreference("toolinger-theme", theme);
  }, [theme]);
  useEffect(() => {
    savePreference("toolinger-favourites", favourites);
  }, [favourites]);
  useEffect(() => {
    savePreference("toolinger-recent", recent);
  }, [recent]);
  useEffect(() => {
    setReset(0);
    setSampleTool("");
    setMenuOpen(false);
    if (lastFocusedRoute.current !== route) {
      document.getElementById("main-content")?.focus({ preventScroll: true });
      lastFocusedRoute.current = route;
    }
    document.title = activeTool
      ? `${activeTool.name} — Toolinger`
      : policy
        ? `${policy.title} — Toolinger`
        : guide
          ? `${guide.title} — Toolinger`
          : route === "daily"
            ? "Daily dashboard — Toolinger"
            : route === "tools"
              ? "All tools — Toolinger"
              : route === "saved"
                ? "Saved tools — Toolinger"
                : route === "my-space"
                  ? "My space & backups — Toolinger"
                  : route === "guides"
                    ? "Practical guides — Toolinger"
                    : category !== "all"
                      ? `${CATEGORY_LABELS[category as CategoryId]} — Toolinger`
                      : "Toolinger — Tools for a better everyday";
    const canonical = document.querySelector<HTMLLinkElement>(
      "link[rel=canonical]",
    );
    if (canonical)
      canonical.href = `${import.meta.env.VITE_SITE_ORIGIN || "https://subha760.github.io"}${routeHref(route ? route + "/" : "")}`;
  }, [route]);
  useEffect(() => {
    if (activeTool)
      setRecent((current) =>
        [activeTool.id, ...current.filter((id) => id !== activeTool.id)].slice(
          0,
          8,
        ),
      );
  }, [activeTool?.id]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  const renderActiveTool = () => {
    if (!activeTool) return null;
    switch (activeTool.engine) {
      case "text-transform":
        return <TextTransformTool mode={activeTool.mode ?? "case"} />;
      case "text-analysis":
        return <TextAnalysisTool mode={activeTool.mode ?? "words"} />;
      case "text-lines":
        return <TextLinesTool mode={activeTool.mode ?? "unique"} />;
      case "find-replace":
        return <FindReplaceTool />;
      case "markdown-preview":
        return <MarkdownPreviewTool />;
      case "json-tool":
        return <JsonTool mode={activeTool.mode ?? "format"} />;
      case "base64":
        return <Base64Tool mode={activeTool.mode ?? "encode"} />;
      case "url-encode":
        return <UrlTool mode={activeTool.mode ?? "encode"} />;
      case "uuid":
        return <UuidTool />;
      case "password":
        return <PasswordTool />;
      case "hash":
        return <HashTool />;
      case "timestamp":
        return <TimestampTool />;
      case "regex":
        return <RegexTool />;
      case "color":
        return <ColorTool />;
      case "simple-calculator":
        return <SimpleCalculatorTool mode={activeTool.mode ?? "emi"} />;
      case "bmi":
        return <BmiTool />;
      case "bmr":
        return <BmrTool />;
      case "calorie":
        return <CalorieTool />;
      case "water":
        return <WaterTool />;
      case "body-fat":
        return <BodyFatTool />;
      case "unit":
        return <UnitTool mode={activeTool.mode ?? "length"} />;
      case "qr":
        return <QrTool />;
      case "coin":
        return <CoinTool />;
      case "notepad":
        return <NotepadTool />;
      case "image":
        return <ImageTool mode={activeTool.mode ?? "resize"} />;
      case "passport":
        return <PassportTool />;
      case "pdf":
        return <PdfTool mode={activeTool.mode ?? "merge"} />;
      case "social":
        return <SocialTool mode={activeTool.mode ?? "caption"} />;
      case "local-ai":
        return <LocalAiTool mode={activeTool.mode ?? "sentiment"} />;
      case "lifestyle":
        return <LifestyleTool mode={activeTool.mode ?? "tasks"} />;
      default:
        return null;
    }
  };
  const card = (tool: ToolConfig) => (
    <article className={`catalog-card card-${tool.category}`} key={tool.id}>
      <a className="card-open" href={routeHref(`tools/${tool.id}/`)}>
        <span className={`tool-icon category-${tool.category}`}>
          <ToolIcon tool={tool} size={23} />
        </span>
        <span className="card-category">
          {community.tools[tool.id]?.featured ? "Featured · " : ""}
          {CATEGORY_LABELS[tool.category].replace(" Tools", "")}
        </span>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
        <span className="card-action">
          Open tool <Icon name="arrow" size={16} />
        </span>
      </a>
      <button
        className={`card-favourite icon-button ${favourites.includes(tool.id) ? "is-saved" : ""}`}
        aria-label={`${favourites.includes(tool.id) ? "Unsave" : "Save"} ${tool.name}`}
        aria-pressed={favourites.includes(tool.id)}
        onClick={() => toggleFavourite(tool.id)}
      >
        <Icon name="star" size={18} />
      </button>
    </article>
  );
  const guideCards = (
    <div className="guide-grid">
      {GUIDES.map((g) => (
        <a
          className="guide-card"
          href={routeHref(`guides/${g.slug}/`)}
          key={g.slug}
        >
          <span className="eyeline">PRACTICAL GUIDE</span>
          <h2>{g.title}</h2>
          <p>{g.description}</p>
          <span className="text-link">Read the guide →</span>
        </a>
      ))}
    </div>
  );
  const categories = (
    <div className="category-tiles">
      {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
        <a href={routeHref(`categories/${id}/`)} key={id}>
          <span className={`tool-icon category-${id}`}>
            <Icon name={CATEGORY_ICONS[id] ?? "spark"} />
          </span>
          <h3>{label}</h3>
          <span>
            {TOOL_LIST.filter((t) => t.category === id).length} tools →
          </span>
        </a>
      ))}
    </div>
  );
  return (
    <div
      className="site-app"
      onClick={(e) => {
        const anchor = (e.target as HTMLElement).closest("a");
        if (
          !anchor ||
          anchor.target === "_blank" ||
          anchor.hasAttribute("download") ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0 ||
          e.defaultPrevented
        )
          return;
        const url = new URL(anchor.href);
        const base = new URL(routeHref(""), location.origin);
        if (
          url.origin === location.origin &&
          url.pathname.startsWith(base.pathname) &&
          !url.hash
        ) {
          e.preventDefault();
          setSearch("");
          navigate(url.pathname.slice(base.pathname.length));
        }
      }}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            href={routeHref("")}
            className="brand-button"
            aria-label="Toolinger home"
          >
            <img
              src={assetUrl("toolinger-logo.svg")}
              alt=""
              width="36"
              height="36"
            />
            <span>
              toolinger<span className="brand-dot">.</span>
            </span>
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            {[
              ["", "Home"],
              ["tools/", "Tools"],
              ["daily/", "Daily life"],
              ["guides/", "Guides"],
            ].map(([path, label]) => (
              <a
                key={label}
                className={
                  route === path.replace(/\/$/, "") ? "nav-active" : ""
                }
                href={routeHref(path)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="header-search">
            <Icon name="search" size={18} />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (route !== "tools") navigate("tools");
              }}
              placeholder="Find a tool…"
              aria-label="Search tools"
            />
            <kbd>⌘ K</kbd>
          </div>
          <a
            className="icon-button saved-link"
            href={routeHref("saved/")}
            aria-label="Saved tools"
          >
            <Icon name="star" />
          </a>
          <button
            className="icon-button theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <button
            className="icon-button mobile-menu"
            aria-label="Browse categories"
            onClick={() => setMenuOpen(true)}
          >
            <Icon />
          </button>
        </div>
      </header>
      {community.announcement.enabled && (
        <div className="site-announcement">{community.announcement.text}</div>
      )}
      <main id="main-content" tabIndex={-1}>
        {activeTool ? (
          <div className="workspace-layout page-width">
            <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
              <a href={routeHref("tools/")}>All tools</a>
              <span>/</span>
              <a href={routeHref(`categories/${activeTool.category}/`)}>
                {CATEGORY_LABELS[activeTool.category]}
              </a>
            </nav>
            <div className="workspace-title">
              <div>
                <span className="eyeline">YOUR WORKSPACE</span>
                <h1>{activeTool.name}</h1>
                <p>{activeTool.description}</p>
              </div>
              <span className="privacy-badge">
                <Icon name="shield" size={16} /> On your device
              </span>
            </div>
            <div className="workspace-grid">
              <section className="workspace-tool" aria-label={activeTool.name}>
                <div className="workspace-toolbar">
                  <button
                    className={`toolbar-button ${favourites.includes(activeTool.id) ? "is-saved" : ""}`}
                    aria-pressed={favourites.includes(activeTool.id)}
                    onClick={() => toggleFavourite(activeTool.id)}
                  >
                    <Icon name="star" size={16} />
                    {favourites.includes(activeTool.id) ? "Saved" : "Save tool"}
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={async () => {
                      try {
                        await copyToClipboard(
                          new URL(
                            routeHref(`tools/${activeTool.id}/`),
                            location.origin,
                          ).href,
                        );
                        setNotice("Tool link copied");
                      } catch {
                        setNotice("Select the address bar to copy this link");
                      }
                    }}
                  >
                    <Icon name="link" size={16} />
                    Share link
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={() => {
                      setSampleTool("");
                      setReset((n) => n + 1);
                    }}
                  >
                    <Icon name="reset" size={16} />
                    Reset
                  </button>
                </div>
                {[
                  "text-transform",
                  "text-analysis",
                  "text-lines",
                  "json-tool",
                  "base64",
                  "url-encode",
                  "social",
                ].includes(activeTool.engine) ? (
                  <div className="sample-bar">
                    <span>Just exploring?</span>
                    <button
                      onClick={() => {
                        setSampleTool(activeTool.id);
                        setReset((n) => n + 1);
                      }}
                    >
                      Try an example <Icon name="arrow" size={14} />
                    </button>
                  </div>
                ) : null}
                <SampleContext.Provider
                  value={
                    sampleTool === activeTool.id ? sampleFor(activeTool) : ""
                  }
                >
                  <ToolBoundary key={`${activeTool.id}-${reset}`}>
                    <div data-testid="tool-content">
                      {community.tools[activeTool.id]?.enabled === false ? (
                        <p role="status">
                          {community.tools[activeTool.id]?.message ||
                            "This tool is temporarily under maintenance. Please try another tool."}
                        </p>
                      ) : (
                        renderActiveTool()
                      )}
                    </div>
                  </ToolBoundary>
                </SampleContext.Provider>
              </section>
              <aside className="workspace-help">
                <h2>A little guidance</h2>
                <ol>
                  <li>
                    {activeTool.engine === "lifestyle"
                      ? "Enter your plans or values."
                      : "Enter content or choose a file."}
                  </li>
                  <li>Adjust the options and run the tool.</li>
                  <li>Review, then save or download.</li>
                </ol>
                <div className="help-note">
                  <Icon name="shield" />
                  <p>
                    {activeTool.engine === "lifestyle"
                      ? "Plans save locally. Export a backup in My space."
                      : "Your inputs stay in this browser. AI downloads models on first use."}
                  </p>
                </div>
                {["health", "finance"].includes(activeTool.category) ? (
                  <p className="help-warning">
                    Calculations are estimates. Check important decisions with a
                    qualified professional.
                  </p>
                ) : null}
                <a className="text-link" href={routeHref("contact/")}>
                  Report an issue →
                </a>
                <h2 className="related-heading">More to explore</h2>
                {TOOL_LIST.filter(
                  (t) =>
                    t.category === activeTool.category &&
                    t.id !== activeTool.id,
                )
                  .slice(0, 4)
                  .map((t) => (
                    <a
                      className="related-tool"
                      href={routeHref(`tools/${t.id}/`)}
                      key={t.id}
                    >
                      {t.name}
                      <Icon name="arrow" size={15} />
                    </a>
                  ))}
              </aside>
            </div>
            <section className="tool-explainer">
              <h2>Make the most of {activeTool.name.toLowerCase()}</h2>
              <p>
                {activeTool.description}{" "}
                {activeTool.engine === "lifestyle"
                  ? "Persistent planners save on this browser. Calculator results are temporary; use their download controls to keep them."
                  : "Processing runs on your device. Keep original files and check exported results before sharing them."}
              </p>
              <details>
                <summary>Do I need an account?</summary>
                <p>
                  No. Tools work without signing up. Local data does not sync
                  between devices.
                </p>
              </details>
              <details>
                <summary>How do I keep my results?</summary>
                <p>
                  Use the tool’s copy or download controls where available. Back
                  up daily-life data from My space. Clearing browser site data
                  removes local saves.
                </p>
              </details>
              <details>
                <summary>Can I use this on my phone?</summary>
                <p>
                  Yes, the layout adapts to phones. Larger files and AI models
                  need more memory and a current browser.
                </p>
              </details>
            </section>
            <ReportTool tool={activeTool.id} />
            <AdPlacement placement="tool" />
          </div>
        ) : route === "" ? (
          <>
            <section className="home-hero page-width">
              <div className="hero-copy-new">
                <span className="hero-pill">
                  <span /> THE EVERYDAY TOOLKIT / VOL. 01
                </span>
                <h1>
                  Small tasks.
                  <br />
                  <span>Big possibilities.</span>
                </h1>
                <p>
                  Make, fix, convert. Plan a little better. A collection of
                  useful tools for whatever your day throws at you.
                </p>
                <div className="hero-buttons">
                  <a className="site-primary" href={routeHref("tools/")}>
                    Find your next tool <Icon name="arrow" size={18} />
                  </a>
                  <a className="hero-secondary" href={routeHref("daily/")}>
                    Your daily space ↗
                  </a>
                </div>
                <div className="hero-small-stats">
                  <strong>{TOOL_LIST.length} tools</strong>
                  <span>{Object.keys(CATEGORY_LABELS).length} categories</span>
                  <span>Free. No account.</span>
                </div>
              </div>
              <div
                className="workbench-art"
                onPointerMove={(e) => {
                  if (
                    e.pointerType !== "mouse" ||
                    matchMedia("(prefers-reduced-motion: reduce)").matches
                  )
                    return;
                  cancelAnimationFrame(tiltFrame.current);
                  const target = e.currentTarget,
                    x = e.clientX,
                    y = e.clientY;
                  tiltFrame.current = requestAnimationFrame(() => {
                    const r = target.getBoundingClientRect();
                    target.style.setProperty(
                      "--tilt-x",
                      `${((x - r.left - r.width / 2) / r.width) * 8}deg`,
                    );
                    target.style.setProperty(
                      "--tilt-y",
                      `${(-(y - r.top - r.height / 2) / r.height) * 8}deg`,
                    );
                  });
                }}
                onPointerLeave={(e) => {
                  cancelAnimationFrame(tiltFrame.current);
                  e.currentTarget.style.setProperty("--tilt-x", "0deg");
                  e.currentTarget.style.setProperty("--tilt-y", "0deg");
                }}
              >
                <div className="art-corner">TOOLS FOR THE WAY YOU LIVE</div>
                <div className="art-background" aria-hidden="true">
                  <div className="art-orbit" />
                  <div className="art-grid" />
                </div>
                <div className="art-stage">
                  <a
                    className="art-tool art-photo"
                    href={routeHref("tools/passport-photo-maker/")}
                    aria-label="Open passport photo studio"
                  >
                    <span>PHOTO LAB</span>
                    <svg viewBox="0 0 180 180" aria-hidden="true">
                      <rect x="34" y="19" width="112" height="140" rx="2" />
                      <circle cx="90" cy="68" r="24" />
                      <path d="M55 139v-18c0-30 70-30 70 0v18M17 40V10h30M133 10h30v30M163 138v30h-30M47 168H17v-30" />
                    </svg>
                    <div>
                      Picture perfect.
                      <Icon name="arrow" size={22} />
                    </div>
                  </a>
                  <a
                    className="art-tool art-planner"
                    href={routeHref("tools/daily-planner/")}
                    aria-label="Open daily planner"
                  >
                    <span>MAKE A LITTLE PLAN</span>
                    <div className="art-todo">
                      <i>✓</i>
                      <b>One thing at a time.</b>
                      <i>✓</i>
                      <b>A little less chaos.</b>
                      <i />
                      <b>More room for you.</b>
                    </div>
                    <div>
                      Today, sorted.
                      <Icon name="arrow" size={20} />
                    </div>
                  </a>
                  <a
                    className="art-tool art-files"
                    href={routeHref("tools/merge-pdf/")}
                    aria-label="Open PDF tools"
                  >
                    <span>FILE SOMETHING GOOD</span>
                    <Icon name="document" size={58} />
                    <div>
                      PDF, meet possibility.
                      <Icon name="arrow" size={20} />
                    </div>
                  </a>
                  <div className="art-stamp" aria-hidden="true">
                    <span>134</span>
                    <small>
                      USEFUL
                      <br />
                      TOOLS
                    </small>
                  </div>
                  <a
                    className="art-launch"
                    href={routeHref("tools/")}
                    aria-label="Explore all tools"
                  >
                    <Icon name="arrow" size={32} />
                  </a>
                </div>
                <div className="art-caption">
                  <span>NO INSTALL. NO ACCOUNT.</span>
                  <span>JUST GET IT DONE. ↗</span>
                </div>
              </div>
            </section>
            <div
              className="tool-ticker"
              aria-label="Create, convert, organise and get on with your day"
            >
              <div>
                {[0, 1].map((n) => (
                  <span key={n} aria-hidden={n === 1}>
                    CREATE <i>✳</i> CONVERT <i>✳</i> ORGANISE <i>✳</i> GET ON
                    WITH YOUR DAY <i>✳</i>
                  </span>
                ))}
              </div>
            </div>
            <section className="home-section page-width">
              <div className="section-heading">
                <div>
                  <span className="eyeline">GOOD TO HAVE AROUND</span>
                  <h2>Meet your new shortcuts.</h2>
                </div>
                <a className="text-link" href={routeHref("tools/")}>
                  See every tool →
                </a>
              </div>
              <div className="catalog-grid home-grid">
                {[
                  "daily-planner",
                  "habit-tracker",
                  "passport-photo-maker",
                  "expense-tracker",
                  "shopping-list",
                  "focus-timer",
                  "merge-pdf",
                  "qr-code-generator",
                ].map((id) => card(TOOL_LIST.find((t) => t.id === id)!))}
              </div>
            </section>
            <section className="home-section page-width">
              <div className="section-heading">
                <div>
                  <span className="eyeline">WHAT ARE WE DOING TODAY?</span>
                  <h2>Pick a lane. Make it happen.</h2>
                </div>
              </div>
              {categories}
            </section>
            <section className="home-section page-width">
              <div className="section-heading">
                <div>
                  <span className="eyeline">A LITTLE KNOW-HOW</span>
                  <h2>Good tools. Better ideas.</h2>
                </div>
                <a className="text-link" href={routeHref("guides/")}>
                  All guides →
                </a>
              </div>
              <div className="guide-grid">
                {GUIDES.slice(0, 3).map((g) => (
                  <a
                    className="guide-card"
                    href={routeHref(`guides/${g.slug}/`)}
                    key={g.slug}
                  >
                    <h2>{g.title}</h2>
                    <p>{g.description}</p>
                    <span className="text-link">Read guide →</span>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : route === "daily" ? (
          <section className="content-page page-width">
            <DailyHub />
            <div className="section-heading">
              <div>
                <span className="eyeline">SMALL TOOLS, DAILY USE</span>
                <h2>Your everyday toolkit.</h2>
              </div>
              <a className="text-link" href={routeHref("my-space/")}>
                Backups & my data →
              </a>
            </div>
            <div className="catalog-grid home-grid">
              {TOOL_LIST.filter((t) => t.category === "lifestyle").map(card)}
            </div>
          </section>
        ) : route === "my-space" ? (
          <section className="content-page page-width">
            <div className="page-intro">
              <span className="eyeline">MY SPACE</span>
              <h1>Keep your progress.</h1>
              <p>
                Export, restore or clear your daily-life data. Everything stays
                on this device unless you download a backup.
              </p>
            </div>
            <MySpace />
          </section>
        ) : route === "guides" ? (
          <section className="content-page page-width">
            <div className="page-intro">
              <span className="eyeline">PRACTICAL GUIDES</span>
              <h1>A little help goes a long way.</h1>
              <p>
                Clear, useful steps for documents, routines, budgeting and
                browser privacy.
              </p>
            </div>
            {guideCards}
          </section>
        ) : guide ? (
          <article className="content-page article-page page-width">
            <nav className="workspace-breadcrumb">
              <a href={routeHref("guides/")}>All guides</a>
              <span>/</span>
              <span>Practical guide</span>
            </nav>
            <div className="page-intro">
              <span className="eyeline">TOOLINGER GUIDES</span>
              <h1>{guide.title}</h1>
              <p>{guide.description}</p>
            </div>
            <div className="article-layout">
              <div>
                {guide.sections.map((s) => (
                  <section className="article-section" key={s.title}>
                    <h2>{s.title}</h2>
                    <p>{s.body}</p>
                  </section>
                ))}
                <AdPlacement placement="guide" />
              </div>
              <aside className="hub-panel">
                <h2>Tools in this guide</h2>
                {guide.tools.map((id) => (
                  <a
                    className="related-tool"
                    href={routeHref(`tools/${id}/`)}
                    key={id}
                  >
                    {TOOL_LIST.find((t) => t.id === id)?.name} →
                  </a>
                ))}
                <a className="text-link" href={routeHref("my-space/")}>
                  Manage local backups →
                </a>
              </aside>
            </div>
          </article>
        ) : policy ? (
          <article className="content-page policy-page page-width">
            <nav className="workspace-breadcrumb">
              <a href={routeHref("")}>Home</a>
              <span>/</span>
              <span>Policies & support</span>
            </nav>
            <div className="page-intro">
              <span className="eyeline">POLICIES & SUPPORT</span>
              <h1>{policy.title}</h1>
            </div>
            <div className="article-layout">
              <div className="policy-document">
                {policy.body.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                {route === "contact" ? (
                  <a
                    className="daily-primary"
                    href="mailto:lootchaser2026@gmail.com"
                  >
                    Email support
                  </a>
                ) : null}
                {["privacy", "cookies", "advertising"].includes(route) ? (
                  <button
                    className="daily-secondary"
                    onClick={() =>
                      window.dispatchEvent(new Event("toolinger:privacy"))
                    }
                  >
                    Advertising privacy choices
                  </button>
                ) : null}
              </div>
              <aside className="hub-panel">
                <h2>Useful links</h2>
                {Object.entries(LEGAL_CONTENT)
                  .filter(([id]) => id !== route)
                  .map(([id, p]) => (
                    <a
                      className="related-tool"
                      href={routeHref(id + "/")}
                      key={id}
                    >
                      {p.title} →
                    </a>
                  ))}
                <a className="related-tool" href={routeHref("my-space/")}>
                  My space & backups →
                </a>
              </aside>
            </div>
          </article>
        ) : !known ? (
          <section className="content-page page-width empty-state">
            <h1>This page is missing.</h1>
            <p>Your tools are still here.</p>
            <a className="daily-primary" href={routeHref("tools/")}>
              Browse all tools
            </a>
          </section>
        ) : (
          <section
            className="directory-section content-page page-width"
            id="tool-directory"
          >
            <div className="directory-heading">
              <div>
                <span className="eyeline">
                  {category === "favourites" ? "YOUR TOOLKIT" : "THE TOOLKIT"}
                </span>
                <h1>
                  {search
                    ? "Search results"
                    : category === "favourites"
                      ? "Your saved tools"
                      : category === "all"
                        ? "Find your next shortcut."
                        : CATEGORY_LABELS[category as CategoryId]}
                </h1>
                <p>
                  {category === "favourites"
                    ? "Keep your go-to tools close."
                    : category === "all"
                      ? "Explore practical tools for files, words and everyday life."
                      : `Explore ${CATEGORY_LABELS[category as CategoryId].toLowerCase()} with clear controls and local processing.`}
                </p>
              </div>
              <div className="directory-options">
                <span className="tool-count">{tools.length} tools</span>
                <label>
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="popular">Featured first</option>
                    <option value="az">Name A–Z</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="directory-layout">
              <aside className="category-sidebar" aria-label="Tool categories">
                <a
                  className={category === "all" ? "selected" : ""}
                  href={routeHref("tools/")}
                >
                  <Icon size={18} />
                  All tools<span>{TOOL_LIST.length}</span>
                </a>
                <a
                  className={category === "favourites" ? "selected" : ""}
                  href={routeHref("saved/")}
                >
                  <Icon name="star" size={18} />
                  Saved tools<span>{favourites.length}</span>
                </a>
                <div className="category-divider" />
                {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                  <a
                    key={id}
                    className={category === id ? "selected" : ""}
                    href={routeHref(`categories/${id}/`)}
                    aria-current={category === id ? "page" : undefined}
                  >
                    <Icon name={CATEGORY_ICONS[id] ?? "spark"} size={18} />
                    {label}
                    <span>
                      {TOOL_LIST.filter((t) => t.category === id).length}
                    </span>
                  </a>
                ))}
              </aside>
              <div className="directory-content">
                {!search && category === "all" && recent.length ? (
                  <div className="recent-row">
                    <span>Recently opened</span>
                    {recent.map((id) => {
                      const t = TOOL_LIST.find((t) => t.id === id);
                      return t ? (
                        <a key={id} href={routeHref(`tools/${id}/`)}>
                          {t.name}
                        </a>
                      ) : null;
                    })}
                  </div>
                ) : null}
                <div className="catalog-grid">{tools.map(card)}</div>
                {!tools.length ? (
                  <div className="empty-state">
                    <Icon
                      name={category === "favourites" ? "star" : "search"}
                      size={32}
                    />
                    <h3>
                      {category === "favourites" && !search
                        ? "Keep your go-to tools close."
                        : "No tools found."}
                    </h3>
                    <p>
                      {category === "favourites" && !search
                        ? "Tap the star on any tool to save it here."
                        : "Try a shorter search or another category."}
                    </p>
                    <a className="daily-primary" href={routeHref("tools/")}>
                      Browse all tools
                    </a>
                  </div>
                ) : null}
                <AdPlacement placement="directory" />
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer page-width">
        <div className="footer-top">
          <a className="brand-button" href={routeHref("")}>
            <img
              src={assetUrl("toolinger-logo.svg")}
              alt=""
              width="30"
              height="30"
            />
            <span>
              toolinger<span className="brand-dot">.</span>
            </span>
          </a>
          <p>A little help for everyday digital work.</p>
          <span className="footer-privacy">
            <Icon name="shield" size={16} />
            Your files stay yours.
          </span>
        </div>
        <div className="footer-page-links">
          <a href={routeHref("tools/")}>All tools</a>
          <a href={routeHref("daily/")}>Daily dashboard</a>
          <a href={routeHref("saved/")}>Saved tools</a>
          <a href={routeHref("guides/")}>Guides</a>
          <a href={routeHref("my-space/")}>My space & backups</a>
          <a href={routeHref("tools/passport-photo-maker/")}>Photo studio</a>
        </div>
        <div className="footer-bottom-new">
          <span>© {new Date().getFullYear()} Toolinger</span>
          <nav aria-label="Policies">
            {Object.entries(LEGAL_CONTENT).map(([id, p]) => (
              <a key={id} href={routeHref(id + "/")}>
                {p.title.replace("Toolinger", "").trim()}
              </a>
            ))}
            <button onClick={() => setLegalPage("choices")}>
              Privacy choices
            </button>
            <button
              onClick={() =>
                window.dispatchEvent(new Event("toolinger:privacy"))
              }
            >
              Ad privacy choices
            </button>
          </nav>
        </div>
        <a
          href="https://github.com/Subha760/toolbox-pro/releases/download/v4.1.0/Toolinger-4.1.0.apk"
          target="_blank"
          rel="noreferrer"
          className="text-link"
        >
          Download Android app ↗
        </a>
      </footer>
      {menuOpen ? (
        <Dialog
          title="Explore Toolinger"
          close={() => setMenuOpen(false)}
          drawer
        >
          <div className="drawer-categories">
            {[
              ["", "Home"],
              ["tools/", "All tools"],
              ["daily/", "Daily dashboard"],
              ["guides/", "Guides"],
              ["saved/", "Saved tools"],
              ["my-space/", "My space & backups"],
              ...Object.entries(CATEGORY_LABELS).map(([id, label]) => [
                `categories/${id}/`,
                label,
              ]),
            ].map(([path, label]) => (
              <a key={path} href={routeHref(path)}>
                <Icon />
                {label}
                <Icon name="arrow" size={16} />
              </a>
            ))}
          </div>
        </Dialog>
      ) : null}
      {legalPage ? (
        <Dialog title="Privacy choices" close={() => setLegalPage(null)}>
          <div className="policy-body">
            <p>
              Your theme, saved tools and recent tool IDs stay on this device.
              Daily-life data is managed separately in My space.
            </p>
            <button
              className="daily-primary"
              onClick={() => {
                setFavourites([]);
                setRecent([]);
                setTheme("light");
                setNotice("Tool preferences cleared");
              }}
            >
              Clear tool preferences
            </button>
            <p>
              <a className="text-link" href={routeHref("my-space/")}>
                Manage daily-life data →
              </a>
            </p>
            <button
              className="daily-secondary"
              onClick={() => {
                setLegalPage(null);
                window.dispatchEvent(new Event("toolinger:privacy"));
              }}
            >
              Manage advertising choices
            </button>
            <button
              className="daily-secondary"
              onClick={() => {
                setLegalPage(null);
                window.dispatchEvent(new Event("toolinger:usage-privacy"));
              }}
            >
              Manage anonymous usage
            </button>
          </div>
        </Dialog>
      ) : null}
      <UsageChoice />
      <ConsentControls />
      {notice ? (
        <div className="site-toast" role="status">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
export default App;
