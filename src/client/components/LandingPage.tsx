import { Header } from "./Header";
import { Footer } from "./Footer";
import type { User } from "../api";

export function LandingPage({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <>
      <Header user={user} onLogout={onLogout} landingNav />

      {/* Hero */}
      <div className="landing-page-wrapper">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary bg-opacity-10 border border-brand-primary border-opacity-30 text-brand-primary font-semibold text-xs rounded-full mb-8" data-pixel-id="xhsrf" data-pixel-kind="text">
          Now supporting 490+ European Funds
        </div>
        <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight text-white mb-6" data-pixel-id="3zxoj" data-pixel-kind="text">
          Investment tracking <br />
          <span className="text-brand-primary">reimagined.</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-lg mb-10 leading-relaxed" data-pixel-id="jjvzd" data-pixel-kind="text">
          The all-in-one terminal for mutual funds and ETFs. Real-time NAV syncing, deep portfolio analytics, and automated WhatsApp notifications.
        </p>
        <div className="flex flex-wrap gap-4" data-pixel-id="qoinn" data-pixel-kind="text">
          <a href="/register" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-brand-primary text-black font-bold text-lg rounded-xl shadow-neon hover:shadow-neon-hover transition-all" data-pixel-id="qgdae" data-pixel-kind="link">
            Get Started for Free
          </a>
          <a href="https://github.com/rubenblascoa/fondtracker" target="_blank" rel="noopener noreferrer" className="px-8 py-4 border border-border-terminal text-text-primary font-semibold text-lg rounded-xl hover:bg-neutral-surface transition-all flex items-center gap-2" data-pixel-id="ea6p7" data-pixel-kind="link">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.372.79 1.102.79 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
            View GitHub
          </a>
        </div>
      </div>

      {/* Dashboard Mockup */}
      <div className="relative lg:mt-0 mt-12" data-animation-on-scroll="">
        <div className="glass-card rounded-2xl p-6 border border-white border-opacity-10 shadow-card overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-loss"></div>
              <div className="w-3 h-3 rounded-full bg-brand-accent"></div>
              <div className="w-3 h-3 rounded-full bg-brand-primary"></div>
            </div>
            <div className="text-[10px] font-mono text-text-light uppercase tracking-widest" data-pixel-id="bhmh2" data-pixel-kind="text">Analytics Dashboard</div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-1">
              <div className="text-xs text-text-secondary uppercase" data-pixel-id="rr27p" data-pixel-kind="text">Total Value</div>
              <div className="text-3xl font-bold text-white" data-pixel-id="c2aau" data-pixel-kind="text">€124,562</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-text-secondary uppercase" data-pixel-id="yvxz1" data-pixel-kind="text">24h Change</div>
              <div className="text-3xl font-bold text-brand-primary" data-pixel-id="pj2ma" data-pixel-kind="text">+1.24%</div>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-white border-opacity-5">
            <img src="https://assets.landinghero.app/m/P6c9APcQzZhpeVW3mkqYFQ.webp#lh=1026x842" alt="Dashboard interface" className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity" data-pixel-id="iv96q" data-pixel-kind="image" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-surface to-transparent opacity-40"></div>
          </div>
        </div>

        <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-primary opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-brand-primary opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* Features Grid */}
      <section className="py-24 border-y border-border-terminal bg-neutral-surface" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16" data-animation-on-scroll="">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4" data-pixel-id="1bjwt" data-pixel-kind="text">Precision Engineering</h2>
            <p className="text-text-secondary text-lg max-w-2xl" data-pixel-id="0fii1" data-pixel-kind="text">Mathematical accuracy meets professional design for serious investors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl border border-white border-opacity-5 hover:border-brand-primary hover:border-opacity-30 transition-all group" data-animation-on-scroll="">
              <div className="w-12 h-12 bg-brand-primary bg-opacity-10 rounded-xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3" data-pixel-id="95cw2" data-pixel-kind="text">Hybrid Sync Engine</h3>
              <p className="text-sm text-text-secondary leading-relaxed" data-pixel-id="n9ff1" data-pixel-kind="text">
                Combines Yahoo Finance v8 for global ETFs with specialized QueFondos scraping for Spanish mutual fund NAVs.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-white border-opacity-5 hover:border-brand-primary hover:border-opacity-30 transition-all group" data-animation-on-scroll="">
              <div className="w-12 h-12 bg-brand-primary bg-opacity-10 rounded-xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.9 1.9 0 01-1.2-.4L4 18V6a2 2 0 012-2h10a2 2 0 012 2v2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3" data-pixel-id="4z457" data-pixel-kind="text">WhatsApp Digests</h3>
              <p className="text-sm text-text-secondary leading-relaxed" data-pixel-id="h2u83" data-pixel-kind="text">
                Receive automated portfolio reports via CallMeBot. Intelligent data chunking ensures you never miss a delta.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-white border-opacity-5 hover:border-brand-primary hover:border-opacity-30 transition-all group" data-animation-on-scroll="">
              <div className="w-12 h-12 bg-brand-primary bg-opacity-10 rounded-xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2zm6 0v-11a2 2 0 00-2-2h-4a2 2 0 00-2 2v11a2 2 0 002 2h4a2 2 0 002-2zM21 19V3a2 2 0 00-2-2h-4a2 2 0 00-2 2v16a2 2 0 002 2h4a2 2 0 002-2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3" data-pixel-id="deorj" data-pixel-kind="text">Custom Visualizations</h3>
              <p className="text-sm text-text-secondary leading-relaxed" data-pixel-id="ffl04" data-pixel-kind="text">
                Native HTML5 Canvas rendering for zero-latency interactive charts. No heavy external libraries required.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-white border-opacity-5 hover:border-brand-primary hover:border-opacity-30 transition-all group" data-animation-on-scroll="">
              <div className="w-12 h-12 bg-brand-primary bg-opacity-10 rounded-xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3" data-pixel-id="nve71" data-pixel-kind="text">ISIN Auto-Discovery</h3>
              <p className="text-sm text-text-secondary leading-relaxed" data-pixel-id="mrd0q" data-pixel-kind="text">
                Smart ticker resolution with database persistence. Finds exchange suffixes automatically for global compatibility.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-white border-opacity-5 hover:border-brand-primary hover:border-opacity-30 transition-all group" data-animation-on-scroll="">
              <div className="w-12 h-12 bg-brand-primary bg-opacity-10 rounded-xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3" data-pixel-id="62m4q" data-pixel-kind="text">Enterprise Security</h3>
              <p className="text-sm text-text-secondary leading-relaxed" data-pixel-id="y69g7" data-pixel-kind="text">
                JWT HMAC-SHA256 user isolation, Bcrypt hashing, SSRF protection, and DoS-safe parsing built-in.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-white border-opacity-5 hover:border-brand-primary hover:border-opacity-30 transition-all group" data-animation-on-scroll="">
              <div className="w-12 h-12 bg-brand-primary bg-opacity-10 rounded-xl flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 00.547 1.022l1.428 1.428a2 2 0 002.828 0l1.428-1.428a2 2 0 00.547-1.022l.477-2.387a2 2 0 00-1.414-1.96l-2.387-.477a2 2 0 00-1.022.547l-1.428 1.428a2 2 0 00-2.828 0l-1.428-1.428z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3" data-pixel-id="3ftpa" data-pixel-kind="text">Metadata Enrichment</h3>
              <p className="text-sm text-text-secondary leading-relaxed" data-pixel-id="updnl" data-pixel-kind="text">
                Heuristic templates provide TER, sector allocation, and geographical exposure for insightful portfolio views.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-neutral-background" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative" data-animation-on-scroll="">
              <div className="glass-card p-6 rounded-2xl border border-white border-opacity-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-5">
                    <div className="w-8 h-8 rounded bg-brand-primary bg-opacity-20 flex items-center justify-center text-brand-primary font-mono text-xs">1</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white" data-pixel-id="u1vd6" data-pixel-kind="text">Input ISIN Code</div>
                      <div className="text-xs text-text-secondary" data-pixel-id="lky75" data-pixel-kind="text">ES0113312003...</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-5">
                    <div className="w-8 h-8 rounded bg-brand-primary bg-opacity-20 flex items-center justify-center text-brand-primary font-mono text-xs">2</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white" data-pixel-id="xvchn" data-pixel-kind="text">System Discovery</div>
                      <div className="text-xs text-text-secondary" data-pixel-id="31h6a" data-pixel-kind="text">Resolving Yahoo Ticker &amp; QueFondos NAV</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                    <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-black font-mono text-xs font-bold">3</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white" data-pixel-id="nsrvs" data-pixel-kind="text">Interactive Charting</div>
                      <div className="text-xs text-text-secondary" data-pixel-id="caqgj" data-pixel-kind="text">Real-time Performance Delta Analysis</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div data-animation-on-scroll="">
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6 uppercase" data-pixel-id="6hnqh" data-pixel-kind="text">Unified Analytics</h2>
              <p className="text-text-secondary text-lg mb-8" data-pixel-id="rwfxf" data-pixel-kind="text">
                FondTracker bridges the gap between traditional banking data and modern analysis tools. By automating the data retrieval process, you get a clean, actionable view of your net worth without the manual work.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3" data-pixel-id="3etvk" data-pixel-kind="text">
                  <div className="mt-1 text-brand-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                    <span className="text-white font-bold">Secure User Isolation</span>
                    <p className="text-sm text-text-secondary">Your data is yours. Every portfolio is isolated with enterprise-grade JWT auth.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3" data-pixel-id="9uub1" data-pixel-kind="text">
                  <div className="mt-1 text-brand-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                    <span className="text-white font-bold">Resilient Price Caching</span>
                    <p className="text-sm text-text-secondary">Historical and current prices are cached locally to ensure speed and availability.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 bg-neutral-surface border-t border-border-terminal" id="tech-stack">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16" data-animation-on-scroll="">
            <h2 className="font-heading text-4xl font-bold text-white mb-4" data-pixel-id="1j8qv" data-pixel-kind="text">Built with Modern Tech</h2>
            <p className="text-text-secondary" data-pixel-id="o4mnp" data-pixel-kind="text">High-performance stack for reliable financial tracking.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="glass-card p-8 rounded-2xl text-center hover:bg-white hover:bg-opacity-5 transition-colors border border-white border-opacity-5" data-animation-on-scroll="">
              <div className="text-2xl font-bold text-white mb-2" data-pixel-id="5bx84" data-pixel-kind="text">Bun 1.3</div>
              <p className="text-xs text-text-secondary font-mono" data-pixel-id="7g6f1" data-pixel-kind="text">Ultra-fast Runtime</p>
            </div>
            <div className="glass-card p-8 rounded-2xl text-center hover:bg-white hover:bg-opacity-5 transition-colors border border-white border-opacity-5" data-animation-on-scroll="">
              <div className="text-2xl font-bold text-white mb-2" data-pixel-id="bumxo" data-pixel-kind="text">React 19</div>
              <p className="text-xs text-text-secondary font-mono" data-pixel-id="hlqtk" data-pixel-kind="text">Modern UI Library</p>
            </div>
            <div className="glass-card p-8 rounded-2xl text-center hover:bg-white hover:bg-opacity-5 transition-colors border border-white border-opacity-5" data-animation-on-scroll="">
              <div className="text-2xl font-bold text-white mb-2" data-pixel-id="76acn" data-pixel-kind="text">MySQL 8</div>
              <p className="text-xs text-text-secondary font-mono" data-pixel-id="utkhh" data-pixel-kind="text">Reliable Data Store</p>
            </div>
            <div className="glass-card p-8 rounded-2xl text-center hover:bg-white hover:bg-opacity-5 transition-colors border border-white border-opacity-5" data-animation-on-scroll="">
              <div className="text-2xl font-bold text-white mb-2" data-pixel-id="38cx9" data-pixel-kind="text">Tailwind 4</div>
              <p className="text-xs text-text-secondary font-mono" data-pixel-id="klgrn" data-pixel-kind="text">Modern Styling</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-primary opacity-[0.02] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10" data-animation-on-scroll="">
          <h2 className="font-heading text-5xl md:text-6xl font-bold text-white mb-8 leading-tight" data-pixel-id="nof37" data-pixel-kind="text">Start managing your <br /> wealth with precision.</h2>
          <p className="text-text-secondary text-lg mb-12 max-w-2xl mx-auto" data-pixel-id="ex2cv" data-pixel-kind="text">
            FondTracker is completely open-source. Clone the repository, deploy your own instance, or use our community version.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6" data-pixel-id="7ok55" data-pixel-kind="text">
            <a href="/register" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto px-12 py-5 bg-brand-primary text-black font-bold text-xl rounded-2xl shadow-neon hover:shadow-neon-hover transition-all" data-pixel-id="1qbek" data-pixel-kind="link">
              Launch Your Dashboard
            </a>
            <a href="mailto:rubenblascoarmengod@gmail.com" className="w-full md:w-auto px-12 py-5 border border-border-terminal text-text-primary font-semibold text-lg rounded-2xl hover:bg-neutral-surface transition-all" data-pixel-id="54b7a" data-pixel-kind="link">
              Contact Developer
            </a>
          </div>
          <p className="mt-8 text-xs text-text-light font-mono" data-pixel-id="xao2w" data-pixel-kind="text">No subscription required. Open source under MIT license.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-background border-t border-border-terminal py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-primary rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <span className="font-heading text-lg font-bold text-white" data-pixel-id="k1brm" data-pixel-kind="text">FondTracker</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed" data-pixel-id="h4xdr" data-pixel-kind="text">
                Open-source investment fund tracking platform. Secure, accurate, and completely free for personal use.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-light mb-6" data-pixel-id="yuyts" data-pixel-kind="text">Product</h4>
              <ul className="space-y-4">
                <li data-pixel-id="kais2" data-pixel-kind="text"><a href="#features" className="text-sm text-text-secondary hover:text-brand-primary transition-colors" data-pixel-id="kd50w" data-pixel-kind="link">Features</a></li>
                <li data-pixel-id="1trhu" data-pixel-kind="text"><a href="#" className="text-sm text-text-secondary hover:text-brand-primary transition-colors" data-pixel-id="r8p0x" data-pixel-kind="link">API Reference</a></li>
                <li data-pixel-id="29ppk" data-pixel-kind="text"><a href="#" className="text-sm text-text-secondary hover:text-brand-primary transition-colors" data-pixel-id="f5iw8" data-pixel-kind="link">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-light mb-6" data-pixel-id="vpoyi" data-pixel-kind="text">Legal</h4>
              <ul className="space-y-4">
                <li data-pixel-id="leg1" data-pixel-kind="text"><a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-brand-primary transition-colors" data-pixel-id="leg1-link" data-pixel-kind="link">Privacy Policy</a></li>
                <li data-pixel-id="leg2" data-pixel-kind="text"><a href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-brand-primary transition-colors" data-pixel-id="leg2-link" data-pixel-kind="link">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-light mb-6" data-pixel-id="szdr4" data-pixel-kind="text">Contactar</h4>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-white" data-pixel-id="name" data-pixel-kind="text">Rubén Blasco Armengod</p>
                <ul className="space-y-3 mt-3">
                  <li data-pixel-id="mail-li" data-pixel-kind="text">
                    <a href="mailto:rubenblascoarmengod@gmail.com" className="text-sm text-text-secondary hover:text-brand-primary transition-colors flex items-center gap-2 group" data-pixel-id="mail-link" data-pixel-kind="link">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                      rubenblascoarmengod@gmail.com
                    </a>
                  </li>
                  <li data-pixel-id="git-li" data-pixel-kind="text">
                    <a href="https://github.com/rubenblascoa" className="text-sm text-text-secondary hover:text-brand-primary transition-colors flex items-center gap-2 group" data-pixel-id="git-link" data-pixel-kind="link" target="_blank" rel="noopener noreferrer">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.372.79 1.102.79 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <script>
        {`
          document.addEventListener('DOMContentLoaded', () => {
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenuBtn && mobileMenu) {
              mobileMenuBtn.addEventListener('click', () => {
                mobileMenuBtn.classList.toggle('hamburger-open');
                mobileMenu.classList.toggle('mobile-menu-hidden');
                mobileMenu.classList.toggle('mobile-menu-visible');
              });
            }
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
              anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                if (!targetId) return;
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                if (mobileMenu && mobileMenu.classList.contains('mobile-menu-visible')) {
                  mobileMenuBtn?.classList.remove('hamburger-open');
                  mobileMenu.classList.add('mobile-menu-hidden');
                  mobileMenu.classList.remove('mobile-menu-visible');
                }
              });
            });
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('animate-on-scroll-visible');
                  observer.unobserve(entry.target);
                }
              });
            }, { threshold: 0.1 });
            document.querySelectorAll('[data-animation-on-scroll]').forEach(el => {
              el.classList.add('animate-on-scroll-hidden');
              observer.observe(el);
            });
          });
        `}
      </script>
    </>
  );
}
