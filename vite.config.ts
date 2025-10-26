import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { execSync } from "child_process";

// Read package.json to get version
const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
const VERSION = packageJson.version;

// Generate build timestamp
const BUILD_DATE = new Date().toISOString().slice(0, 19).replace("T", " ");

// Get current commit hash for version tracking with better error handling
let COMMIT_HASH = "unknown";
try {
  COMMIT_HASH = execSync("git rev-parse --short HEAD", {
    encoding: "utf8",
  }).trim();
  console.log("Commit hash extracted successfully:", COMMIT_HASH);
} catch (error) {
  console.warn("Could not get commit hash:", error.message);
  // Fallback to environment variable if available (Vercel provides this)
  const vercelCommit = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercelCommit) {
    COMMIT_HASH = vercelCommit.substring(0, 7);
    console.log("Using Vercel commit hash:", COMMIT_HASH);
  } else {
    // Final fallback to build timestamp
    COMMIT_HASH = "build-" + Date.now().toString(36);
    console.log("Using fallback build ID:", COMMIT_HASH);
  }
}

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
