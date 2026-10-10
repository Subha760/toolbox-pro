import React from "react";
import { createRoot } from "react-dom/client";
const App = React.lazy(() => import("./app.tsx"));
const Admin = React.lazy(() => import("./src/admin.tsx"));
const ownerRoute = /\/admin\/?$/.test(location.pathname);
import "./src/tailwind.css";
import "./styles.css";
import "./src/workbench.css";
import "./src/home-experience.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={<p role="status">Opening Toolinger…</p>}>
      {ownerRoute ? <Admin /> : <App />}
    </React.Suspense>
  </React.StrictMode>,
);
if (
  "serviceWorker" in navigator &&
  import.meta.env.PROD &&
  location.hostname !== "localhost"
)
  window.addEventListener("load", () =>
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`),
  );
