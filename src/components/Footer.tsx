import { useState } from "react";
import { DataSourcesModal } from "./modals/DataSourcesModal";
import { PrivacyModal } from "./modals/PrivacyModal";
import { TermsModal } from "./modals/TermsModal";
import { WhatsNewModal } from "./modals/WhatsNewModal";

export function Footer() {
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  return (
    <>
      <footer
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 dark:border-slate-700 bg-[#f9f6ee] dark:bg-slate-900"
      >
        {/* Desktop: Enhanced three-column layout with existing functionality */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
              {/* Left: Data sources + What's New */}
              <div className="text-left">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <button
                    onClick={() => setIsDataSourcesOpen(true)}
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                  >
                    Website Data Sources
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setIsWhatsNewOpen(true)}
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                  >
                    What's New
                  </button>
                </div>
              </div>

              {/* Center: Copyright, links, and version info */}
              <div className="text-center">
                <span className="flex items-center justify-center gap-2">
                  <span>© 2026 EazyWeather</span>
                  <span>•</span>
                  <a
                    href="https://lionmystic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                  >
                    Lion Mystic
                  </a>
                  <span>•</span>
                  <a
                    href="https://x.com/spencer_i_am"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 transition-colors flex items-center gap-1"
                    aria-label="Follow Spencer Francisco on X.com"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    spencer_i_am
                  </a>
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                  <span>EazyWeather v{__APP_VERSION__ || "1.0"}</span>
                  <span>•</span>
                  <a
                    href={`https://github.com/spenceriam/eazyweather/commit/${__COMMIT_HASH__ || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 transition-colors flex items-center gap-1"
                    aria-label="View commit on GitHub"
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    {__COMMIT_HASH__
                      ? __COMMIT_HASH__.substring(0, 7)
                      : "unknown"}
                  </a>
                  <span>•</span>
                  <span>
                    {__BUILD_DATE__ ||
                      new Date()
                        .toISOString()
                        .slice(0, 19)
                        .replace("T", " ")}{" "}
                    UTC
                  </span>
                </div>
              </div>

              {/* Right: Privacy and Terms - same formatting as Website Data Sources */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <button
                    onClick={() => setIsPrivacyOpen(true)}
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                  >
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setIsTermsOpen(true)}
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                  >
                    Terms of Use
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Two-row layout */}
        <div className="md:hidden">
          <div className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 space-y-2">
            {/* Row 1: Data Sources + What's New on left, Privacy/Terms on right */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDataSourcesOpen(true)}
                  className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                >
                  Website Data Sources
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsWhatsNewOpen(true)}
                  className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                >
                  What's New
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                >
                  Privacy Policy
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsTermsOpen(true)}
                  className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                >
                  Terms of Use
                </button>
              </div>
            </div>

            {/* Row 2: Copyright, links, and version info centered */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span>© 2026 EazyWeather</span>
                  <span>•</span>
                  <a
                    href="https://lionmystic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 underline transition-colors"
                  >
                    Lion Mystic
                  </a>
                  <span>•</span>
                  <a
                    href="https://x.com/spencer_i_am"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 transition-colors flex items-center gap-1"
                    aria-label="Follow Spencer Francisco on X.com"
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    spencer_i_am
                  </a>
                </div>
                <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <span>EazyWeather v{__APP_VERSION__ || "1.0"}</span>
                  <span>•</span>
                  <a
                    href={`https://github.com/spenceriam/eazyweather/commit/${__COMMIT_HASH__ || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:text-brand-dark dark:text-blue-300 dark:hover:text-blue-200 transition-colors flex items-center gap-1"
                    aria-label="View commit on GitHub"
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    {__COMMIT_HASH__
                      ? __COMMIT_HASH__.substring(0, 7)
                      : "unknown"}
                  </a>
                  <span>•</span>
                  <span>
                    {__BUILD_DATE__ ||
                      new Date()
                        .toISOString()
                        .slice(0, 19)
                        .replace("T", " ")}{" "}
                    UTC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* All modals - original + new */}
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
    </>
  );
}
