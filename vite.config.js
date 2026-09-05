import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ base: "./", plugins: [{ name: "toolinger-tsx-entry", enforce: "pre", async transform(code, id) { if (id.endsWith("/app.js")) return transformWithEsbuild(code, id, { loader: "tsx", jsx: "automatic" }); } }, react()], build: { target: "es2022" } });
