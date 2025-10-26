import { useState } from "react";
import { DataSourcesModal } from "./modals/DataSourcesModal";
import { PrivacyModal } from "./modals/PrivacyModal";
import { TermsModal } from "./modals/TermsModal";

export function Footer() {
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200">
        {/* Desktop: Enhanced three-column layout with existing functionality */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              {/* Left: Data sources (original functionality enhanced) */}
              <div className="text-left">
                <button
                  onClick={() => setIsDataSourcesOpen(true)}
                  className="text-blue-500 hover:text-blue-600 underline transition-colors"
                >
                  Website Data Sources
                </button>
              </div>

              {/* Center: Copyright, links, and version info */}
              <div className="text-center">
                <span className="flex items-center justify-center gap-2">
                  <span>© 2025 EazyWeather</span>
                  <span>•</span>
                  <a
                    href="https://lionmystic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline transition-colors"
                  >
                    Lion Mystic
                  </a>
                  <span>•</span>
                  <a
                    href="https://x.com/spencer_i_am"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
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
                <div className="text-xs text-gray-500 mt-1">
                  EazyWeather v{__APP_VERSION__ || "1.0"} •{" "}
                  {__COMMIT_HASH__
                    ? __COMMIT_HASH__.substring(0, 7)
                    : "unknown"}{" "}
                  •{" "}
                  {__BUILD_DATE__ ||
                    new Date().toISOString().slice(0, 19).replace("T", " ")}
                </div>
              </div>

              {/* Right: Privacy and Terms - same formatting as Website Data Sources */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                  <button
                    onClick={() => setIsPrivacyOpen(true)}
                    className="text-blue-500 hover:text-blue-600 underline transition-colors"
                  >
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setIsTermsOpen(true)}
                    className="text-blue-500 hover:text-blue-600 underline transition-colors"
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
          <div className="px-4 py-3 text-xs text-gray-600 space-y-2">
            {/* Row 1: Data Sources on left, Privacy/Terms on right */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsDataSourcesOpen(true)}
                className="text-blue-500 hover:text-blue-600 underline transition-colors"
              >
                Website Data Sources
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-blue-500 hover:text-blue-600 underline transition-colors"
                >
                  Privacy Policy
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsTermsOpen(true)}
                  className="text-blue-500 hover:text-blue-600 underline transition-colors"
                >
                  Terms of Use
                </button>
              </div>
            </div>

            {/* Row 2: Copyright, links, and version info centered */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span>© 2025 EazyWeather</span>
                  <span>•</span>
                  <a
                    href="https://lionmystic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline transition-colors"
                  >
                    Lion Mystic
                  </a>
                  <span>•</span>
                  <a
                    href="https://x.com/spencer_i_am"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
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
                <div className="text-gray-500">
                  EazyWeather v{__APP_VERSION__ || "1.0"} •{" "}
                  {__COMMIT_HASH__
                    ? __COMMIT_HASH__.substring(0, 7)
                    : "unknown"}{" "}
                  •{" "}
                  {__BUILD_DATE__ ||
                    new Date().toISOString().slice(0, 19).replace("T", " ")}
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
    </>
  );
}
