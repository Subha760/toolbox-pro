import React, { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
// @ts-ignore
import QRCode from "qrcode";

type CategoryId =
  | "image"
  | "pdf"
  | "text"
  | "document"
  | "developer"
  | "health"
  | "finance"
  | "converter"
  | "facebook"
  | "instagram"
  | "youtube"
  | "utility";

type ToolEngine =
  | "text-transform"
  | "text-analysis"
  | "text-lines"
  | "find-replace"
  | "markdown-preview"
  | "json-tool"
  | "base64"
  | "url-encode"
  | "uuid"
  | "password"
  | "hash"
  | "timestamp"
  | "regex"
  | "color"
  | "simple-calculator"
  | "bmi"
  | "bmr"
  | "calorie"
  | "water"
  | "body-fat"
  | "unit"
  | "qr"
  | "coin"
  | "notepad"
  | "image"
  | "passport"
  | "pdf"
  | "social";

type ToolConfig = {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  keywords: string[];
  engine: ToolEngine;
  mode?: string;
};

const TOOLINGER_CONFIG = {
  ads: {
    enabled: false,
    network: "monetag",
  },
} as const;

const CATEGORY_LABELS: Record<CategoryId, string> = {
  image: "Image Tools",
  pdf: "PDF Tools",
  text: "Text Tools",
  document: "Document Tools",
  developer: "Developer Tools",
  health: "Health Tools",
  finance: "Finance Tools",
  converter: "Unit Converters",
  facebook: "Facebook Tools",
  instagram: "Instagram Tools",
  youtube: "YouTube Tools",
  utility: "Utility Tools",
};

const LEGAL_PAGES = [
  "About",
  "Privacy Policy",
  "Cookie Policy",
  "Terms and Conditions",
  "Disclaimer",
  "Contact",
] as const;

type LegalPage = (typeof LEGAL_PAGES)[number];

const TOOL_LIST: ToolConfig[] = [
  { id: "qr-code-generator", name: "QR Code Generator", category: "image", description: "Create QR codes instantly.", keywords: ["qr", "scan"], engine: "qr" },
  { id: "passport-photo-maker", name: "Passport & ID Photo Maker", category: "image", description: "Prepare ID photos with studio backgrounds.", keywords: ["passport", "id", "photo"], engine: "passport" },
  { id: "image-to-pdf", name: "Image to PDF", category: "image", description: "Convert one or more images to PDF.", keywords: ["image", "pdf"], engine: "image", mode: "image-to-pdf" },
  { id: "image-resizer", name: "Image Resizer", category: "image", description: "Resize image dimensions.", keywords: ["resize"], engine: "image", mode: "resize" },
  { id: "image-format-converter", name: "Image Format Converter", category: "image", description: "Convert PNG/JPG/WEBP.", keywords: ["format", "converter"], engine: "image", mode: "format" },
  { id: "image-compressor", name: "Image Compressor", category: "image", description: "Reduce file size with quality controls.", keywords: ["compress"], engine: "image", mode: "compress" },
  { id: "grayscale-filter", name: "Grayscale Filter", category: "image", description: "Apply grayscale effect.", keywords: ["grayscale"], engine: "image", mode: "grayscale" },
  { id: "sepia-filter", name: "Sepia Filter", category: "image", description: "Apply sepia effect.", keywords: ["sepia"], engine: "image", mode: "sepia" },
  { id: "brightness-contrast", name: "Brightness & Contrast", category: "image", description: "Adjust brightness and contrast.", keywords: ["brightness", "contrast"], engine: "image", mode: "brightness-contrast" },
  { id: "rotate-image", name: "Rotate Image", category: "image", description: "Rotate by angle.", keywords: ["rotate"], engine: "image", mode: "rotate" },
  { id: "flip-image", name: "Flip Image", category: "image", description: "Flip horizontally or vertically.", keywords: ["flip"], engine: "image", mode: "flip" },
  { id: "image-base64", name: "Image to Base64", category: "image", description: "Encode image as Base64.", keywords: ["base64"], engine: "image", mode: "base64" },
  { id: "image-cropper", name: "Image Cropper", category: "image", description: "Crop image center area.", keywords: ["crop"], engine: "image", mode: "crop" },
  { id: "quote-card-generator", name: "Quote Card Generator", category: "image", description: "Create a quote image.", keywords: ["quote", "card"], engine: "image", mode: "quote" },
  { id: "image-watermark", name: "Image Watermark", category: "image", description: "Add text watermark.", keywords: ["watermark"], engine: "image", mode: "watermark" },
  { id: "image-metadata", name: "Image Metadata Viewer", category: "image", description: "View basic metadata.", keywords: ["metadata"], engine: "image", mode: "metadata" },
  { id: "color-picker-image", name: "Color Picker", category: "image", description: "Pick colors from image.", keywords: ["color", "picker"], engine: "image", mode: "color-picker" },
  { id: "image-blur", name: "Image Blur", category: "image", description: "Apply blur.", keywords: ["blur"], engine: "image", mode: "blur" },
  { id: "image-sharpen", name: "Image Sharpen", category: "image", description: "Sharpen image.", keywords: ["sharpen"], engine: "image", mode: "sharpen" },
  { id: "collage-maker", name: "Collage Maker", category: "image", description: "Combine up to four images.", keywords: ["collage"], engine: "image", mode: "collage" },

  { id: "merge-pdf", name: "Merge PDF", category: "pdf", description: "Merge multiple PDFs.", keywords: ["merge", "pdf"], engine: "pdf", mode: "merge" },
  { id: "split-pdf", name: "Split PDF", category: "pdf", description: "Split PDF by page range.", keywords: ["split"], engine: "pdf", mode: "split" },
  { id: "compress-pdf", name: "Compress PDF", category: "pdf", description: "Re-save PDF with stream compression.", keywords: ["compress"], engine: "pdf", mode: "compress" },
  { id: "pdf-rotate", name: "Rotate PDF", category: "pdf", description: "Rotate all pages.", keywords: ["rotate"], engine: "pdf", mode: "rotate" },
  { id: "delete-pdf-pages", name: "Delete PDF Pages", category: "pdf", description: "Remove selected pages.", keywords: ["delete", "pages"], engine: "pdf", mode: "delete-pages" },
  { id: "extract-pdf-pages", name: "Extract PDF Pages", category: "pdf", description: "Extract selected pages.", keywords: ["extract"], engine: "pdf", mode: "extract-pages" },
  { id: "rearrange-pdf-pages", name: "Rearrange PDF Pages", category: "pdf", description: "Reorder pages.", keywords: ["rearrange"], engine: "pdf", mode: "rearrange-pages" },
  { id: "pdf-metadata-viewer", name: "PDF Metadata Viewer", category: "pdf", description: "View metadata and page count.", keywords: ["metadata"], engine: "pdf", mode: "metadata" },
  { id: "add-page-numbers", name: "Add Page Numbers", category: "pdf", description: "Insert page numbers.", keywords: ["page numbers"], engine: "pdf", mode: "page-numbers" },
  { id: "text-to-pdf", name: "Text to PDF", category: "pdf", description: "Convert text to PDF.", keywords: ["text", "pdf"], engine: "pdf", mode: "text-to-pdf" },
  { id: "html-to-pdf", name: "HTML to PDF", category: "pdf", description: "Print clean HTML as PDF.", keywords: ["html", "pdf"], engine: "pdf", mode: "html-to-pdf" },
  { id: "pdf-preview", name: "PDF Preview", category: "pdf", description: "Preview a PDF in browser.", keywords: ["preview"], engine: "pdf", mode: "preview" },

  { id: "word-counter", name: "Word Counter", category: "text", description: "Count words and paragraphs.", keywords: ["words"], engine: "text-analysis", mode: "words" },
  { id: "character-counter", name: "Character Counter", category: "text", description: "Count characters with and without spaces.", keywords: ["characters"], engine: "text-analysis", mode: "characters" },
  { id: "line-counter", name: "Line Counter", category: "text", description: "Count lines quickly.", keywords: ["line"], engine: "text-analysis", mode: "lines" },
  { id: "case-converter", name: "Case Converter", category: "text", description: "Convert text case.", keywords: ["uppercase", "lowercase"], engine: "text-transform", mode: "case" },
  { id: "remove-extra-spaces", name: "Remove Extra Spaces", category: "text", description: "Normalize spacing.", keywords: ["spaces"], engine: "text-transform", mode: "spaces" },
  { id: "find-replace", name: "Find and Replace", category: "text", description: "Find and replace text globally.", keywords: ["replace"], engine: "find-replace" },
  { id: "duplicate-line-remover", name: "Duplicate Line Remover", category: "text", description: "Keep only unique lines.", keywords: ["duplicate", "lines"], engine: "text-lines", mode: "unique" },
  { id: "text-sorter", name: "Text Sorter", category: "text", description: "Sort lines alphabetically.", keywords: ["sort"], engine: "text-lines", mode: "sort" },
  { id: "text-reverser", name: "Text Reverser", category: "text", description: "Reverse text and lines.", keywords: ["reverse"], engine: "text-transform", mode: "reverse" },
  { id: "markdown-preview", name: "Markdown Preview", category: "text", description: "Live markdown preview.", keywords: ["markdown"], engine: "markdown-preview" },
  { id: "sentence-counter", name: "Sentence Counter", category: "text", description: "Count sentence estimates.", keywords: ["sentence"], engine: "text-analysis", mode: "sentences" },
  { id: "reading-time", name: "Reading Time Estimator", category: "text", description: "Estimate reading time.", keywords: ["reading", "time"], engine: "text-analysis", mode: "reading" },
  { id: "slug-generator", name: "Slug Generator", category: "text", description: "Create URL-friendly slugs.", keywords: ["slug", "seo"], engine: "text-transform", mode: "slug" },
  { id: "text-cleaner", name: "Text Cleaner", category: "text", description: "Strip symbols and normalize spaces.", keywords: ["clean"], engine: "text-transform", mode: "clean" },

  { id: "notepad", name: "Notepad", category: "document", description: "Simple browser notepad with local autosave.", keywords: ["note", "pad"], engine: "notepad" },
  { id: "text-to-pdf-doc", name: "Text to PDF", category: "document", description: "Convert typed text to PDF.", keywords: ["text", "pdf"], engine: "pdf", mode: "text-to-pdf" },
  { id: "json-formatter-doc", name: "JSON Formatter", category: "document", description: "Prettify JSON documents.", keywords: ["json"], engine: "json-tool", mode: "format" },
  { id: "json-validator-doc", name: "JSON Validator", category: "document", description: "Validate JSON syntax.", keywords: ["json", "validate"], engine: "json-tool", mode: "validate" },
  { id: "txt-downloader", name: "Quick TXT Downloader", category: "document", description: "Download plain text as TXT.", keywords: ["txt"], engine: "text-transform", mode: "txt-download" },
  { id: "html-formatter-doc", name: "HTML Formatter", category: "document", description: "Format messy HTML.", keywords: ["html", "format"], engine: "text-transform", mode: "html-format" },
  { id: "css-formatter-doc", name: "CSS Formatter", category: "document", description: "Format CSS blocks.", keywords: ["css", "format"], engine: "text-transform", mode: "css-format" },
  { id: "js-formatter-doc", name: "JavaScript Formatter", category: "document", description: "Format JavaScript text.", keywords: ["javascript", "format"], engine: "text-transform", mode: "js-format" },

  { id: "json-formatter", name: "JSON Formatter", category: "developer", description: "Beautify JSON.", keywords: ["json"], engine: "json-tool", mode: "format" },
  { id: "json-validator", name: "JSON Validator", category: "developer", description: "Validate JSON.", keywords: ["json"], engine: "json-tool", mode: "validate" },
  { id: "base64-encoder", name: "Base64 Encoder", category: "developer", description: "Encode text to Base64.", keywords: ["base64", "encode"], engine: "base64", mode: "encode" },
  { id: "base64-decoder", name: "Base64 Decoder", category: "developer", description: "Decode Base64 to text.", keywords: ["base64", "decode"], engine: "base64", mode: "decode" },
  { id: "url-encoder", name: "URL Encoder", category: "developer", description: "Encode URL components.", keywords: ["url"], engine: "url-encode", mode: "encode" },
  { id: "url-decoder", name: "URL Decoder", category: "developer", description: "Decode URL components.", keywords: ["url"], engine: "url-encode", mode: "decode" },
  { id: "html-formatter", name: "HTML Formatter", category: "developer", description: "Format HTML quickly.", keywords: ["html"], engine: "text-transform", mode: "html-format" },
  { id: "css-formatter", name: "CSS Formatter", category: "developer", description: "Format CSS quickly.", keywords: ["css"], engine: "text-transform", mode: "css-format" },
  { id: "javascript-formatter", name: "JavaScript Formatter", category: "developer", description: "Format JavaScript quickly.", keywords: ["javascript"], engine: "text-transform", mode: "js-format" },
  { id: "uuid-generator", name: "UUID Generator", category: "developer", description: "Generate RFC4122 UUIDs.", keywords: ["uuid"], engine: "uuid" },
  { id: "password-generator", name: "Password Generator", category: "developer", description: "Generate secure passwords.", keywords: ["password"], engine: "password" },
  { id: "hash-generator", name: "Hash Generator", category: "developer", description: "Create SHA hashes.", keywords: ["hash", "sha"], engine: "hash" },
  { id: "timestamp-converter", name: "Timestamp Converter", category: "developer", description: "Convert date and Unix timestamp.", keywords: ["timestamp", "unix"], engine: "timestamp" },
  { id: "regex-tester", name: "Regex Tester", category: "developer", description: "Test regular expressions.", keywords: ["regex"], engine: "regex" },
  { id: "color-converter", name: "Color Converter", category: "developer", description: "HEX/RGB conversion.", keywords: ["color", "hex", "rgb"], engine: "color" },

  { id: "bmi-calculator", name: "BMI Calculator", category: "health", description: "Body Mass Index with guidance.", keywords: ["bmi", "weight"], engine: "bmi" },
  { id: "bmr-calculator", name: "BMR Calculator", category: "health", description: "Basal metabolic rate estimator.", keywords: ["bmr"], engine: "bmr" },
  { id: "calorie-calculator", name: "Calorie Calculator", category: "health", description: "Daily calorie needs by goal.", keywords: ["calorie"], engine: "calorie" },
  { id: "water-intake-calculator", name: "Water Intake Calculator", category: "health", description: "Daily hydration estimator.", keywords: ["water"], engine: "water" },
  { id: "body-fat-estimator", name: "Body Fat Estimator", category: "health", description: "Estimate body fat percentage.", keywords: ["body fat"], engine: "body-fat" },

  { id: "emi-calculator", name: "EMI Calculator", category: "finance", description: "Monthly EMI estimate.", keywords: ["emi", "loan"], engine: "simple-calculator", mode: "emi" },
  { id: "simple-interest", name: "Simple Interest Calculator", category: "finance", description: "Compute simple interest.", keywords: ["interest"], engine: "simple-calculator", mode: "simple-interest" },
  { id: "compound-interest", name: "Compound Interest Calculator", category: "finance", description: "Future value with compounding.", keywords: ["compound"], engine: "simple-calculator", mode: "compound-interest" },
  { id: "loan-calculator", name: "Loan Calculator", category: "finance", description: "Loan payment and total cost.", keywords: ["loan"], engine: "simple-calculator", mode: "loan" },
  { id: "discount-calculator", name: "Discount Calculator", category: "finance", description: "Discounted price and savings.", keywords: ["discount"], engine: "simple-calculator", mode: "discount" },
  { id: "gst-calculator", name: "GST Calculator", category: "finance", description: "GST add/remove calculator.", keywords: ["gst", "tax"], engine: "simple-calculator", mode: "gst" },
  { id: "profit-margin", name: "Profit Margin Calculator", category: "finance", description: "Profit, margin, markup.", keywords: ["profit", "margin"], engine: "simple-calculator", mode: "profit" },
  { id: "percentage-calculator", name: "Percentage Calculator", category: "finance", description: "Percent change and value.", keywords: ["percentage"], engine: "simple-calculator", mode: "percentage" },

  { id: "length-converter", name: "Length Converter", category: "converter", description: "Convert length units.", keywords: ["length"], engine: "unit", mode: "length" },
  { id: "weight-converter", name: "Weight Converter", category: "converter", description: "Convert mass units.", keywords: ["weight"], engine: "unit", mode: "weight" },
  { id: "temperature-converter", name: "Temperature Converter", category: "converter", description: "Convert temperature units.", keywords: ["temperature"], engine: "unit", mode: "temperature" },
  { id: "area-converter", name: "Area Converter", category: "converter", description: "Convert area units.", keywords: ["area"], engine: "unit", mode: "area" },
  { id: "volume-converter", name: "Volume Converter", category: "converter", description: "Convert volume units.", keywords: ["volume"], engine: "unit", mode: "volume" },
  { id: "speed-converter", name: "Speed Converter", category: "converter", description: "Convert speed units.", keywords: ["speed"], engine: "unit", mode: "speed" },
  { id: "storage-converter", name: "Data Storage Converter", category: "converter", description: "Convert storage units.", keywords: ["data", "storage"], engine: "unit", mode: "storage" },
  { id: "time-converter", name: "Time Converter", category: "converter", description: "Convert time units.", keywords: ["time"], engine: "unit", mode: "time" },
  { id: "energy-converter", name: "Energy Converter", category: "converter", description: "Convert energy units.", keywords: ["energy"], engine: "unit", mode: "energy" },
  { id: "pressure-converter", name: "Pressure Converter", category: "converter", description: "Convert pressure units.", keywords: ["pressure"], engine: "unit", mode: "pressure" },

  { id: "facebook-post-formatter", name: "Facebook Post Formatter", category: "facebook", description: "Structure readable posts.", keywords: ["facebook", "post"], engine: "social", mode: "post" },
  { id: "facebook-caption-generator", name: "Facebook Caption Generator", category: "facebook", description: "Generate polished caption blocks.", keywords: ["caption"], engine: "social", mode: "caption" },
  { id: "facebook-hashtag-helper", name: "Facebook Hashtag Helper", category: "facebook", description: "Clean and organize hashtags.", keywords: ["hashtag"], engine: "social", mode: "hashtags" },
  { id: "facebook-engagement-planner", name: "Engagement Time Planner", category: "facebook", description: "Generate post timing plan.", keywords: ["engagement", "planner"], engine: "social", mode: "planner" },
  { id: "facebook-dimension-guide", name: "Image Dimension Guide", category: "facebook", description: "Quick visual size references.", keywords: ["dimension"], engine: "social", mode: "dimensions" },

  { id: "instagram-caption-formatter", name: "Caption Formatter", category: "instagram", description: "Format Instagram captions.", keywords: ["instagram", "caption"], engine: "social", mode: "caption" },
  { id: "instagram-hashtag-organizer", name: "Hashtag Organizer", category: "instagram", description: "Sort hashtags by uniqueness.", keywords: ["hashtags"], engine: "social", mode: "hashtags" },
  { id: "instagram-bio-counter", name: "Bio Character Counter", category: "instagram", description: "Track bio length.", keywords: ["bio", "counter"], engine: "social", mode: "bio" },
  { id: "instagram-dimension-helper", name: "Image Dimension Helper", category: "instagram", description: "Sizes for posts/reels/stories.", keywords: ["dimension"], engine: "social", mode: "dimensions" },
  { id: "instagram-reel-caption", name: "Reel Caption Helper", category: "instagram", description: "Build concise reel captions.", keywords: ["reel", "caption"], engine: "social", mode: "reel" },

  { id: "youtube-title-counter", name: "Title Character Counter", category: "youtube", description: "Track title length.", keywords: ["youtube", "title"], engine: "social", mode: "yt-title" },
  { id: "youtube-description-formatter", name: "Description Formatter", category: "youtube", description: "Format long descriptions.", keywords: ["description"], engine: "social", mode: "yt-description" },
  { id: "youtube-tag-organizer", name: "Tag Organizer", category: "youtube", description: "Clean and sort tags.", keywords: ["tags"], engine: "social", mode: "yt-tags" },
  { id: "youtube-thumbnail-dimensions", name: "Thumbnail Dimension Helper", category: "youtube", description: "Thumbnail size references.", keywords: ["thumbnail"], engine: "social", mode: "dimensions" },
  { id: "youtube-timestamp-generator", name: "Timestamp Generator", category: "youtube", description: "Generate chapter timestamps.", keywords: ["timestamp"], engine: "social", mode: "yt-timestamps" },
  { id: "youtube-template-generator", name: "Video Description Template Generator", category: "youtube", description: "Create repeatable templates.", keywords: ["template"], engine: "social", mode: "yt-template" },

  { id: "coin-flip", name: "Coin Flip", category: "utility", description: "Animated 3D coin flip with sound.", keywords: ["coin", "flip"], engine: "coin" },
  { id: "random-number-generator", name: "Random Number Generator", category: "utility", description: "Generate random numbers in range.", keywords: ["random", "number"], engine: "simple-calculator", mode: "random-number" },
  { id: "random-name-picker", name: "Random Name Picker", category: "utility", description: "Pick random entry from list.", keywords: ["random", "picker"], engine: "text-lines", mode: "pick" },
  { id: "countdown-helper", name: "Countdown Helper", category: "utility", description: "Days until selected date.", keywords: ["countdown"], engine: "simple-calculator", mode: "countdown" },
  { id: "age-calculator", name: "Age Calculator", category: "utility", description: "Calculate age from birth date.", keywords: ["age"], engine: "simple-calculator", mode: "age" },
  { id: "tip-calculator", name: "Tip Calculator", category: "utility", description: "Calculate tips and split bill.", keywords: ["tip", "bill"], engine: "simple-calculator", mode: "tip" },
  { id: "binary-converter", name: "Binary Converter", category: "utility", description: "Convert text to/from binary.", keywords: ["binary"], engine: "text-transform", mode: "binary" },
  { id: "lorem-generator", name: "Lorem Ipsum Generator", category: "utility", description: "Generate sample paragraphs.", keywords: ["lorem"], engine: "text-transform", mode: "lorem" },
];

const UNIT_OPTIONS: Record<
  string,
  { units: string[]; toBase: (value: number, unit: string) => number; fromBase: (value: number, unit: string) => number }
> = {
  length: {
    units: ["meter", "kilometer", "centimeter", "mile", "foot", "inch"],
    toBase: (value, unit) => {
      const map: Record<string, number> = { meter: 1, kilometer: 1000, centimeter: 0.01, mile: 1609.344, foot: 0.3048, inch: 0.0254 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { meter: 1, kilometer: 0.001, centimeter: 100, mile: 0.000621371, foot: 3.28084, inch: 39.3701 };
      return value * map[unit];
    },
  },
  weight: {
    units: ["kilogram", "gram", "pound", "ounce"],
    toBase: (value, unit) => {
      const map: Record<string, number> = { kilogram: 1, gram: 0.001, pound: 0.453592, ounce: 0.0283495 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { kilogram: 1, gram: 1000, pound: 2.20462, ounce: 35.274 };
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
      const map: Record<string, number> = { "sq-meter": 1, "sq-kilometer": 1_000_000, "sq-foot": 0.092903, acre: 4046.86 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { "sq-meter": 1, "sq-kilometer": 0.000001, "sq-foot": 10.7639, acre: 0.000247105 };
      return value * map[unit];
    },
  },
  volume: {
    units: ["liter", "milliliter", "cubic-meter", "gallon"],
    toBase: (value, unit) => {
      const map: Record<string, number> = { liter: 1, milliliter: 0.001, "cubic-meter": 1000, gallon: 3.78541 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { liter: 1, milliliter: 1000, "cubic-meter": 0.001, gallon: 0.264172 };
      return value * map[unit];
    },
  },
  speed: {
    units: ["mps", "kph", "mph"],
    toBase: (value, unit) => {
      const map: Record<string, number> = { mps: 1, kph: 0.277778, mph: 0.44704 };
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
      const map: Record<string, number> = { byte: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { byte: 1, kb: 1 / 1024, mb: 1 / 1024 ** 2, gb: 1 / 1024 ** 3, tb: 1 / 1024 ** 4 };
      return value * map[unit];
    },
  },
  time: {
    units: ["second", "minute", "hour", "day"],
    toBase: (value, unit) => {
      const map: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { second: 1, minute: 1 / 60, hour: 1 / 3600, day: 1 / 86400 };
      return value * map[unit];
    },
  },
  energy: {
    units: ["joule", "kilojoule", "calorie", "kwh"],
    toBase: (value, unit) => {
      const map: Record<string, number> = { joule: 1, kilojoule: 1000, calorie: 4.184, kwh: 3_600_000 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { joule: 1, kilojoule: 0.001, calorie: 0.239006, kwh: 1 / 3_600_000 };
      return value * map[unit];
    },
  },
  pressure: {
    units: ["pascal", "bar", "psi", "atm"],
    toBase: (value, unit) => {
      const map: Record<string, number> = { pascal: 1, bar: 100000, psi: 6894.76, atm: 101325 };
      return value * map[unit];
    },
    fromBase: (value, unit) => {
      const map: Record<string, number> = { pascal: 1, bar: 0.00001, psi: 0.000145038, atm: 0.00000986923 };
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

const FEATURED_TOOL_IDS = [
  "image-resizer",
  "passport-photo-maker",
  "compress-pdf",
  "password-generator",
  "image-to-pdf",
  "word-counter",
];

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

const toolListBtn =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-700";

const metricBox =
  "rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur";

const adSlot =
  "mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400";

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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

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
  document.execCommand("copy");
  textarea.remove();
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
  includeUpper: boolean,
  includeLower: boolean,
  includeNumbers: boolean,
  includeSymbols: boolean
) => {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?/";

  let source = "";
  if (includeUpper) source += upper;
  if (includeLower) source += lower;
  if (includeNumbers) source += numbers;
  if (includeSymbols) source += symbols;

  if (!source) source = lower;

  const cryptoObj = globalThis.crypto as Crypto | undefined;
  let output = "";

  while (output.length < length) {
    if (cryptoObj?.getRandomValues) {
      const values = new Uint32Array(length - output.length);
      cryptoObj.getRandomValues(values);
      const max = Math.floor(0x100000000 / source.length) * source.length;

      for (const value of values) {
        if (value % max < max) {
          const char = source[value % source.length];
          if (char) output += char;
        }
      }
    } else {
      for (let i = 0; i < length - output.length; i += 1) {
        const char = source[Math.floor(Math.random() * source.length)];
        if (char) output += char;
      }
    }
  }

  return output.slice(0, length);
};

const canvasToBlob = (canvas: HTMLCanvasElement, type = "image/png", quality?: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas export failed"));
    }, type, quality);
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
  height: number
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
  return <div className={`${glassPanel} space-y-4`}>{children}</div>;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  if (!text.trim()) return null;

  return (
    <button
      type="button"
      className={secondaryBtn}
      onClick={async () => {
        await copyToClipboard(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TextTransformTool({ mode }: { mode: string }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const runTool = () => {
    if (mode === "txt-download") {
      if (!input.trim()) {
        setOutput("Please enter text to download.");
        return;
      }
      downloadBlob(new Blob([input], { type: "text/plain;charset=utf-8" }), "toolinger-note.txt");
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
          ].join("\n\n")
        );
        break;
      case "spaces":
        setOutput(input.replace(/\s+/g, " ").trim());
        break;
      case "reverse":
        setOutput(
          [
            `Characters:\n${input.split("").reverse().join("")}`,
            `Lines:\n${input.split("\n").reverse().join("\n")}`,
          ].join("\n\n")
        );
        break;
      case "slug":
        setOutput(
          input
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
        );
        break;
      case "clean":
        setOutput(input.replace(/[^\w\s.,!?@#%&*()\-:+/\\]/g, "").replace(/\s+/g, " ").trim());
        break;
      case "binary": {
        const trimmed = input.trim();
        const maybeBinary = /^[01\s]+$/.test(trimmed);
        if (maybeBinary) {
          const decoded = trimmed
            .split(/\s+/)
            .map((byte) => String.fromCharCode(parseInt(byte, 2)))
            .join("");
          setOutput(decoded);
        } else {
          setOutput(input.split("").map((char) => char.charCodeAt(0).toString(2).padStart(8, "0")).join(" "));
        }
        break;
      }
      case "html-format":
      case "css-format":
      case "js-format": {
        const formatted = input
          .replace(/>\s*</g, ">\n<")
          .replace(/[{}]/g, (match) => `${match}\n`)
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join("\n");
        setOutput(formatted);
        break;
      }
      default:
        setOutput(input);
    }
  };

  const downloadTxt = () => {
    if (!input.trim()) return;
    downloadBlob(new Blob([input], { type: "text/plain;charset=utf-8" }), "toolinger-note.txt");
  };

  return (
    <ToolPanel>
      <textarea
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
      <textarea value={output} readOnly className={`${inputClass} min-h-40`} placeholder="Result" />
    </ToolPanel>
  );
}

function TextAnalysisTool({ mode }: { mode: string }) {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const lines = text ? text.split("\n").length : 0;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
    const sentenceCount = text.split(/[.!?]+/).filter((value) => value.trim()).length;
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
        value={text}
        onChange={(event) => setText(event.target.value)}
        className={`${inputClass} min-h-44`}
        placeholder="Paste text"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {(mode === "words" || mode === "characters" || mode === "lines" || mode === "sentences" || mode === "reading") && (
          <>
            <div className={resultBox}>Words: {stats.words}</div>
            <div className={resultBox}>Characters: {stats.chars}</div>
            <div className={resultBox}>Characters (no spaces): {stats.charsNoSpaces}</div>
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
  const [input, setInput] = useState("");
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
      <textarea value={output} readOnly className={`${inputClass} min-h-32`} placeholder="Result" />
    </ToolPanel>
  );
}

function FindReplaceTool() {
  const [text, setText] = useState("");
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
      <textarea className={`${inputClass} min-h-36`} value={result} readOnly placeholder="Result" />
    </ToolPanel>
  );
}

function MarkdownPreviewTool() {
  const [text, setText] = useState("# Toolinger\n\nWrite markdown here.");

  const preview = useMemo(() => {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/^###\s(.+)$/gm, '<h3 class="mt-4 text-xl font-bold text-slate-900">$1</h3>')
      .replace(/^##\s(.+)$/gm, '<h2 class="mt-5 text-2xl font-bold text-slate-900">$1</h2>')
      .replace(/^#\s(.+)$/gm, '<h1 class="mt-6 text-3xl font-extrabold text-slate-900">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85rem]">$1</code>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" class="font-medium text-violet-700 underline">$1</a>'
      )
      .replace(/\n/g, "<br />");
  }, [text]);

  return (
    <ToolPanel>
      <div className="grid gap-3 md:grid-cols-2">
        <textarea className={`${inputClass} min-h-48`} value={text} onChange={(event) => setText(event.target.value)} />
        <div className={`${inputClass} min-h-48 overflow-auto`} dangerouslySetInnerHTML={{ __html: preview }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy Markdown" />
      </div>
    </ToolPanel>
  );
}

function JsonTool({ mode }: { mode: string }) {
  const [input, setInput] = useState('{"tool":"toolinger"}');
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
      <textarea className={`${inputClass} min-h-44`} value={input} onChange={(event) => setInput(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Run Tool
        </button>
        <CopyButton text={result} label="Copy Result" />
      </div>
      {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <textarea className={`${inputClass} min-h-32`} value={result} readOnly />
    </ToolPanel>
  );
}

function Base64Tool({ mode }: { mode: string }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const run = () => {
    try {
      if (mode === "encode") {
        const bytes = new TextEncoder().encode(input);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
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
      <textarea className={`${inputClass} min-h-40`} value={result} readOnly placeholder="Result" />
    </ToolPanel>
  );
}

function UrlTool({ mode }: { mode: string }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");

  const run = () => {
    try {
      setResult(mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input));
    } catch {
      setResult("Unable to decode this URL string.");
    }
  };

  return (
    <ToolPanel>
      <textarea
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
      <textarea className={`${inputClass} min-h-36`} value={result} readOnly />
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
      <textarea className={`${inputClass} min-h-44`} readOnly value={result} />
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
    setResult(randomPassword(safeLength, includeUpper, includeLower, includeNumbers, includeSymbols));
  };

  const enabledTypes = [includeUpper, includeLower, includeNumbers, includeSymbols].filter(Boolean).length;
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
          onChange={(event) => setLength(clamp(Number(event.target.value), 8, 64))}
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
      <input className={inputClass} value={result} readOnly placeholder="Password" />
      <div className={resultBox}>Strength: {strength}</div>
    </ToolPanel>
  );
}

function HashTool() {
  const [input, setInput] = useState("");
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
      setError("Web Crypto is unavailable. Use HTTPS or localhost for SHA hashing.");
      return;
    }

    try {
      const buffer = new TextEncoder().encode(input);
      const hash = await subtle.digest(algorithm, buffer);
      const view = Array.from(new Uint8Array(hash));
      setResult(view.map((value) => value.toString(16).padStart(2, "0")).join(""));
      setError("");
    } catch {
      setResult("");
      setError("Unable to generate hash.");
    }
  };

  return (
    <ToolPanel>
      <textarea
        className={`${inputClass} min-h-32`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Text to hash"
      />
      <select className={inputClass} value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
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
      {error ? <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div> : null}
      <textarea className={`${inputClass} min-h-32`} value={result} readOnly />
    </ToolPanel>
  );
}

function TimestampTool() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000).toString());

  const safeDate = new Date(date);
  const timestampFromDate = Number.isNaN(safeDate.getTime()) ? "" : Math.floor(safeDate.getTime() / 1000);
  const safeTimestamp = Number(timestamp);
  const dateFromTimestamp = Number.isNaN(safeTimestamp)
    ? "Invalid timestamp"
    : new Date(safeTimestamp * 1000).toString();

  return (
    <ToolPanel>
      <Field label="Date and Time">
        <input type="datetime-local" className={inputClass} value={date} onChange={(event) => setDate(event.target.value)} />
      </Field>
      <div className={resultBox}>Unix Timestamp: {timestampFromDate || "Enter a valid date"}</div>
      <Field label="Unix Timestamp (seconds)">
        <input className={inputClass} value={timestamp} onChange={(event) => setTimestamp(event.target.value)} />
      </Field>
      <div className={resultBox}>Date: {dateFromTimestamp}</div>
    </ToolPanel>
  );
}

function RegexTool() {
  const [pattern, setPattern] = useState("\\btool\\w*");
  const [flags, setFlags] = useState("gi");
  const [text, setText] = useState("Toolinger offers tool access in one place.");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const run = () => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(text.matchAll(regex)).map(
        (match, index) => `${index + 1}. ${JSON.stringify(match[0])} @ index ${match.index}`
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
        <input className={inputClass} value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="Pattern" />
        <input className={inputClass} value={flags} onChange={(event) => setFlags(event.target.value)} placeholder="Flags" />
      </div>
      <textarea className={`${inputClass} min-h-32`} value={text} onChange={(event) => setText(event.target.value)} placeholder="Test text" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Test Regex
        </button>
        <CopyButton text={result} label="Copy Matches" />
      </div>
      {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <textarea className={`${inputClass} min-h-32`} readOnly value={result} />
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
    if (parts.length !== 3 || parts.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
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
          <input className={inputClass} value={hex} onChange={(event) => setHex(event.target.value)} />
        </Field>
        <Field label="RGB">
          <input className={inputClass} value={rgb} onChange={(event) => setRgb(event.target.value)} />
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
      <div className={resultBox}>{message || "Pick a color or convert values."}</div>
      <div className="h-16 rounded-xl border border-white/70" style={{ background: hex }} />
    </ToolPanel>
  );
}

function SimpleCalculatorTool({ mode }: { mode: string }) {
  const [values, setValues] = useState<Record<string, string>>({ a: "", b: "", c: "", d: "" });
  const [nonce, setNonce] = useState(0);

  const isRandom = mode === "random-number";

  const result = useMemo(() => {
    const a = Number(values.a);
    const b = Number(values.b);
    const c = Number(values.c);
    const rand = Math.random();

    switch (mode) {
      case "emi": {
        if (a <= 0 || c <= 0 || !Number.isFinite(b)) return "Enter principal, annual interest %, and tenure months.";
        const r = b / 1200;
        const payment = r === 0 ? a / c : (a * r * (1 + r) ** c) / ((1 + r) ** c - 1);
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
        if (a <= 0 || c <= 0 || !Number.isFinite(b)) return "Enter amount, annual rate %, and months.";
        const r = b / 1200;
        const emi = r === 0 ? a / c : (a * r * (1 + r) ** c) / ((1 + r) ** c - 1);
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
              ((b - a) / a) * 100
            )}%`
          : "Enter cost and selling price.";
      case "percentage": {
        if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(b)) return "Enter base value and percentage.";
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
        return days >= 0 ? `${days} days remaining.` : `${Math.abs(days)} days passed.`;
      }
      case "age": {
        const birth = new Date(values.a);
        const now = new Date();
        if (Number.isNaN(birth.getTime())) return "Select date of birth.";
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
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

  const fieldLabels = labels[mode] ?? ["Value A", "Value B", "Value C", "Value D"];

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
                onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              />
            </Field>
          );
        })}
      </div>
      {isRandom ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryBtn} onClick={() => setNonce((n) => n + 1)}>
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
    const delta = weight < minHealthy ? minHealthy - weight : weight > maxHealthy ? weight - maxHealthy : 0;

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
          <input className={inputClass} value={heightCm} onChange={(event) => setHeightCm(event.target.value)} />
        </Field>
        <Field label="Weight (kg)">
          <input className={inputClass} value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
        </Field>
      </div>
      {summary ? (
        <div className="space-y-2">
          <div className={resultBox}>BMI: {formatNumber(summary.bmi)}</div>
          <div className={resultBox}>Classification: {summary.classification}</div>
          <div className={resultBox}>
            Healthy range: {formatNumber(summary.minHealthy)}kg - {formatNumber(summary.maxHealthy)}kg
          </div>
          <div className={resultBox}>
            {summary.message}: {summary.delta ? `${formatNumber(summary.delta)}kg` : "0kg"}
          </div>
        </div>
      ) : (
        <div className={resultBox}>Enter valid height and weight.</div>
      )}
      <p className="text-xs text-slate-600">Disclaimer: This calculator is for informational purposes and not a medical diagnosis.</p>
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
    return sex === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  }, [sex, age, weight, height]);

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sex">
          <select className={inputClass} value={sex} onChange={(event) => setSex(event.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Age">
          <input className={inputClass} value={age} onChange={(event) => setAge(event.target.value)} />
        </Field>
        <Field label="Weight (kg)">
          <input className={inputClass} value={weight} onChange={(event) => setWeight(event.target.value)} />
        </Field>
        <Field label="Height (cm)">
          <input className={inputClass} value={height} onChange={(event) => setHeight(event.target.value)} />
        </Field>
      </div>
      <div className={resultBox}>BMR: {bmr ? `${formatNumber(bmr)} kcal/day` : "Enter valid values."}</div>
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
        <input className={inputClass} value={bmrValue} onChange={(event) => setBmrValue(event.target.value)} />
      </Field>
      <Field label="Activity Level">
        <select className={inputClass} value={activity} onChange={(event) => setActivity(Number(event.target.value))}>
          <option value={1.2}>Sedentary</option>
          <option value={1.375}>Lightly Active</option>
          <option value={1.55}>Moderately Active</option>
          <option value={1.725}>Very Active</option>
        </select>
      </Field>
      <div className={resultBox}>Maintenance calories: {formatNumber(tdee)} kcal/day</div>
      <div className={resultBox}>Weight loss target: {formatNumber(tdee - 500)} kcal/day</div>
      <div className={resultBox}>Weight gain target: {formatNumber(tdee + 300)} kcal/day</div>
    </ToolPanel>
  );
}

function WaterTool() {
  const [weight, setWeight] = useState("70");
  const liters = (Number(weight) * 35) / 1000;
  return (
    <ToolPanel>
      <Field label="Weight (kg)">
        <input className={inputClass} value={weight} onChange={(event) => setWeight(event.target.value)} />
      </Field>
      <div className={resultBox}>Suggested water intake: {formatNumber(liters)} liters/day</div>
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
      return 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    }
    if (hp <= 0) return null;
    return 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.221 * Math.log10(h)) - 450;
  }, [sex, waist, neck, height, hip]);

  return (
    <ToolPanel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sex">
          <select className={inputClass} value={sex} onChange={(event) => setSex(event.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Waist (cm)">
          <input className={inputClass} value={waist} onChange={(event) => setWaist(event.target.value)} />
        </Field>
        <Field label="Neck (cm)">
          <input className={inputClass} value={neck} onChange={(event) => setNeck(event.target.value)} />
        </Field>
        <Field label="Height (cm)">
          <input className={inputClass} value={height} onChange={(event) => setHeight(event.target.value)} />
        </Field>
        {sex === "female" ? (
          <Field label="Hip (cm)" className="sm:col-span-2">
            <input className={inputClass} value={hip} onChange={(event) => setHip(event.target.value)} />
          </Field>
        ) : null}
      </div>
      <div className={resultBox}>Estimated Body Fat: {estimate ? `${formatNumber(estimate)}%` : "Enter valid measurements."}</div>
      <p className="text-xs text-slate-600">Disclaimer: Informational estimate only.</p>
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
          <input className={inputClass} value={value} onChange={(event) => setValue(event.target.value)} />
        </Field>
        <Field label="From">
          <select className={inputClass} value={fromUnit} onChange={(event) => setFromUnit(event.target.value)}>
            {config.units.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit] ?? unit}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select className={inputClass} value={toUnit} onChange={(event) => setToUnit(event.target.value)}>
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
  const [text, setText] = useState("https://toolinger.com");
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
        <input className={inputClass} value={text} onChange={(event) => setText(event.target.value)} placeholder="URL or text" />
      </Field>
      <Field label="Size (128-1024)">
        <input className={inputClass} value={sizeRaw} onChange={(event) => setSizeRaw(event.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryBtn} onClick={generate}>
          Generate QR
        </button>
      </div>
      {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {qrSrc ? (
        <div className="space-y-3">
          <img src={qrSrc} alt="Generated QR code" className="mx-auto w-full max-w-56 rounded-xl bg-white p-2" />
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
  const [result, setResult] = useState("Heads");
  const [sound, setSound] = useState(true);

  const playFlipSound = () => {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;

      const context = new Ctor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(650, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(170, context.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);

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
    window.setTimeout(() => {
      setResult(next);
      setIsFlipping(false);
    }, 1400);
  };

  return (
    <ToolPanel>
      <label className="flex items-center justify-between text-sm font-medium text-slate-700">
        Coin sound
        <input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} className="h-5 w-5 accent-violet-600" />
      </label>
      <div className="coin-zone">
        <div className={`coin ${isFlipping ? "coin-flipping" : ""}`} aria-live="polite">
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
          page.drawText(line.slice(i, i + 95), { x: 40, y, size: 11, font, color: rgb(0.1, 0.1, 0.2) });
          y -= 14;
        }
      }

      const bytes = await pdf.save();
      downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-notepad.pdf");
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
            downloadBlob(new Blob([text], { type: "text/plain" }), "toolinger-note.txt");
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
      <div className={resultBox}>{status || "Autosaved locally in your browser."}</div>
    </ToolPanel>
  );
}

function SocialTool({ mode }: { mode: string }) {
  const [input, setInput] = useState("");
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
          .map((line, index) => `${String(index).padStart(2, "0")}:00 ${line || `Section ${index + 1}`}`);
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
        className={`${inputClass} min-h-36`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Enter draft content"
      />
      {(mode === "caption" || mode === "reel" || mode === "yt-template") && (
        <textarea
          className={`${inputClass} min-h-24`}
          value={secondary}
          onChange={(event) => setSecondary(event.target.value)}
          placeholder="Optional supporting line"
        />
      )}
      <textarea className={`${inputClass} min-h-44`} readOnly value={output} />
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
  const [html, setHtml] = useState("<h1>Toolinger</h1><p>Print this as PDF.</p>");
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const parsePages = (raw: string, total: number) =>
    raw
      .split(",")
      .map((value) => Number(value.trim()) - 1)
      .filter((value) => Number.isInteger(value) && value >= 0 && value < total)
      .sort((a, b) => a - b);

  const run = async () => {
    try {
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
            page.drawText(line.slice(i, i + 95), { x: 40, y, size: 11, font, color: rgb(0.1, 0.1, 0.2) });
            y -= 14;
          }
        }

        const bytes = await pdf.save();
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-text.pdf");
        setInfo("PDF downloaded.");
        return;
      }

      if (mode === "html-to-pdf") {
        const frame = window.open("", "_blank", "width=900,height=700");
        if (!frame) {
          setInfo("Popup blocked. Allow popups to print PDF.");
          return;
        }
        frame.document.write(`
          <html>
            <head>
              <title>Toolinger</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
                img { max-width: 100%; }
              </style>
            </head>
            <body>${html}</body>
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
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-merged.pdf");
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
          `Pages: ${pdf.getPageCount()} | File: ${first.name} | Size: ${(first.size / 1024).toFixed(1)}KB | Title: ${title} | Author: ${author}`
        );
        return;
      }

      const source = await PDFDocument.load(await readAsArrayBuffer(first));
      const total = source.getPageCount();
      const indexes = parsePages(pageInput, total);

      if (mode === "split" || mode === "extract-pages") {
        if (indexes.length === 0) {
          setInfo("Enter page numbers like: 1,2,3");
          return;
        }
        const out = await PDFDocument.create();
        const pages = await out.copyPages(source, indexes);
        pages.forEach((page) => out.addPage(page));
        const bytes = await out.save({ useObjectStreams: true });
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-extracted.pdf");
        setInfo("New PDF downloaded.");
        return;
      }

      if (mode === "delete-pages") {
        const deleteSet = new Set(indexes);
        const keep = source.getPageIndices().filter((index) => !deleteSet.has(index));
        if (keep.length === 0) {
          setInfo("Cannot remove every page from a PDF.");
          return;
        }
        const out = await PDFDocument.create();
        const pages = await out.copyPages(source, keep);
        pages.forEach((page) => out.addPage(page));
        const bytes = await out.save({ useObjectStreams: true });
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-pages-deleted.pdf");
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
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-reordered.pdf");
        setInfo("Reordered PDF downloaded.");
        return;
      }

      if (mode === "rotate") {
        const safeAngle = Number(angle) || 0;
        source.getPages().forEach((page) => page.setRotation(degrees(safeAngle)));
        const bytes = await source.save({ useObjectStreams: true });
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-rotated.pdf");
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
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-numbered.pdf");
        setInfo("Numbered PDF downloaded.");
        return;
      }

      if (mode === "compress") {
        const bytes = await source.save({ useObjectStreams: true, objectsPerTick: 2000 });
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-compressed.pdf");
        setInfo(
          `Compressed PDF exported (${(bytes.byteLength / 1024).toFixed(1)} KB). Original: ${(first.size / 1024).toFixed(1)} KB.`
        );
        return;
      }

      setInfo("Unsupported PDF mode.");
    } catch {
      setInfo("Unable to process this file. Please check your input.");
    }
  };

  return (
    <ToolPanel>
      {mode === "text-to-pdf" ? (
        <textarea
          className={`${inputClass} min-h-44`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Enter text"
        />
      ) : null}
      {mode === "html-to-pdf" ? (
        <textarea
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
          multiple={mode === "merge"}
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      ) : null}
      {mode === "split" || mode === "extract-pages" || mode === "delete-pages" ? (
        <input
          className={inputClass}
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          placeholder="Page numbers: 1,2,3"
        />
      ) : null}
      {mode === "rearrange-pages" ? (
        <input
          className={inputClass}
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          placeholder="New order: 3,1,2"
        />
      ) : null}
      {mode === "rotate" ? (
        <select className={inputClass} value={angle} onChange={(event) => setAngle(event.target.value)}>
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
        <iframe ref={previewRef} title="PDF Preview" className="h-80 w-full rounded-xl border border-slate-200 bg-white" />
      ) : null}
    </ToolPanel>
  );
}

function ImageTool({ mode }: { mode: string }) {
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
    exportQuality = 0.92
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
    try {
      if (mode === "quote") {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 628;
        const context = canvas.getContext("2d");
        if (!context) return;

        const gradient = context.createLinearGradient(0, 0, 1200, 628);
        gradient.addColorStop(0, "#5b4bff");
        gradient.addColorStop(1, "#16c8ff");
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

      const first = files[0] as File;
      const qualityValue = clamp(Number(quality) || 0.8, 0.2, 1);

      if (mode === "metadata") {
        const img = await loadImage(await readAsDataUrl(first));
        setResultText(
          `Name: ${first.name} | Type: ${first.type} | Size: ${(first.size / 1024).toFixed(1)}KB | Dimensions: ${img.width}x${img.height}`
        );
        return;
      }

      if (mode === "base64") {
        setResultText(await readAsDataUrl(first));
        return;
      }

      if (mode === "image-to-pdf") {
        const pdf = await PDFDocument.create();
        for (const file of files) {
          const embedded = await embedImageInPdf(pdf, file);
          const page = pdf.addPage([embedded.width, embedded.height]);
          page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
        }
        const bytes = await pdf.save();
        downloadBlob(new Blob([toArrayBuffer(bytes)], { type: "application/pdf" }), "toolinger-images.pdf");
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
      const context = canvas.getContext("2d");
      if (!context) {
        setResultText("Canvas not supported in this browser.");
        return;
      }
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

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
        await exportCanvas(canvas, "image/jpeg", "toolinger-compressed.jpg", qualityValue);
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

      if (mode === "brightness-contrast") {
        const bright = clamp(Number(brightness) || 0, -100, 100);
        const contrastValue = clamp(Number(contrast) || 0, -100, 100);
        const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));

        for (let index = 0; index < data.length; index += 4) {
          data[index] = clamp(factor * (data[index] - 128) + 128 + bright, 0, 255);
          data[index + 1] = clamp(factor * (data[index + 1] - 128) + 128 + bright, 0, 255);
          data[index + 2] = clamp(factor * (data[index + 2] - 128) + 128 + bright, 0, 255);
        }
      }

      if (mode === "grayscale") {
        for (let index = 0; index < data.length; index += 4) {
          const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
          data[index] = avg;
          data[index + 1] = avg;
          data[index + 2] = avg;
        }
      }

      if (mode === "sepia") {
        for (let index = 0; index < data.length; index += 4) {
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          data[index] = clamp(0.393 * red + 0.769 * green + 0.189 * blue, 0, 255);
          data[index + 1] = clamp(0.349 * red + 0.686 * green + 0.168 * blue, 0, 255);
          data[index + 2] = clamp(0.272 * red + 0.534 * green + 0.131 * blue, 0, 255);
        }
      }

      if (mode === "blur" || mode === "sharpen") {
        const kernel =
          mode === "blur"
            ? [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9]
            : [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const copy = new Uint8ClampedArray(data);
        const widthPx = canvas.width;
        const heightPx = canvas.height;

        for (let y = 1; y < heightPx - 1; y += 1) {
          for (let x = 1; x < widthPx - 1; x += 1) {
            for (let channel = 0; channel < 3; channel += 1) {
              let sum = 0;
              let kIndex = 0;
              for (let ky = -1; ky <= 1; ky += 1) {
                for (let kx = -1; kx <= 1; kx += 1) {
                  const px = ((y + ky) * widthPx + (x + kx)) * 4 + channel;
                  sum += copy[px] * kernel[kIndex];
                  kIndex += 1;
                }
              }
              const current = (y * widthPx + x) * 4 + channel;
              data[current] = clamp(sum, 0, 255);
            }
          }
        }
      }

      context.putImageData(imageData, 0, 0);

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
    } catch {
      setResultText("Unable to process file. Please use a valid image.");
    }
  };

  return (
    <ToolPanel>
      {mode === "quote" ? null : (
        <input
          className={inputClass}
          type="file"
          accept="image/*"
          multiple={mode === "collage" || mode === "image-to-pdf"}
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      )}

      {(mode === "resize" || mode === "crop") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Width">
            <input className={inputClass} value={width} onChange={(event) => setWidth(event.target.value)} placeholder="Width" />
          </Field>
          <Field label="Height">
            <input className={inputClass} value={height} onChange={(event) => setHeight(event.target.value)} placeholder="Height" />
          </Field>
        </div>
      )}

      {(mode === "compress" || mode === "format") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quality (0.2-1)">
            <input className={inputClass} value={quality} onChange={(event) => setQuality(event.target.value)} placeholder="Quality 0.2 - 1" />
          </Field>
          {mode === "format" ? (
            <Field label="Target Format">
              <select className={inputClass} value={targetFormat} onChange={(event) => setTargetFormat(event.target.value)}>
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
          <select className={inputClass} value={rotation} onChange={(event) => setRotation(event.target.value)}>
            <option value="90">90 degrees</option>
            <option value="180">180 degrees</option>
            <option value="270">270 degrees</option>
          </select>
        </Field>
      )}

      {mode === "flip" && (
        <Field label="Flip Direction">
          <select className={inputClass} value={flipDirection} onChange={(event) => setFlipDirection(event.target.value)}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </Field>
      )}

      {(mode === "watermark" || mode === "quote") && (
        <Field label="Text">
          <input className={inputClass} value={watermark} onChange={(event) => setWatermark(event.target.value)} placeholder="Text" />
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
        <button type="button" className={primaryBtn} onClick={run}>
          Run Tool
        </button>
        {resultText ? <CopyButton text={resultText} label="Copy Result" /> : null}
      </div>

      <div className={`${resultBox} break-all whitespace-pre-wrap`}>{resultText}</div>

      {mode === "color-picker" && (
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            className="h-auto max-h-72 w-auto max-w-full rounded-xl border border-slate-200 bg-white"
            onClick={(event) => {
              if (!canvasRef.current) return;
              const rect = canvasRef.current.getBoundingClientRect();
              const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvasRef.current.width);
              const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvasRef.current.height);
              const context = canvasRef.current.getContext("2d");
              if (!context) return;
              const pixel = context.getImageData(x, y, 1, 1).data;
              const hex = rgbaToHex(pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0);
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

function PassportTool() {
  const [file, setFile] = useState<File | null>(null);
  const [background, setBackground] = useState("#FFFFFF");
  const [format, setFormat] = useState("passport");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("Upload a clear portrait with a simple background.");

  const dimensions =
    format === "passport"
      ? { width: 413, height: 531 }
      : format === "us-visa"
      ? { width: 600, height: 600 }
      : { width: 420, height: 540 };

  const build = async () => {
    if (!file) {
      setStatus("Please select a portrait image.");
      return;
    }

    try {
      const canvas = await drawImageToCanvas(file);
      const context = canvas.getContext("2d");
      if (!context) return;

      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;

      const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ];

      const avg = corners.reduce(
        (acc, [x, y]) => {
          const index = (y * canvas.width + x) * 4;
          acc.r += data[index] ?? 0;
          acc.g += data[index + 1] ?? 0;
          acc.b += data[index + 2] ?? 0;
          return acc;
        },
        { r: 0, g: 0, b: 0 }
      );

      const bg = { r: avg.r / 4, g: avg.g / 4, b: avg.b / 4 };

      for (let index = 0; index < data.length; index += 4) {
        const dr = Math.abs((data[index] ?? 0) - bg.r);
        const dg = Math.abs((data[index + 1] ?? 0) - bg.g);
        const db = Math.abs((data[index + 2] ?? 0) - bg.b);
        const distance = dr + dg + db;
        const alpha = distance < 70 ? 0 : 255;
        data[index + 3] = alpha;
      }

      context.putImageData(image, 0, 0);

      const output = document.createElement("canvas");
      output.width = dimensions.width;
      output.height = dimensions.height;
      const outContext = output.getContext("2d");
      if (!outContext) return;

      outContext.fillStyle = background;
      outContext.fillRect(0, 0, output.width, output.height);

      const scale = Math.min(output.width / canvas.width, output.height / canvas.height);
      const drawWidth = canvas.width * scale;
      const drawHeight = canvas.height * scale;
      const dx = (output.width - drawWidth) / 2;
      const dy = output.height - drawHeight;
      outContext.drawImage(canvas, dx, Math.max(0, dy), drawWidth, drawHeight);

      const url = output.toDataURL("image/png");
      setPreview(url);
      setStatus("Portrait extracted and preview updated.");
    } catch {
      setStatus("Could not process this image. Please try another portrait.");
    }
  };

  const downloadJpg = async () => {
    try {
      const image = await loadImage(preview);
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      const blob = await canvasToBlob(canvas, "image/jpeg", 0.94);
      downloadBlob(blob, "toolinger-passport.jpg");
    } catch {
      setStatus("Unable to export JPG.");
    }
  };

  return (
    <ToolPanel>
      <input
        className={inputClass}
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Studio Background">
          <select className={inputClass} value={background} onChange={(event) => setBackground(event.target.value)}>
            <option value="#FFFFFF">White</option>
            <option value="#B8D9FF">Sky Blue</option>
            <option value="#D7EAFF">Light Blue</option>
            <option value="#E5E7EB">Light Grey</option>
          </select>
        </Field>
        <Field label="Format">
          <select className={inputClass} value={format} onChange={(event) => setFormat(event.target.value)}>
            <option value="passport">Universal Passport</option>
            <option value="standard">Standard Document Photo</option>
            <option value="us-visa">US Visa Style</option>
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={build} className={primaryBtn}>
          Generate Preview
        </button>
      </div>
      <div className={resultBox}>{status}</div>
      {preview ? (
        <div className="space-y-3">
          <img src={preview} alt="Passport preview" className="mx-auto w-full max-w-64 rounded-xl border border-slate-200" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={secondaryBtn}
              onClick={async () => {
                const response = await fetch(preview);
                const blob = await response.blob();
                downloadBlob(blob, "toolinger-passport.png");
              }}
            >
              Download PNG
            </button>
            <button type="button" className={secondaryBtn} onClick={downloadJpg}>
              Download JPG
            </button>
          </div>
        </div>
      ) : null}
    </ToolPanel>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<CategoryId, boolean>>({
    image: true,
    pdf: false,
    text: false,
    document: false,
    developer: false,
    health: false,
    finance: false,
    converter: false,
    facebook: false,
    instagram: false,
    youtube: false,
    utility: false,
  });
  const [activeToolId, setActiveToolId] = useState("qr-code-generator");
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  const [consent, setConsent] = useState<string | null>(() => {
    try {
      return localStorage.getItem("toolinger-consent");
    } catch {
      return null;
    }
  });

  const workspaceRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.title = "Toolinger - 90+ Free Online Tools";
    (window as Window & { TOOLINGER_CONFIG?: typeof TOOLINGER_CONFIG }).TOOLINGER_CONFIG = TOOLINGER_CONFIG;
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setLegalPage(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigationManager = useMemo(
    () => ({
      open: () => setMenuOpen(true),
      close: () => setMenuOpen(false),
      toggle: () => setMenuOpen((previous) => !previous),
    }),
    []
  );

  const toolsById = useMemo(() => {
    const map = new Map<string, ToolConfig>();
    TOOL_LIST.forEach((tool) => {
      map.set(tool.id, tool);
    });
    return map;
  }, []);

  const activeTool = toolsById.get(activeToolId) ?? TOOL_LIST[0]!;

  const featuredTools = useMemo(
    () => FEATURED_TOOL_IDS.map((id) => toolsById.get(id)).filter((tool): tool is ToolConfig => Boolean(tool)),
    [toolsById]
  );

  const categories = useMemo(() => {
    const grouping = new Map<CategoryId, ToolConfig[]>();
    TOOL_LIST.forEach((tool) => {
      const current = grouping.get(tool.category) ?? [];
      current.push(tool);
      grouping.set(tool.category, current);
    });
    return grouping;
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return TOOL_LIST.filter((tool) => {
      const category = CATEGORY_LABELS[tool.category].toLowerCase();
      const keywords = tool.keywords.join(" ").toLowerCase();
      return tool.name.toLowerCase().includes(q) || category.includes(q) || keywords.includes(q);
    }).slice(0, 10);
  }, [search]);

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
      default:
        return null;
    }
  };

  const openTool = (toolId: string) => {
    setActiveToolId(toolId);
    navigationManager.close();
    requestAnimationFrame(() => {
      workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const legalContent: Record<LegalPage, string> = {
    About:
      "Toolinger is a browser-first toolbox designed to provide fast, practical tools for everyday digital work across images, PDFs, text, development, health, finance, conversion and social media helper workflows.",
    "Privacy Policy":
      "Toolinger processes many actions directly in your browser. We store minimal local preferences such as consent choices and optional notepad content. We do not require account sign-up for basic use. If advertising is enabled in the future, additional technologies may apply.",
    "Cookie Policy":
      "Toolinger uses essential browser storage for functionality including consent and local settings. Advertising cookies or similar technologies may be introduced only when ads are enabled through configuration.",
    "Terms and Conditions":
      "By using Toolinger, you agree to use the service responsibly and lawfully. Tool outputs are provided as-is for convenience and should be reviewed before official or high-risk use.",
    Disclaimer:
      "Toolinger provides utility calculations and processing tools for informational and productivity purposes. Health and financial calculators are estimates and are not professional advice.",
    Contact:
      "Toolinger Support\nFor support, questions, feedback or issues:\nlootchaser2026@gmail.com",
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#f7faff] via-white to-[#eef2ff] text-slate-900">
      <style>{`
        @keyframes coinFlip {
          from { transform: rotateY(0); }
          to { transform: rotateY(1800deg); }
        }

        .coin {
          position: relative;
          width: 96px;
          height: 96px;
          transform-style: preserve-3d;
          margin: 18px auto;
        }

        .coin-face {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-size: 2.5rem;
          font-weight: 900;
          border-radius: 9999px;
          backface-visibility: hidden;
          box-shadow: inset 0 0 0 8px rgba(255,255,255,0.25);
        }

        .coin-head {
          background: radial-gradient(circle at 30% 30%, #fde68a, #f59e0b);
          color: #78350f;
        }

        .coin-tail {
          background: radial-gradient(circle at 30% 30%, #e2e8f0, #94a3b8);
          color: #1e293b;
          transform: rotateY(180deg);
        }

        .coin-flipping {
          animation: coinFlip 1.4s ease-in-out;
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }

        .motion-rise {
          animation: rise 0.25s ease-out;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open tool categories"
              aria-expanded={menuOpen}
              onClick={navigationManager.toggle}
              className="inline-flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <span className="sr-only">Menu</span>
              <span className="block h-0.5 w-5 rounded bg-slate-900" />
              <span className="block h-0.5 w-5 rounded bg-slate-900" />
              <span className="block h-0.5 w-5 rounded bg-slate-900" />
            </button>
            <img src="/toolinger-logo.svg" alt="Toolinger logo" className="h-9 w-9 rounded-lg" />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold tracking-tight">Toolinger</div>
              <div className="truncate text-xs text-slate-600">90+ Free Online Tools</div>
            </div>
          </div>

          <div className="relative w-full md:ml-auto md:w-full md:max-w-xs">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClass} pl-10`}
              placeholder="Search tools"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
              Go
            </span>
            {searchResults.length > 0 ? (
              <div className="absolute left-0 right-0 top-[110%] z-50 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {searchResults.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      openTool(tool.id);
                      setSearch("");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    <div className="font-semibold text-slate-900">{tool.name}</div>
                    <div className="text-xs text-slate-500">{CATEGORY_LABELS[tool.category]}</div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[340px] max-w-[90vw] transform flex-col bg-white shadow-2xl transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="font-semibold text-slate-900">Tool Categories</div>
          <button type="button" className={secondaryBtn} onClick={navigationManager.close}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((categoryId) => (
            <div key={categoryId} className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedCategories((current) => ({ ...current, [categoryId]: !current[categoryId] }))}
                className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-bold text-slate-800"
              >
                {CATEGORY_LABELS[categoryId]}
                <span>{expandedCategories[categoryId] ? "v" : ">"}</span>
              </button>
              {expandedCategories[categoryId] ? (
                <div className="border-t border-slate-100 p-2">
                  {(categories.get(categoryId) ?? []).map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => openTool(tool.id)}
                      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-violet-50 ${
                        activeTool?.id === tool.id ? "font-semibold text-violet-700" : "text-slate-700"
                      }`}
                    >
                      {tool.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </aside>

      <button
        type="button"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={navigationManager.close}
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-200 ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <main>
        <section className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-[#eef4ff] to-[#f5f3ff]">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />
          <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-semibold tracking-[0.15em] text-blue-700">TOOLINGER | 90+ ONLINE TOOLS</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              One simple place for everyday digital work.
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-600 sm:text-lg">
              Fast online tools for images, PDFs, text, documents, developers, health, finance, conversions and social media.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" className={primaryBtn} onClick={navigationManager.open}>
                Explore Tools
              </button>
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Open Workspace
              </button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={metricBox}>
                <div className="text-2xl font-extrabold text-slate-900">90+</div>
                <div className="text-xs text-slate-600">Useful tools</div>
              </div>
              <div className={metricBox}>
                <div className="text-2xl font-extrabold text-slate-900">12</div>
                <div className="text-xs text-slate-600">Categories</div>
              </div>
              <div className={metricBox}>
                <div className="text-2xl font-extrabold text-slate-900">100%</div>
                <div className="text-xs text-slate-600">Browser-first</div>
              </div>
              <div className={metricBox}>
                <div className="text-2xl font-extrabold text-slate-900">$0</div>
                <div className="text-xs text-slate-600">Always free</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6">
          <div className={adSlot}>ADVERTISEMENT</div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Core Toolkit</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            The tools people use most, ready in one tap.
          </h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Like the leading utility platforms, Toolinger keeps frequent tasks immediate: resize files, fix documents, and generate secure
            outputs with no account required.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <button key={tool.id} type="button" onClick={() => openTool(tool.id)} className={toolListBtn}>
                {tool.name}
                <div className="mt-1 text-xs font-normal text-slate-500">{tool.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Why Toolinger</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Built for speed, privacy, and mobile reliability.
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className={resultBox}>Zero upload by default: most tools process directly in your browser.</div>
            <div className={resultBox}>Instant results: no queues, no sign-up gates, no hidden waits.</div>
            <div className={resultBox}>Mobile-first controls sized for Android Chrome touch usage.</div>
            <div className={resultBox}>Ad-ready architecture with isolated configuration and clean placeholders.</div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">How It Works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Search, use, download.</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className={resultBox}>1. Open the menu or search for a tool by name/category.</div>
            <div className={resultBox}>2. Upload file, paste text, or enter values.</div>
            <div className={resultBox}>3. Download, copy, or reuse your output instantly.</div>
          </div>
        </section>

        <section id="workspace" ref={workspaceRef} className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              {CATEGORY_LABELS[activeTool.category]}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{activeTool.name}</h2>
            <p className="mt-1 text-slate-600">{activeTool.description}</p>
          </div>
          {renderActiveTool()}
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
          <div className={adSlot}>ADVERTISEMENT</div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <img src="/toolinger-logo.svg" alt="Toolinger" className="h-8 w-8" />
              <div className="text-xl font-bold">Toolinger</div>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Fast online tools for images, PDFs, text, developers, health, finance, conversions and social media.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Legal</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {LEGAL_PAGES.filter((item) => item !== "Contact").map((item) => (
                <button key={item} type="button" onClick={() => setLegalPage(item)} className={secondaryBtn}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Support</h3>
            <p className="mt-2 text-sm text-slate-600">Toolinger Support</p>
            <a href="mailto:lootchaser2026@gmail.com" className="mt-2 inline-block text-sm font-semibold text-violet-700">
              lootchaser2026@gmail.com
            </a>
            <div className="mt-3">
              <button type="button" onClick={() => setLegalPage("Contact")} className={secondaryBtn}>
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>

      {legalPage ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4" role="dialog" aria-modal="true">
          <div className={`${glassPanel} max-h-[80vh] w-full max-w-2xl overflow-auto`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900">{legalPage}</h3>
              <button type="button" className={secondaryBtn} onClick={() => setLegalPage(null)}>
                Close
              </button>
            </div>
            <p className="whitespace-pre-line text-sm text-slate-700">{legalContent[legalPage]}</p>
          </div>
        </div>
      ) : null}

      {!consent ? (
        <div className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-xl">
          <div className={glassPanel}>
            <h3 className="text-lg font-semibold text-slate-900">Privacy & Cookie Choices</h3>
            <p className="mt-2 text-sm text-slate-700">
              Toolinger uses essential browser storage for site functionality. Advertising technologies may use cookies or similar
              technologies when advertising is enabled.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryBtn}
                onClick={() => {
                  try {
                    localStorage.setItem("toolinger-consent", "allow");
                  } catch {
                    // ignore storage errors
                  }
                  setConsent("allow");
                }}
              >
                Allow
              </button>
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => {
                  try {
                    localStorage.setItem("toolinger-consent", "necessary-only");
                  } catch {
                    // ignore storage errors
                  }
                  setConsent("necessary-only");
                }}
              >
                Necessary Only
              </button>
              <button type="button" className={secondaryBtn} onClick={() => setLegalPage("Privacy Policy")}>
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
