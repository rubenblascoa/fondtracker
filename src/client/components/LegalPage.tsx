import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LegalPageProps {
  view: "privacy" | "terms";
}

export function LegalPage({ view }: LegalPageProps) {
  const isPrivacy = view === "privacy";

  return (
    <div className="flex flex-col min-h-screen relative z-10">
      <Header />
      <div className="flex-1 flex items-start justify-center px-4 py-12 sm:py-24">
        <div 
          className="w-full max-w-4xl bg-black/20 backdrop-blur-sm border border-white/5 shadow-2xl p-6 sm:p-12 fade-in relative"
        >
          {/* Navigation / Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 border-b border-[var(--color-ink-3)] pb-6">
            <h1 className="font-heading font-semibold text-3xl sm:text-4xl text-[var(--color-fg-1)]">
              {isPrivacy ? "Privacy Policy" : "Terms of Service"}
            </h1>
          </div>

        {/* Content */}
        <div className="font-mono text-sm leading-relaxed text-[var(--color-fg-3)] space-y-8">
          {isPrivacy ? (
            <>
              <p className="text-[var(--color-fg-4)] italic">Last updated: July 17, 2026</p>
              
              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">1. Information We Collect</h3>
                <p className="mb-3">
                  At FondTracker, we prioritize your privacy. We collect minimal personal information necessary to provide our services. This includes your email address for account authentication and your encrypted password. We also store your investment portfolio data (fund names, quantities, purchase prices, and dates) strictly for the purpose of rendering your dashboard.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">2. How We Use Your Information</h3>
                <p className="mb-3">
                  Your portfolio data is used exclusively to track your investments, calculate real-time performance against market data, and generate automated notifications if you opt-in. We do not sell, rent, or share your personal data or investment details with any third parties, advertisers, or affiliates under any circumstances.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">3. Data Security</h3>
                <p className="mb-3">
                  We employ industry-standard security measures, including bcrypt for password hashing and secure token-based authentication. Your connection to our servers is fully encrypted using SSL/TLS. However, no internet transmission is 100% secure, and we cannot guarantee absolute security against unauthorized access.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">4. Third-Party Integrations</h3>
                <p className="mb-3">
                  Our application retrieves real-time market data from Yahoo Finance via proxy APIs. We only transmit standard public ticker symbols (e.g., AAPL, VTI) to fetch market prices. No personally identifiable information or portfolio holdings are transmitted to these third-party financial services.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">5. Data Deletion & Account Termination</h3>
                <p className="mb-3">
                  You retain full ownership of your data. You may permanently delete your account and all associated portfolio data at any time via the settings menu. Upon deletion, all records tied to your account are irreversibly erased from our databases.
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="text-[var(--color-fg-4)] italic">Last updated: July 17, 2026</p>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">1. Acceptance of Terms</h3>
                <p className="mb-3">
                  By creating an account and using FondTracker ("the Service"), you agree to be bound by these Terms of Service. If you do not agree with these terms, please do not access or use our platform.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">2. Service Description & Financial Disclaimer</h3>
                <p className="mb-3">
                  FondTracker is a software application designed to help users track and monitor their personal investments. <strong>We are not financial advisors, brokers, or a registered investment advisory firm.</strong> The data, charts, and calculations provided by the Service are for informational purposes only and should not be construed as financial advice, investment recommendations, or an offer to buy or sell securities.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">3. Accuracy of Information</h3>
                <p className="mb-3">
                  While we strive to provide accurate, real-time market data through our integration with third-party providers (such as Yahoo Finance), we do not guarantee the accuracy, completeness, or timeliness of any market quotes, return calculations, or portfolio values. You are solely responsible for independently verifying all financial data before making any investment decisions.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">4. User Responsibilities</h3>
                <p className="mb-3">
                  You are responsible for maintaining the confidentiality of your account credentials. You agree not to use the Service for any unlawful purpose or to attempt to disrupt, exploit, or bypass the platform's security mechanisms.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[var(--color-fg-1)] mb-3">5. Limitation of Liability</h3>
                <p className="mb-3">
                  To the fullest extent permitted by law, FondTracker shall not be liable for any direct, indirect, incidental, or consequential damages, including but not limited to loss of profits, data, or financial losses arising from the use or inability to use the Service, even if we have been advised of the possibility of such damages.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
