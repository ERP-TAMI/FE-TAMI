import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget =
    env.VITE_API_TARGET ||
    env.VITE_BACKEND_URL ||
    process.env.VITE_API_TARGET ||
    process.env.VITE_BACKEND_URL ||
    "http://localhost:3000";

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      // Git worktrees (e.g. Claude Code sessions) live under .claude/worktrees
      // inside this same directory. Without this, file churn in a nested
      // worktree still triggers this dev server's watcher/full-reloads and
      // can crash it under enough concurrent activity.
      watch: {
        ignored: ["**/.claude/worktrees/**"],
      },
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (pathStr) => pathStr.replace(/^\/api/, ""),
        },
        "/uploads": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
