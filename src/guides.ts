export const GUIDES = [
  {
    slug: "prepare-an-id-photo",
    title: "Prepare an ID photo without the guesswork",
    description:
      "Choose dimensions, frame a portrait and export a print sheet.",
    tools: ["passport-photo-maker"],
    sections: [
      {
        title: "Start with the authority’s rules",
        body: "Check the official dimensions, head position, permitted background and editing rules before taking a photo. Toolinger templates help with sizing; they do not check official compliance.",
      },
      {
        title: "Use a clear original",
        body: "Choose a front-facing, evenly lit portrait with no heavy filter. Upload JPG, PNG or WebP. Background removal runs locally but requires a model download on first use. Check hair and clothing edges afterward.",
      },
      {
        title: "Frame and export",
        body: "Use zoom and position controls, generate a fresh preview and inspect it. Enhancement stays off by default. Download JPG/PNG for digital applications or a 4 × 6 print sheet. Print the PDF at actual size, 100%, without fit-to-page.",
      },
    ],
  },
  {
    slug: "build-a-daily-routine",
    title: "Build a routine you can keep",
    description:
      "Plan fewer tasks, focus on one and make habits easy to repeat.",
    tools: ["daily-planner", "focus-timer", "habit-tracker"],
    sections: [
      {
        title: "Choose a realistic plan",
        body: "Use the daily planner to write down tasks, set due dates and mark important work as high priority. Give yourself room for interruptions instead of filling every hour.",
      },
      {
        title: "Focus on one thing",
        body: "Start a 25-minute session in the focus timer. Pause if you need to step away, then take a short break. The timer measures elapsed time so background tabs do not slowly drift.",
      },
      {
        title: "Keep habits small",
        body: "Add a habit you can repeat even on a busy day. Mark it done after completing it. Review the last seven days and your current streak, then back up your data from My space.",
      },
    ],
  },
  {
    slug: "budget-and-shop-better",
    title: "Make everyday spending easier to see",
    description:
      "Track expenses, compare prices and plan meals before shopping.",
    tools: [
      "expense-tracker",
      "unit-price-comparison",
      "meal-planner",
      "shopping-list",
      "savings-goal",
    ],
    sections: [
      {
        title: "Pick a monthly budget",
        body: "Choose your currency and monthly budget in the expense tracker. Log each expense with its date and category. Use the month filter and CSV export to review spending. The currency selector labels amounts; it does not convert past entries.",
      },
      {
        title: "Compare like with like",
        body: "Use unit-price comparison with the same quantity unit for both packages. For example, compare price per gram or price per millilitre. A larger package is only better value if its unit price is lower.",
      },
      {
        title: "Plan before the shop",
        body: "Write your meals for the week, then add ingredients to your shopping list. Check items off as you buy them. Use the savings planner to estimate the number of fixed monthly contributions needed for a goal; interest is excluded.",
      },
    ],
  },
  {
    slug: "work-with-pdfs",
    title: "Reorder and export PDFs with confidence",
    description: "Use page ranges, inspect results and keep your originals.",
    tools: [
      "merge-pdf",
      "rearrange-pdf-pages",
      "extract-pdf-pages",
      "pdf-preview",
    ],
    sections: [
      {
        title: "Keep the original",
        body: "Toolinger edits a browser copy and downloads a new result. Keep the original file so you can undo a change or compare output.",
      },
      {
        title: "Write the order you want",
        body: "For a three-page document, enter 3,1,2 to move page three to the front. Page selections also accept inclusive ranges such as 1-3,5. Invalid selections are rejected instead of silently skipped.",
      },
      {
        title: "Check the downloaded file",
        body: "Open the result in the PDF preview tool and confirm the page count and sequence. Re-saving a PDF may not reduce image-heavy files; compression results vary.",
      },
    ],
  },
  {
    slug: "protect-your-local-data",
    title: "Keep your browser data safe",
    description: "Understand local saving, backups and privacy controls.",
    tools: ["notepad", "daily-planner", "habit-tracker"],
    sections: [
      {
        title: "Know what is saved",
        body: "Daily-life tools store their entries in this browser. Saved tools, theme and recent tool IDs are also local. Uploaded files and most processing inputs are temporary. No account sync is provided.",
      },
      {
        title: "Export a backup",
        body: "Open My space and download a JSON backup before clearing site data or changing devices. The backup can include private tasks and expenses, so store it securely. Backups are checked before restore, and you choose whether to replace the listed sections.",
      },
      {
        title: "Manage storage and ads",
        body: "Clear planner data in My space, notepad text in Notepad, and site preferences in Privacy choices. Use browser site settings to remove caches. Advertising stays disabled until the publisher setup is complete and the applicable consent requirements are met.",
      },
    ],
  },
];
