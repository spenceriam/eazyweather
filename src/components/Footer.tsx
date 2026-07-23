import { useState } from "react";
import { AboutModal } from "./modals/AboutModal";
import { DataSourcesModal } from "./modals/DataSourcesModal";
import { PrivacyModal } from "./modals/PrivacyModal";
import { TermsModal } from "./modals/TermsModal";
import { WhatsNewModal } from "./modals/WhatsNewModal";
import { Modal } from "./ui/Modal";

type FooterModal = "whats" | "data" | "priv" | "terms" | "about" | "menu" | null;

const LINKS: { key: Exclude<FooterModal, "menu" | null>; label: string }[] = [
  { key: "whats", label: "What's new" },
  { key: "data", label: "Data sources" },
  { key: "priv", label: "Privacy" },
  { key: "terms", label: "Terms" },
  { key: "about", label: "About" },
];

/**
 * Slim single-row in-flow footer per the design: copyright, X icon, version,
 * GitHub icon, then text links (desktop) or an "Info" menu (mobile).
 */
export function Footer() {
  const [open, setOpen] = useState<FooterModal>(null);

  return (
    <>
      <footer className="border-t border-headline mt-auto">
        <div className="max-w-[1264px] mx-auto px-4 py-2.5 md:px-12 md:py-0 min-h-[46px] flex items-center justify-center md:justify-start gap-2 flex-wrap text-xs text-mut">
          <span>© {new Date().getFullYear()} EazyWeather</span>
          <a
            href="https://x.com/spencer_i_am"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="text-soft flex"
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <span className="opacity-40">·</span>
          <span>v{__APP_VERSION__ || "2.0.0"}</span>
          <a
            href="https://github.com/spenceriam/eazyweather"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-soft flex ml-0.5"
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <div className="flex-1 hidden md:block" />
          <div className="hidden md:contents">
            {LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => setOpen(link.key)}
                className="text-xs text-soft cursor-pointer hover:text-ink transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen("menu")}
            className="flex md:hidden items-center text-xs text-soft cursor-pointer"
          >
            <span className="opacity-40">·</span>&nbsp;&nbsp;Info
          </button>
        </div>
      </footer>

      {/* Mobile "Info" menu — a simple list that routes to the same modals. */}
      <Modal isOpen={open === "menu"} onClose={() => setOpen(null)} title="EazyWeather">
        <div className="flex flex-col">
          {LINKS.map((link, index) => (
            <button
              key={link.key}
              type="button"
              onClick={() => setOpen(link.key)}
              className={`text-left px-0.5 py-[11px] text-[13px] font-semibold text-ink2 cursor-pointer ${
                index < LINKS.length - 1 ? "border-b border-hair" : ""
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </Modal>

      <WhatsNewModal isOpen={open === "whats"} onClose={() => setOpen(null)} />
      <DataSourcesModal isOpen={open === "data"} onClose={() => setOpen(null)} />
      <PrivacyModal isOpen={open === "priv"} onClose={() => setOpen(null)} />
      <TermsModal isOpen={open === "terms"} onClose={() => setOpen(null)} />
      <AboutModal isOpen={open === "about"} onClose={() => setOpen(null)} />
    </>
  );
}
