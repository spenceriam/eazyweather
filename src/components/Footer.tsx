import { useState } from "react";
import { Github } from "lucide-react";
import { AboutModal } from "./modals/AboutModal";
import { DataSourcesModal } from "./modals/DataSourcesModal";
import { PrivacyModal } from "./modals/PrivacyModal";
import { TermsModal } from "./modals/TermsModal";
import { WhatsNewModal } from "./modals/WhatsNewModal";

export function Footer() {
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="border-t border-line bg-bg">
        {/* Desktop: two-column layout */}
        <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto px-4 py-3 text-sm text-ui-body">
          <div>
            <span>
              © {currentYear} EazyWeather · Weather data: National Weather
              Service · v{__APP_VERSION__ || "1.0"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/spenceriam/eazyweather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mut hover:text-ink transition-colors"
              aria-label="EazyWeather on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://x.com/spencer_i_am"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mut hover:text-ink transition-colors"
              aria-label="Follow Spencer Francisco on X.com"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <button
              onClick={() => setIsWhatsNewOpen(true)}
              className="text-link hover:underline"
            >
              What's new
            </button>
            <button
              onClick={() => setIsDataSourcesOpen(true)}
              className="text-link hover:underline"
            >
              Data sources
            </button>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="text-link hover:underline"
            >
              Privacy
            </button>
            <button
              onClick={() => setIsTermsOpen(true)}
              className="text-link hover:underline"
            >
              Terms
            </button>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-link hover:underline"
            >
              About
            </button>
          </div>
        </div>

        {/* Mobile: two centered rows */}
        <div className="md:hidden px-4 py-3 text-xs text-ui-body space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span>
              © {currentYear} EazyWeather
            </span>
            <a
              href="https://github.com/spenceriam/eazyweather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mut hover:text-ink transition-colors"
              aria-label="EazyWeather on GitHub"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <button
              onClick={() => setIsWhatsNewOpen(true)}
              className="text-link hover:underline"
            >
              What's new
            </button>
            <span className="text-mut">·</span>
            <button
              onClick={() => setIsDataSourcesOpen(true)}
              className="text-link hover:underline"
            >
              Data sources
            </button>
            <span className="text-mut">·</span>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="text-link hover:underline"
            >
              Privacy
            </button>
            <span className="text-mut">·</span>
            <button
              onClick={() => setIsTermsOpen(true)}
              className="text-link hover:underline"
            >
              Terms
            </button>
            <span className="text-mut">·</span>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-link hover:underline"
            >
              About
            </button>
          </div>
        </div>
      </footer>

      {/* All modals */}
      <DataSourcesModal
        isOpen={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
      />
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <WhatsNewModal
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
      />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
