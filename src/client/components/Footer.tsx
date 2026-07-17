import React from "react";

export function Footer() {
  return (
    <footer className="relative z-10 mt-20 pt-12 pb-12 border-t border-[var(--color-ink-3)] flex flex-col sm:flex-row justify-between items-center gap-6 max-w-6xl mx-auto px-4 sm:px-6 w-full">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-12 w-full text-center sm:text-left">
        <div className="flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
            <div className="w-6 h-6 bg-[var(--color-accent)]/10 rounded flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7"></path>
                <path d="M7 7h10v10"></path>
              </svg>
            </div>
            <span className="font-heading font-bold text-lg text-[var(--color-fg-1)]">FondTracker</span>
          </div>
          <p className="text-sm text-[var(--color-fg-4)] leading-relaxed max-w-sm mb-6 mx-auto sm:mx-0">
            Track your investments centrally. Automated, secure, and designed for maximum financial clarity.
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-6 font-mono">
            <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-fg-4)] hover:text-[var(--color-fg-2)] cursor-pointer transition-colors">Privacy Policy</a>
            <a href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-fg-4)] hover:text-[var(--color-fg-2)] cursor-pointer transition-colors">Terms of Service</a>
          </div>
        </div>
        <div className="flex-none">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-fg-4)] mb-4">Contact</h4>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-[var(--color-fg-2)]">Rubén Blasco Armengod</p>
            <ul className="space-y-3 mt-1">
              <li>
                <a href="mailto:rubenblascoarmengod@gmail.com" className="text-sm text-[var(--color-fg-4)] hover:text-[var(--color-accent)] transition-colors flex items-center justify-center sm:justify-start gap-2 group">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  rubenblascoarmengod@gmail.com
                </a>
              </li>
              <li>
                <a href="https://github.com/rubenblascoa" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-fg-4)] hover:text-[var(--color-accent)] transition-colors flex items-center justify-center sm:justify-start gap-2 group">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.372.79 1.102.79 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
