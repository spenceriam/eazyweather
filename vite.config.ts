import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";

// Read package.json to get version
const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
const VERSION = packageJson.version;

// Generate build timestamp
const BUILD_DATE = new Date().toISOString().slice(0, 19).replace("T", " ");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },
});
