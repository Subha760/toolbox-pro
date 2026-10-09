import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command, isPreview }) => ({
  base:
    command === "build" || isPreview
      ? process.env.VITE_APP_BASE || "/toolbox-pro/"
      : "/",
  plugins: [react()],
  build: { target: "es2022" },
}));
