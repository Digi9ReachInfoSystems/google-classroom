import Image from "next/image";
import React from "react";

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Why UPSHIFT", href: "#why" },
  { label: "Features", href: "#features" },
  { label: "Reliability", href: "#reliability" },
  { label: "Pilot", href: "#pilot" },
  { label: "FAQ", href: "#faq" },
  { label: "About Us", href: "#about" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookies settings", href: "#" },
];

const Footer: React.FC = () => {
  return (
    <footer className="w-full">
      {/* Top blue panel */}
      <div className="bg-[var(--blue-600)] text-white rounded-t-[48px] pt-16 pb-10">
        <div className="max-w-6xl mx-auto px-6">
          {/* Heading & CTA */}
          <div className="text-center">
            <h3 className="text-[36px] md:text-[40px] font-semibold leading-tight">
              Get in Touch
            </h3>
            <p className="mt-2 text-white/90">
              For demo requests, pricing, or more details, reach us at:
            </p>
            <a
              href="/login"
              className="inline-flex mt-6 px-6 py-3 rounded-3xl font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)] transition"
            >
              Get Started
            </a>
          </div>

          {/* Social + Nav (same row on desktop) */}
          <div className="mt-10">
            <div className="flex flex-col gap-6 md:grid md:grid-cols-12 md:items-center">
              {/* Social left */}
              <div className="md:col-span-4">
                <div className="flex items-center gap-6 md:justify-start justify-center">
                  {/* Minimal inline icons */}
                  <a aria-label="Facebook" href="#" className="opacity-90 hover:opacity-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 5.02 3.66 9.19 8.44 9.93v-7.02H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.45h-1.25c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.74 8.44-4.91 8.44-9.93z"/>
                    </svg>
                  </a>
                  <a aria-label="Instagram" href="#" className="opacity-90 hover:opacity-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                    </svg>
                  </a>
                  <a aria-label="YouTube" href="#" className="opacity-90 hover:opacity-100">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.5 6.2s-.23-1.65-.95-2.37c-.91-.95-1.93-.96-2.4-1.01C16.41 2.5 12 2.5 12 2.5h-.01s-4.41 0-8.14.32c-.47.05-1.49.06-2.4 1.01C.73 4.55.5 6.2.5 6.2S.25 8.2.25 10.19v1.61C.25 13.8.5 15.8.5 15.8s.23 1.65.95 2.37c.91.95 2.1.92 2.64 1.02C6.41 19.5 12 19.5 12 19.5s4.41 0 8.14-.32c.47-.05 1.49-.06 2.4-1.01.72-.72.95-2.37.95-2.37s.25-2 .25-3.99v-1.61c0-1.99-.25-3.99-.25-3.99zM9.75 14.5v-6l6 3-6 3z"/>
                    </svg>
                  </a>
                  <a aria-label="Twitter" href="#" className="opacity-90 hover:opacity-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.3 1.7-2.2-.8.5-1.7.9-2.6 1.1a4 4 0 0 0-6.9 3.6A11.4 11.4 0 0 1 3 4.9a4 4 0 0 0 1.2 5.4c-.6 0-1.2-.2-1.7-.5v.1a4 4 0 0 0 3.2 3.9c-.5.1-1 .2-1.5.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.3a11.3 11.3 0 0 0 6.2 1.8c7.5 0 11.7-6.2 11.7-11.7v-.5c.8-.6 1.4-1.3 1.9-2.1z"/>
                    </svg>
                  </a>
                  <a aria-label="LinkedIn" href="#" className="opacity-90 hover:opacity-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0V8.98zM8.98 8.98h4.78v2.05h.07c.67-1.27 2.32-2.6 4.77-2.6 5.1 0 6.04 3.36 6.04 7.73V24h-5v-6.67c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.73-2.56 3.52V24h-5V8.98z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Nav centered */}
              <nav className="md:col-span-8">
                <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 justify-center text-white/90">
                  {navLinks.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="hover:text-white">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Divider */}
          <hr className="mt-8 border-white/40" />

          {/* Bottom row */}
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-white/80">
            <p>© 2025 UPSHIFT. All rights reserved.</p>
            <nav className="flex items-center gap-6">
              {policyLinks.map((p) => (
                <a key={p.label} href={p.href} className="hover:text-white">
                  {p.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Logo strip */}
      <div className="bg-[var(--neutral-100)] py-8">
  <div className="max-w-6xl mx-auto px-6 flex justify-center">
    <Image
      src="/upshiftlogo.png"
      alt="UPSHIFT Bhutan"
      width={269}
      height={264}
      className="w-[269px] h-[264px]"
    />
  </div>
</div>

    </footer>
  );
};

export default Footer;
