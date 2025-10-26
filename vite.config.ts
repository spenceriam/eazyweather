import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { execSync } from "child_process";

// Read package.json to get version
const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
const VERSION = packageJson.version;

// Generate build timestamp
const BUILD_DATE = new Date().toISOString().slice(0, 19).replace("T", " ");

// Get current commit hash for version tracking
const COMMIT_HASH = execSync("git rev-parse --short HEAD").toString().trim();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __COMMIT_HASH__: JSON.stringify(COMMIT_HASH),
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },
});
