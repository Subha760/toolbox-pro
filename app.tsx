import React, { useEffect, useMemo, useRef, useState, useId, useContext } from "react";
import { validatePhoto } from "./src/background-removal.mjs";
import { localCutout } from "./src/local-cutout.mjs";
import type { PDFDocument } from "pdf-lib";

import { LEGAL_CONTENT } from "./src/policies";
import { parsePageSelection, securePassword, portraitLayout, sheetLayout } from "./src/tool-utils.mjs";

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
  | "ai"
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
  | "social"
  | "local-ai";

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
  ai: "Local AI Tools",
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

  { id: "ai-sentiment", name: "AI Sentiment Analyzer", category: "ai", description: "Detect positive or negative tone with a private on-device model.", keywords: ["ai", "sentiment", "tone"], engine: "local-ai", mode: "sentiment" },
  { id: "ai-semantic-similarity", name: "AI Semantic Similarity", category: "ai", description: "Compare the meaning of two passages locally.", keywords: ["ai", "semantic", "similarity"], engine: "local-ai", mode: "similarity" },
  { id: "ai-extractive-summary", name: "AI Extractive Summarizer", category: "ai", description: "Select the most meaningful sentences without uploading your text.", keywords: ["ai", "summary", "summarize"], engine: "local-ai", mode: "summary" },
  { id: "ai-keyword-extractor", name: "AI Keyword Extractor", category: "ai", description: "Find semantically important keywords using local embeddings.", keywords: ["ai", "keyword", "seo"], engine: "local-ai", mode: "keywords" },

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
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
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

const randomPassword = (length: number, upper: boolean, lower: boolean, numbers: boolean, symbols: boolean) =>
  securePassword(length, [upper && "ABCDEFGHIJKLMNOPQRSTUVWXYZ", lower && "abcdefghijklmnopqrstuvwxyz", numbers && "0123456789", symbols && "!@#$%^&*()-_=+[]{};:,.?/"].filter(Boolean));

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
  return <div className={`${glassPanel} tool-panel space-y-4`}>{children}</div>;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (!text.trim()) return null;

  return (
    <button
      type="button"
      className={secondaryBtn}
      onClick={async () => {
        try { await copyToClipboard(text); setCopyError(false); } catch { setCopyError(true); return; }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copyError ? "Select text to copy" : copied ? "Copied" : label}
    </button>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={`block text-sm font-medium text-slate-700 ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className="mt-1">{React.Children.map(children, child => React.isValidElement(child) && typeof child.type === "string" && ["input", "textarea", "select"].includes(child.type) ? React.cloneElement(child as React.ReactElement<{id?: string}>, {id}) : child)}</div>
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
            `Characters:\n${Array.from(input).reverse().join("")}`,
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
          const bytes = trimmed.split(/\s+/);
          if (bytes.some(byte => byte.length !== 8)) {setOutput("Use eight-bit bytes separated by spaces."); break;}
          try {setOutput(new TextDecoder("utf-8", {fatal: true}).decode(Uint8Array.from(bytes, byte => parseInt(byte, 2))));} catch {setOutput("These bytes are not valid UTF-8 text.");}
        } else {
          setOutput(Array.from(new TextEncoder().encode(input), byte => byte.toString(2).padStart(8, "0")).join(" "));
        }
        break;
      }
      case "html-format":
      case "css-format":
      case "js-format": {
        try {
          const prettier = await import("prettier/standalone");
          const parser = mode === "html-format" ? "html" : mode === "css-format" ? "css" : "babel";
          const plugin = parser === "html" ? await import("prettier/plugins/html") : parser === "css" ? await import("prettier/plugins/postcss") : await import("prettier/plugins/babel");
          const estree = parser === "babel" ? await import("prettier/plugins/estree") : null;
          setOutput(await prettier.format(input, {parser, plugins: estree ? [plugin, estree] : [plugin]}));
        } catch { setOutput("Could not format this code. Check its syntax."); }
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
      <textarea aria-label="Input text"
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
      <textarea value={output} aria-label="Result" readOnly className={`${inputClass} min-h-40`} placeholder="Result" />
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
      <textarea aria-label="Input text"
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
      <textarea aria-label="Input text"
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
      <textarea value={output} aria-label="Result" readOnly className={`${inputClass} min-h-32`} placeholder="Result" />
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
      <textarea aria-label="Input text"
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
      <textarea className={`${inputClass} min-h-36`} value={result} aria-label="Result" readOnly placeholder="Result" />
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
        (_match, label, url) => /^(https?:\/\/|mailto:|#)/i.test(url) ? `<a href="${url}" target="_blank" rel="noreferrer" class="font-medium text-violet-700 underline">${label}</a>` : label
      )
      .replace(/\n/g, "<br />");
  }, [text]);

  return (
    <ToolPanel>
      <div className="grid gap-3 md:grid-cols-2">
        <textarea aria-label="Input text" className={`${inputClass} min-h-48`} value={text} onChange={(event) => setText(event.target.value)} />
        <div className={`${inputClass} min-h-48 overflow-auto`} dangerouslySetInnerHTML={{ __html: preview }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy Markdown" />
      </div>
    </ToolPanel>
  );
}

function JsonTool({ mode }: { mode: string }) {
  const [input, setInput] = useState(useContext(SampleContext) || '{"tool":"toolinger"}');
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
      <textarea aria-label="Input text" className={`${inputClass} min-h-44`} value={input} onChange={(event) => setInput(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Run Tool
        </button>
        <CopyButton text={result} label="Copy Result" />
      </div>
      {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <textarea className={`${inputClass} min-h-32`} value={result} aria-label="Result" readOnly />
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
      <textarea aria-label="Input text"
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
      <textarea className={`${inputClass} min-h-40`} value={result} aria-label="Result" readOnly placeholder="Result" />
    </ToolPanel>
  );
}

function UrlTool({ mode }: { mode: string }) {
  const [input, setInput] = useState(useContext(SampleContext));
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
      <textarea aria-label="Input text"
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
      <textarea className={`${inputClass} min-h-36`} value={result} aria-label="Result" readOnly />
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
      <textarea className={`${inputClass} min-h-44`} aria-label="Result" readOnly value={result} />
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
    if (![includeUpper, includeLower, includeNumbers, includeSymbols].some(Boolean)) return;
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
      <input className={inputClass} value={result} aria-label="Result" readOnly placeholder="Password" />
      <div className={resultBox}>Strength: {strength}</div>
      {!enabledTypes ? <p role="alert">Choose at least one character type.</p> : null}
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
      <textarea aria-label="Input text"
        className={`${inputClass} min-h-32`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Text to hash"
      />
      <select className={inputClass} aria-label="Hash algorithm" value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
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
      <textarea className={`${inputClass} min-h-32`} value={result} aria-label="Result" readOnly />
    </ToolPanel>
  );
}

function TimestampTool() {
  const [date, setDate] = useState(() => {const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);});
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
      <div className={resultBox}>Unix Timestamp: {timestampFromDate !== "" ? timestampFromDate : "Enter a valid date"}</div>
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
      const found = regex.global ? Array.from(text.matchAll(regex)) : [regex.exec(text)].filter((match): match is RegExpExecArray => Boolean(match));
      const matches = found.map(
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
        <input className={inputClass} aria-label="Pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="Pattern" />
        <input className={inputClass} aria-label="Flags" value={flags} onChange={(event) => setFlags(event.target.value)} placeholder="Flags" />
      </div>
      <textarea aria-label="Input text" className={`${inputClass} min-h-32`} value={text} onChange={(event) => setText(event.target.value)} placeholder="Test text" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={run} className={primaryBtn}>
          Test Regex
        </button>
        <CopyButton text={result} label="Copy Matches" />
      </div>
      {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <textarea className={`${inputClass} min-h-32`} aria-label="Result" readOnly value={result} />
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
  const [text, setText] = useState("https://subha760.github.io/toolbox-pro/");
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
      const {default: QRCode} = await import("qrcode");
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
  const [landing, setLanding] = useState("Heads");
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
        <input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} className="h-5 w-5 accent-violet-600" />
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
      const {PDFDocument, StandardFonts, rgb} = await import("pdf-lib");
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
      <textarea aria-label="Input text"
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
      <textarea aria-label="Input text"
        className={`${inputClass} min-h-36`}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Enter draft content"
      />
      {(mode === "caption" || mode === "reel" || mode === "yt-template") && (
        <textarea aria-label="Input text"
          className={`${inputClass} min-h-24`}
          value={secondary}
          onChange={(event) => setSecondary(event.target.value)}
          placeholder="Optional supporting line"
        />
      )}
      <textarea className={`${inputClass} min-h-44`} aria-label="Result" readOnly value={output} />
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

  const parsePages = parsePageSelection;

  const run = async () => {
    try {
      const {PDFDocument, StandardFonts, rgb, degrees} = await import("pdf-lib");
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
        frame.opener = null;
        const cleanDocument = new DOMParser().parseFromString(html, "text/html");
        cleanDocument.querySelectorAll("script,iframe,object,embed,link,meta,base,form").forEach(node => node.remove());
        cleanDocument.querySelectorAll("*").forEach(node => Array.from(node.attributes).forEach(attr => { if (attr.name.startsWith("on") || /^(javascript:|https?:|\/\/)/i.test(attr.value.trim())) node.removeAttribute(attr.name); }));
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
      const indexes = ["split", "extract-pages", "delete-pages"].includes(mode) ? parsePages(pageInput, total) : [];

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
    } catch (error) {
      setInfo(error instanceof Error ? error.message : "Unable to process this file. Please check your input.");
    }
  };

  return (
    <ToolPanel>
      {mode === "text-to-pdf" ? (
        <textarea aria-label="Input text"
          className={`${inputClass} min-h-44`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Enter text"
        />
      ) : null}
      {mode === "html-to-pdf" ? (
        <textarea aria-label="Input text"
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
      {mode === "split" || mode === "extract-pages" || mode === "delete-pages" ? (
        <input
          className={inputClass}
          aria-label="Page numbers or ranges" value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          placeholder="Page numbers: 1,2,3"
        />
      ) : null}
      {mode === "rearrange-pages" ? (
        <input
          className={inputClass}
          aria-label="New page order" value={order}
          onChange={(event) => setOrder(event.target.value)}
          placeholder="New order: 3,1,2"
        />
      ) : null}
      {mode === "rotate" ? (
        <select className={inputClass} aria-label="Rotation angle" value={angle} onChange={(event) => setAngle(event.target.value)}>
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
      const {PDFDocument} = await import("pdf-lib");
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
          aria-label="Choose image files"
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

const INDIA_PHOTO_PRESETS = {
  passport: { label: "35 × 45 mm — common ID format", width: 413, height: 531 },
  pan: { label: "PAN application — 25 × 35 mm", width: 295, height: 413 },
  aadhaar: { label: "35 × 45 mm — document attachment", width: 413, height: 531 },
  uan: { label: "35 × 45 mm — application attachment", width: 413, height: 531 },
  visa: { label: "2 × 2 inch — square photo", width: 600, height: 600 },
};

function PassportTool() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [cutoutUrl, setCutoutUrl] = useState("");
  const [background, setBackground] = useState("#FFFFFF");
  const [format, setFormat] = useState("passport");
  const [customWidth, setCustomWidth] = useState(413);
  const [customHeight, setCustomHeight] = useState(531);
  const [zoom, setZoom] = useState(100);
  const [vertical, setVertical] = useState(50);
  const [enhance, setEnhance] = useState(false);
  const [horizontal, setHorizontal] = useState(50);
  const [guides, setGuides] = useState(true);
  const serviceStatus = "Free on-device AI. Your photo stays in this browser. Model files download on first use.";
  const pendingRequest = useRef<AbortController | null>(null);
  const photoUrls = useRef({ source: "", cutout: "" });
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Upload a clear front-facing portrait.");

  useEffect(() => {
    return () => {
      pendingRequest.current?.abort();
      URL.revokeObjectURL(photoUrls.current.source);
      URL.revokeObjectURL(photoUrls.current.cutout);
    };
  }, []);

  const preset = format === "custom"
    ? { label: "Custom", width: Math.min(4000, Math.max(100, Math.round(Number(customWidth)) || 100)), height: Math.min(4000, Math.max(100, Math.round(Number(customHeight)) || 100)) }
    : INDIA_PHOTO_PRESETS[format as keyof typeof INDIA_PHOTO_PRESETS];

  useEffect(() => { setPreview(""); }, [background, format, customWidth, customHeight, zoom, vertical, horizontal, enhance]);

  const selectFile = (next: File | null) => {
    if (next) {
      try { validatePhoto(next); } catch (error) { setStatus((error as Error).message); return; }
    }
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
    setZoom(100); setVertical(50); setHorizontal(50);
    setFile(next);
    setCutoutUrl("");
    setPreview("");
    const url = next ? URL.createObjectURL(next) : "";
    photoUrls.current = { source: url, cutout: "" };
    setSourceUrl(url);
    setStatus(next ? "Photo ready. Remove its background, then create the document photo." : "Upload a clear front-facing portrait.");
  };

  const removeBackground = async () => {
    if (!file) return setStatus("Please upload a portrait first.");
    if (busy) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 90000);
    setBusy(true);
    setStatus("AI is removing the background…");
    try {
      const blob = await localCutout(file, controller.signal, setStatus);
      const url = URL.createObjectURL(blob);
      try { await loadImage(url); } catch { URL.revokeObjectURL(url); throw new Error("The AI returned an unreadable image."); }
      if (controller.signal.aborted) { URL.revokeObjectURL(url); return; }
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
      photoUrls.current.cutout = url;
      setCutoutUrl(url);
      setPreview("");
      setStatus("Background removed with AI. Choose a studio colour and create the photo.");
    } catch (error) {
      setStatus(controller.signal.aborted ? "Processing stopped or timed out. Your original photo is unchanged." : error instanceof Error ? error.message : "AI could not start. Try another browser or a smaller portrait.");
    } finally {
      window.clearTimeout(timeout);
      pendingRequest.current = null;
      setBusy(false);
    }
  };

  const build = async () => {
    const input = cutoutUrl || sourceUrl;
    if (!input) return setStatus("Please upload a portrait first.");
    setBusy(true);
    try {
      const image = await loadImage(input);
      const output = document.createElement("canvas");
      output.width = preset.width;
      output.height = preset.height;
      const context = output.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.fillStyle = background;
      context.fillRect(0, 0, output.width, output.height);
      const {dx, dy, drawWidth, drawHeight} = portraitLayout(image.width, image.height, output.width, output.height, zoom, horizontal, vertical);
      context.filter = enhance ? "brightness(1.035) contrast(1.07) saturate(1.035)" : "none";
      context.drawImage(image, dx, dy, drawWidth, drawHeight);
      context.filter = "none";
      setPreview(output.toDataURL("image/png"));
      setStatus(`${preset.label} created at ${preset.width} × ${preset.height}px.${image.width < preset.width || image.height < preset.height ? " Source enlarged; use a higher-resolution portrait for a sharper print." : ""}`);
    } catch {
      setStatus("Could not create the photo. Please try a JPG, PNG or WebP portrait.");
    } finally {
      setBusy(false);
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

  const downloadSheet = async () => {
    try {
      const {PDFDocument} = await import("pdf-lib");
      const photo = await loadImage(preview);
      const layout = sheetLayout(photo.width, photo.height);
      if (!layout.positions.length) throw new Error("This custom photo is too large for a 4 × 6 inch sheet at 300 DPI.");
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([288, 432]);
      const image = await pdf.embedPng(await (await fetch(preview)).arrayBuffer());
      for (const {x, y} of layout.positions) page.drawImage(image, {x: x * .24, y: 432 - (y + photo.height) * .24, width: photo.width * .24, height: photo.height * .24});
      const bytes = await pdf.save();
      downloadBlob(new Blob([toArrayBuffer(bytes)], {type: "application/pdf"}), "toolinger-4x6-print.pdf");
      setStatus(`${layout.positions.length} photos on a 4 × 6 inch PDF. Print at actual size / 100%, without fit-to-page.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to export print sheet."); }
  };

  return (
    <ToolPanel>
      <div onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); if (!busy) selectFile(e.dataTransfer.files?.[0] ?? null);}} className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-4">
        <div className="mb-2 font-semibold text-slate-900">1. Upload portrait</div>
        <p className="mb-3 text-xs text-slate-600">Choose a photo or drop it here. JPG, PNG or WebP, up to 10 MB.</p>
        <input aria-label="Choose portrait" disabled={busy} className={inputClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
        {sourceUrl ? <img src={sourceUrl} alt="Original portrait" className="mx-auto mt-3 max-h-64 rounded-xl border bg-white object-contain" /> : null}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 font-semibold text-slate-900">2. AI background removal</div>
        <p className="text-sm text-slate-600" role="status">{serviceStatus}</p>
        <button type="button" disabled={busy || !file} onClick={removeBackground} className={`${primaryBtn} mt-3 disabled:opacity-50`}>
          {busy ? "Processing…" : "Remove Background with AI"}
        </button>
        {busy && pendingRequest.current ? <button type="button" className={`${secondaryBtn} ml-2`} onClick={() => pendingRequest.current?.abort()}>Cancel</button> : null}
        {cutoutUrl ? <img src={cutoutUrl} alt="AI background removed" className="mx-auto mt-3 max-h-64 rounded-xl border bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:18px_18px] object-contain" /> : null}
        <p className="mt-2 text-xs text-slate-500">Lightweight portrait AI • no account or API key. Best for one clearly visible person. Fine hair and complex edges may need correction; review before downloading.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Photo dimensions">
          <select className={inputClass} value={format} onChange={(event) => setFormat(event.target.value)}>
            {Object.entries(INDIA_PHOTO_PRESETS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
            <option value="custom">Custom pixel size</option>
          </select>
        </Field>
        <Field label="Studio background">
          <div className="flex h-12 overflow-hidden rounded-xl border border-slate-300" role="group" aria-label="Studio background colours">
            {[{ name: "White", color: "#FFFFFF" }, { name: "Navy blue", color: "#163A70" }, { name: "Red", color: "#B91C1C" }].map(({ name, color }) => (
              <button key={color} type="button" aria-label={name} aria-pressed={background === color} onClick={() => setBackground(color)} className={`flex-1 border-4 ${background === color ? "border-violet-500" : "border-transparent"}`} style={{ backgroundColor: color }} />
            ))}
          </div>
        </Field>
      </div>
      {format === "custom" ? <div className="grid grid-cols-2 gap-3"><Field label="Width (px)"><input className={inputClass} type="number" min="100" max="4000" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} /></Field><Field label="Height (px)"><input className={inputClass} type="number" min="100" max="4000" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} /></Field></div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`Zoom — ${zoom}%`}><input className="w-full accent-violet-600" type="range" min="100" max="180" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></Field>
        <Field label="Vertical position"><input className="w-full accent-violet-600" type="range" min="0" max="100" value={vertical} onChange={(e) => setVertical(Number(e.target.value))} /></Field>
      </div>
      <Field label="Custom background colour"><input type="color" value={background} onChange={e => setBackground(e.target.value)} className="h-11 w-full rounded-lg" /></Field>
      <Field label="Horizontal position"><input className="w-full accent-violet-600" type="range" min="0" max="100" value={horizontal} onChange={e => setHorizontal(Number(e.target.value))} /></Field>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} className="h-5 w-5 accent-violet-600" /> Auto-enhance brightness, colour and contrast</label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !file} onClick={build} className={`${primaryBtn} disabled:opacity-50`}>
          Create Studio Photo
        </button>
      </div>
      <div className={resultBox} role="status" aria-live="polite">{status}</div>
      <p className="text-sm text-slate-600">Sizes are templates, not approval checks. Confirm dimensions, background and digital-editing rules with your issuing authority. Aadhaar enrolment requires a live photo. Keep enhancement off for official submissions.</p>
      {sourceUrl && !cutoutUrl ? <p className="text-sm text-slate-600">Background colours only replace transparent areas after removal; your original background stays visible until then.</p> : null}
      {preview ? (
        <div className="space-y-3">
          <div className="portrait-preview"><img src={preview} alt="Passport preview" />{guides ? <div className="portrait-guides" aria-hidden="true"><span /></div> : null}</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={guides} onChange={e => setGuides(e.target.checked)} /> Show framing guides (excluded from downloads)</label>
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
            <button type="button" className={secondaryBtn} onClick={downloadSheet}>Download 4 × 6 print PDF</button>
            <button type="button" className={secondaryBtn} onClick={downloadJpg}>
              Download JPG
            </button>
          </div>
        </div>
      ) : null}
    </ToolPanel>
  );
}

const localAiPipelines = new Map<string, Promise<any>>();

function getLocalAiPipeline(task: string, model: string) {
  const key = `${task}:${model}`;
  if (!localAiPipelines.has(key)) {
    localAiPipelines.set(key, import("@huggingface/transformers").then(({ pipeline, env }) => {
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline(task as any, model, { dtype: "q8" });
    }).catch(error => {localAiPipelines.delete(key); throw error;}));
  }
  return localAiPipelines.get(key)!;
}

function cosine(a: ArrayLike<number>, b: ArrayLike<number>) {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb) || 1);
}

function rowsFromTensor(tensor: any): number[][] {
  const data = Array.from(tensor.data as ArrayLike<number>);
  const rows = tensor.dims?.[0] || 1;
  const width = data.length / rows;
  return Array.from({ length: rows }, (_, row) => data.slice(row * width, (row + 1) * width));
}

function LocalAiTool({ mode }: { mode: string }) {
  const [text, setText] = useState(useContext(SampleContext));
  const [second, setSecond] = useState("");
  const [result, setResult] = useState("Your result will appear here.");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!text.trim()) { setResult("Enter some text first."); return; }
    if (mode === "similarity" && !second.trim()) { setResult("Enter both passages."); return; }
    setBusy(true);
    setResult("Loading the compact model on this device. The first run may take a minute; later runs use the browser cache.");
    try {
      if (mode === "sentiment") {
        const classifier = await getLocalAiPipeline("sentiment-analysis", "Xenova/distilbert-base-uncased-finetuned-sst-2-english");
        const output = await classifier(text.slice(0, 4000));
        const best = Array.isArray(output) ? output[0] : output;
        setResult(`${String(best.label).replace("POSITIVE", "Positive").replace("NEGATIVE", "Negative")} · ${(best.score * 100).toFixed(1)}% confidence`);
      } else {
        const embed = await getLocalAiPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        if (mode === "similarity") {
          if (!second.trim()) throw new Error("Enter both passages.");
          const vectors = rowsFromTensor(await embed([text, second], { pooling: "mean", normalize: true }));
          setResult(`Semantic similarity: ${(Math.max(0, cosine(vectors[0], vectors[1])) * 100).toFixed(1)}%`);
        } else if (mode === "summary") {
          const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) ?? [];
          if (sentences.length < 2) throw new Error("Enter at least two sentences.");
          const vectors = rowsFromTensor(await embed(sentences.slice(0, 40), { pooling: "mean", normalize: true }));
          const centroid = vectors[0].map((_, col) => vectors.reduce((sum, row) => sum + row[col], 0) / vectors.length);
          const keep = Math.max(1, Math.ceil(vectors.length * 0.3));
          const chosen = vectors.map((row, index) => ({ index, score: cosine(row, centroid) })).sort((a, b) => b.score - a.score).slice(0, keep).sort((a, b) => a.index - b.index);
          setResult(chosen.map(({ index }) => sentences[index]).join(" "));
        } else {
          const words = text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
          const stop = new Set(["this", "that", "with", "from", "have", "will", "your", "about", "there", "their", "what", "when", "where", "which", "would", "could", "should", "into", "than", "then", "they", "them", "were", "been", "being"]);
          const candidates = [...new Set(words.filter((word) => !stop.has(word)))].slice(0, 35);
          if (!candidates.length) throw new Error("Enter a longer English passage.");
          const vectors = rowsFromTensor(await embed([text.slice(0, 4000), ...candidates], { pooling: "mean", normalize: true }));
          const ranked = candidates.map((word, index) => ({ word, score: cosine(vectors[0], vectors[index + 1]) })).sort((a, b) => b.score - a.score).slice(0, 10);
          setResult(ranked.map(({ word }) => word).join(", "));
        }
      }
    } catch (error) {
      setResult(error instanceof Error ? error.message : "The local model could not run in this browser.");
    } finally { setBusy(false); }
  };

  return <ToolPanel>
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Your text stays in this browser. The model downloads once and is cached locally. No API key or account is needed.</div>
    <textarea aria-label="Input text" className={`${inputClass} min-h-44`} value={text} onChange={(event) => setText(event.target.value)} placeholder={mode === "similarity" ? "First passage" : "Paste text"} />
    {mode === "similarity" ? <textarea aria-label="Input text" className={`${inputClass} min-h-32`} value={second} onChange={(event) => setSecond(event.target.value)} placeholder="Second passage" /> : null}
    <button type="button" className={primaryBtn} onClick={run} disabled={busy}>{busy ? "Running locally…" : "Run local AI"}</button>
    <div className={`${resultBox} whitespace-pre-wrap`} aria-live="polite">{result}</div>
  </ToolPanel>;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [activeToolId, setActiveToolId] = useState(() =>
    location.hash.replace(/^#\/?/, ""),
  );
  const [legalPage, setLegalPage] = useState<string | null>(null);
  const [theme, setTheme] = useState(() =>
    readPreference(
      "toolinger-theme",
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    ),
  );
  const [favourites, setFavourites] = useState<string[]>(() => {
    const value = readPreference("toolinger-favourites", []);
    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string")
      : [];
  });
  const [recent, setRecent] = useState<string[]>(() => {
    const value = readPreference("toolinger-recent", []);
    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string")
      : [];
  });
  const [reset, setReset] = useState(0);
  const [sampleTool, setSampleTool] = useState("");
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const activeTool = TOOL_LIST.find((tool) => tool.id === activeToolId);
  const tools = TOOL_LIST.filter(
    (tool) =>
      (category === "all" ||
        (category === "favourites"
          ? favourites.includes(tool.id)
          : tool.category === category)) &&
      `${tool.name} ${tool.description} ${tool.keywords.join(" ")} ${CATEGORY_LABELS[tool.category]}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
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
    document.title = activeTool
      ? `${activeTool.name} — Toolinger`
      : "Toolinger — Your everyday toolbox";
  }, [activeTool]);
  useEffect(() => {
    const handler = () => {
      setActiveToolId(location.hash.replace(/^#\/?/, ""));
      setReset(0);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    if (activeTool)
      setRecent((current) =>
        [activeTool.id, ...current.filter((id) => id !== activeTool.id)].slice(
          0,
          6,
        ),
      );
  }, [activeToolId]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  const openTool = (id: string) => {
    location.hash = `/${id}`;
    setMenuOpen(false);
    setSearch("");
    window.scrollTo({ top: 0 });
  };
  const home = () => {
    location.hash = "";
    setSearch("");
    setCategory("all");
  };
  const toggleFavourite = (id: string) =>
    setFavourites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
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
      default:
        return null;
    }
  };
  const card = (tool: ToolConfig) => (
    <article className="catalog-card" key={tool.id}>
      <button className="card-open" onClick={() => openTool(tool.id)}>
        <span className={`tool-icon category-${tool.category}`}>
          <Icon name={CATEGORY_ICONS[tool.category]} size={23} />
        </span>
        <span className="card-category">
          {CATEGORY_LABELS[tool.category].replace(" Tools", "")}
        </span>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
        <span className="card-action">
          Open tool <Icon name="arrow" size={16} />
        </span>
      </button>
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
  return (
    <div className="site-app">
      <a className="skip-link" href="#main-content" onClick={event => {event.preventDefault(); const main = document.getElementById("main-content"); main?.focus(); main?.scrollIntoView();}}>
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            onClick={home}
            className="brand-button"
            aria-label="Toolinger home"
          >
            <img src="./toolinger-logo.svg" alt="" width="36" height="36" />
            <span>
              toolinger<span className="brand-dot">.</span>
            </span>
          </button>
          <nav className="header-nav" aria-label="Main navigation">
            <button onClick={home} className={!activeTool ? "nav-active" : ""}>
              All tools
            </button>
            <button onClick={() => openTool("passport-photo-maker")}>
              Photo studio
            </button>
          </nav>
          <div className="header-search">
            <Icon name="search" size={18} />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (activeTool) location.hash = "";
              }}
              placeholder="Find a tool…"
              aria-label="Search tools"
            />
            <kbd>⌘ K</kbd>
          </div>
          <button
            className="icon-button theme-toggle"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Browse categories"
          >
            <Icon />
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {activeTool ? (
          <div className="workspace-layout page-width">
            <div className="workspace-breadcrumb">
              <button onClick={home}>All tools</button>
              <span>/</span>
              <span>{CATEGORY_LABELS[activeTool.category]}</span>
            </div>
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
                    onClick={() => toggleFavourite(activeTool.id)}
                    aria-pressed={favourites.includes(activeTool.id)}
                  >
                    <Icon name="star" size={16} />
                    {favourites.includes(activeTool.id) ? "Saved" : "Save tool"}
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={async () => {
                      try {
                        await copyToClipboard(location.href);
                        setNotice("Tool link copied");
                      } catch {
                        setNotice("Select the address bar to copy this link");
                      }
                    }}
                  >
                    <Icon name="link" size={16} /> Share link
                  </button>
                  <button
                    className="toolbar-button"
                    onClick={() => {
                      setSampleTool("");
                      setReset((current) => current + 1);
                    }}
                  >
                    <Icon name="reset" size={16} /> Reset
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
                        setReset((current) => current + 1);
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
                    <div key={activeTool.id} data-testid="tool-content">
                      {renderActiveTool()}
                    </div>
                  </ToolBoundary>
                </SampleContext.Provider>
              </section>
              <aside className="workspace-help">
                <h2>A little guidance</h2>
                <ol>
                  <li>Enter your content or choose a file.</li>
                  <li>Adjust the options and run the tool.</li>
                  <li>Review, then copy or download.</li>
                </ol>
                <div className="help-note">
                  <Icon name="shield" />
                  <p>
                    Your inputs stay in this browser. AI tools download models
                    on first use.
                  </p>
                </div>
                {["health", "finance"].includes(activeTool.category) ? (
                  <p className="help-warning">
                    Calculations are estimates. Check important decisions with a
                    qualified professional.
                  </p>
                ) : null}
                <button
                  className="text-link"
                  onClick={() => setLegalPage("contact")}
                >
                  Report an issue <Icon name="arrow" size={15} />
                </button>
                <h2 className="related-heading">More to explore</h2>
                {TOOL_LIST.filter(
                  (t) =>
                    t.category === activeTool.category &&
                    t.id !== activeTool.id,
                )
                  .slice(0, 4)
                  .map((t) => (
                    <button
                      className="related-tool"
                      key={t.id}
                      onClick={() => openTool(t.id)}
                    >
                      {t.name}
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
              </aside>
            </div>
          </div>
        ) : (
          <>
            {!search && category === "all" ? (
              <section className="home-hero page-width">
                <div className="hero-copy-new">
                  <span className="hero-pill">
                    <span /> SMALL TASKS. SORTED.
                  </span>
                  <h1>
                    Your everyday tasks.
                    <br />
                    <span>A little easier.</span>
                  </h1>
                  <p>
                    A handy collection of tools for your files, words and ideas.
                    Open a tool. Get it done. Carry on.
                  </p>
                  <div className="hero-buttons">
                    <button
                      className="site-primary"
                      onClick={() =>
                        document
                          .getElementById("tool-directory")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      Explore the toolkit <Icon name="arrow" size={18} />
                    </button>
                    <span>
                      <Icon name="shield" size={17} /> Free. No sign-up.
                    </span>
                  </div>
                  <div className="hero-small-stats">
                    <strong>{TOOL_LIST.length} tools</strong>
                    <span>13 categories</span>
                    <span>Made for your browser</span>
                  </div>
                </div>
                <div className="hero-showcase">
                  <span className="showcase-label">
                    <Icon name="spark" size={16} /> THE PHOTO STUDIO
                  </span>
                  <div className="studio-art" aria-hidden="true">
                    <div className="art-grid" />
                    <div className="art-photo">
                      <svg viewBox="0 0 140 180" fill="none">
                        <rect width="140" height="180" fill="#d9ebe6" />
                        <path
                          d="M15 180v-24c0-34 110-34 110 0v24"
                          fill="#445753"
                        />
                        <path d="M52 105h36v30H52z" fill="#bc8c70" />
                        <ellipse
                          cx="70"
                          cy="69"
                          rx="33"
                          ry="43"
                          fill="#d3a184"
                        />
                        <path
                          d="M37 68C24 8 113 0 106 69L93 44C69 57 50 46 45 42Z"
                          fill="#3b3435"
                        />
                        <path
                          d="M56 73h2m24 0h2"
                          stroke="#453a35"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M63 91q7 5 14 0"
                          stroke="#925c4b"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="art-guide" />
                    </div>
                    <span className="art-measure measure-v">45 mm</span>
                    <span className="art-measure measure-h">35 mm</span>
                    <div className="art-chip">
                      <span /> Ready for a fresh background
                    </div>
                    <div className="art-swatches">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <h2>A better ID photo, in minutes.</h2>
                  <p>
                    Frame your portrait, choose a size and export a print sheet.
                  </p>
                  <button
                    className="showcase-link"
                    onClick={() => openTool("passport-photo-maker")}
                  >
                    Open photo studio <Icon name="arrow" size={18} />
                  </button>
                </div>
              </section>
            ) : null}
            <section
              id="tool-directory"
              className="directory-section page-width"
            >
              <div className="directory-heading">
                <div>
                  <span className="eyeline">THE TOOLKIT</span>
                  <h2>
                    {search
                      ? "Search results"
                      : category === "favourites"
                        ? "Your saved tools"
                        : "Find your next shortcut."}
                  </h2>
                </div>
                <span className="tool-count">
                  {tools.length} tools to explore
                </span>
              </div>
              <div className="directory-layout">
                <aside
                  className="category-sidebar"
                  aria-label="Tool categories"
                >
                  <button
                    className={category === "all" ? "selected" : ""}
                    onClick={() => setCategory("all")}
                  >
                    <Icon size={18} />
                    All tools<span>{TOOL_LIST.length}</span>
                  </button>
                  <button
                    className={category === "favourites" ? "selected" : ""}
                    onClick={() => setCategory("favourites")}
                  >
                    <Icon name="star" size={18} />
                    Saved tools<span>{favourites.length}</span>
                  </button>
                  <div className="category-divider" />
                  {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                    <button
                      key={id}
                      className={category === id ? "selected" : ""}
                      aria-pressed={category === id}
                      onClick={() => setCategory(id)}
                    >
                      <Icon name={CATEGORY_ICONS[id]} size={18} />
                      {label}
                      <span>
                        {TOOL_LIST.filter((t) => t.category === id).length}
                      </span>
                    </button>
                  ))}
                </aside>
                <div className="directory-content">
                  {!search && category === "all" && recent.length ? (
                    <div className="recent-row">
                      <span>Recently opened</span>
                      {recent.map((id) => {
                        const t = TOOL_LIST.find((item) => item.id === id);
                        return t ? (
                          <button key={id} onClick={() => openTool(id)}>
                            {t.name}
                          </button>
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
                      <button
                        className="site-primary"
                        onClick={() => {
                          setSearch("");
                          setCategory("all");
                        }}
                      >
                        Browse all tools
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="site-footer page-width">
        <div className="footer-top">
          <button className="brand-button" onClick={home}>
            <img src="./toolinger-logo.svg" alt="" width="30" height="30" />
            <span>
              toolinger<span className="brand-dot">.</span>
            </span>
          </button>
          <p>A little help for everyday digital work.</p>
          <span className="footer-privacy">
            <Icon name="shield" size={16} /> Your files stay yours.
          </span>
        </div>
        <div className="footer-bottom-new">
          <span>© {new Date().getFullYear()} Toolinger</span>
          <nav aria-label="Policies">
            {Object.entries(LEGAL_CONTENT).map(([id, page]) => (
              <button key={id} onClick={() => setLegalPage(id)}>
                {page.title.replace("Toolinger", "").trim()}
              </button>
            ))}
            <button onClick={() => setLegalPage("choices")}>
              Privacy choices
            </button>
          </nav>
        </div>
      </footer>
      {menuOpen ? (
        <Dialog
          title="Browse categories"
          close={() => setMenuOpen(false)}
          drawer
        >
          <div className="drawer-categories">
            {[
              ["all", "All tools"],
              ["favourites", "Saved tools"],
              ...Object.entries(CATEGORY_LABELS),
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  location.hash = "";
                  setCategory(id);
                  setMenuOpen(false);
                  setSearch("");
                }}
              >
                <Icon
                  name={
                    CATEGORY_ICONS[id] ??
                    (id === "favourites" ? "star" : "grid")
                  }
                />
                {label}
                <Icon name="arrow" size={16} />
              </button>
            ))}
          </div>
        </Dialog>
      ) : null}
      {legalPage ? (
        <Dialog
          title={LEGAL_CONTENT[legalPage]?.title ?? "Privacy choices"}
          close={() => setLegalPage(null)}
        >
          {legalPage === "choices" ? (
            <div className="policy-body">
              <p>
                Your theme, saved tools and recent tool IDs are stored on this
                device. No advertising or analytics scripts are active.
              </p>
              <p>
                Clear notes in Notepad. Remove offline app caches from your
                browser’s site-data settings.
              </p>
              <button
                className="site-primary"
                onClick={() => {
                  setFavourites([]);
                  setRecent([]);
                  setTheme("light");
                  try {
                    localStorage.removeItem("toolinger-consent");
                  } catch {}
                  setNotice("Tool preferences cleared");
                }}
              >
                Clear tool preferences
              </button>
            </div>
          ) : (
            <div className="policy-body">
              {LEGAL_CONTENT[legalPage]?.body
                .split("\n\n")
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              {legalPage === "contact" ? (
                <a className="text-link" href="mailto:lootchaser2026@gmail.com">
                  Email support <Icon name="arrow" size={16} />
                </a>
              ) : null}
            </div>
          )}
        </Dialog>
      ) : null}
      {notice ? (
        <div className="site-toast" role="status">
          {notice}
        </div>
      ) : null}
    </div>
  );
}
export default App;
