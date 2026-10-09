export type CategoryId =
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
  | "utility"
  | "lifestyle";

export type ToolEngine =
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
  | "local-ai"
  | "lifestyle";

export type ToolConfig = {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  keywords: string[];
  engine: ToolEngine;
  mode?: string;
};

export const CATEGORY_LABELS: Record<CategoryId, string> = {
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
  lifestyle: "Daily Life",
};

export const TOOL_LIST: ToolConfig[] = [
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
  { id: "daily-planner", name: "Daily Planner", category: "lifestyle", description: "Plan tasks with due dates and priorities.", keywords: ["todo", "tasks", "planner"], engine: "lifestyle", mode: "tasks" },
  { id: "habit-tracker", name: "Habit Tracker", category: "lifestyle", description: "Build daily habits and track your streak.", keywords: ["habits", "routine", "streak"], engine: "lifestyle", mode: "habits" },
  { id: "expense-tracker", name: "Expense & Budget Tracker", category: "lifestyle", description: "Track spending and your monthly budget.", keywords: ["expenses", "money", "budget"], engine: "lifestyle", mode: "budget" },
  { id: "shopping-list", name: "Smart Shopping List", category: "lifestyle", description: "Organise groceries with quantities and prices.", keywords: ["groceries", "shopping", "list"], engine: "lifestyle", mode: "shopping" },
  { id: "focus-timer", name: "Focus Timer", category: "lifestyle", description: "Make time for focused work and breaks.", keywords: ["pomodoro", "timer", "study"], engine: "lifestyle", mode: "focus" },
  { id: "hydration-tracker", name: "Hydration Tracker", category: "lifestyle", description: "Log water and track a daily goal.", keywords: ["water", "hydration", "daily"], engine: "lifestyle", mode: "hydration" },
  { id: "savings-goal", name: "Savings Goal Planner", category: "lifestyle", description: "Work out a monthly path to your goal.", keywords: ["savings", "goals", "money"], engine: "lifestyle", mode: "savings" },
  { id: "split-bill", name: "Bill Splitter", category: "lifestyle", description: "Split bills and tips fairly to the cent.", keywords: ["split", "bill", "tip"], engine: "lifestyle", mode: "split" },
  { id: "meal-planner", name: "Weekly Meal Planner", category: "lifestyle", description: "Plan a week of meals and make a shopping list.", keywords: ["food", "meals", "weekly"], engine: "lifestyle", mode: "meals" },
  { id: "recipe-scaler", name: "Recipe Scaler", category: "lifestyle", description: "Scale ingredient quantities for any serving count.", keywords: ["cooking", "recipe", "servings"], engine: "lifestyle", mode: "recipe" },
  { id: "date-calculator", name: "Date Calculator", category: "lifestyle", description: "Count days or add days to a date.", keywords: ["days", "dates", "deadline"], engine: "lifestyle", mode: "dates" },
  { id: "world-clock", name: "World Clock & Time Zones", category: "lifestyle", description: "Compare the current time across cities.", keywords: ["time", "cities", "timezone"], engine: "lifestyle", mode: "clock" },
  { id: "unit-price-comparison", name: "Unit Price Comparison", category: "lifestyle", description: "Compare package prices in matching units.", keywords: ["price", "value", "shopping"], engine: "lifestyle", mode: "price" },
  { id: "packing-checklist", name: "Packing Checklist", category: "lifestyle", description: "Prepare a reusable travel checklist.", keywords: ["travel", "packing", "checklist"], engine: "lifestyle", mode: "packing" },
];
