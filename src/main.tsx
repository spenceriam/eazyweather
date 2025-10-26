import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import "./index.css";

// Service worker removed to fix caching issues - Issue #30
// This app is online-only and doesn't need PWA capabilities

// Unregister existing service workers for all users
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister().then(function (boolean) {
        if (boolean) {
          console.log("Service worker unregistered successfully");
        }
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
