"use client";
import Image from "next/image";
import React from "react";

type NavItem = { label: string; target: string };

const nav: NavItem[] = [
  { label: "Home",        target: "home" },
  { label: "Why UPSHIFT", target: "why" },
  { label: "Features",    target: "features" },
  { label: "Reliability", target: "reliability" },
  { label: "Pilot",       target: "pilot" },
  { label: "FAQ",         target: "faq" },
  { label: "About Us",    target: "about" },
];

const NAV_HEIGHT = 72; // keep in sync with header height

const Header: React.FC = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
 <header
  className="
    fixed top-0 left-0 right-0 z-50
    border-b border-white/10
    backdrop-blur-xl backdrop-saturate-150
    supports-[backdrop-filter]:bg-black/10
    bg-black/20
  "
>

      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-[72px] items-center justify-between gap-4">
          {/* LEFT: 4 logos (48x51) */}
          <div className="flex items-center gap-3">
          <Image 
  src="/upshiftlogo.png" 
  alt="UPSHIFT" 
  width={48} 
  height={51} 
  className="w-[48px] h-[51px] object-contain" 
/>

<Image 
  src="/moesd.png" 
  alt="MoESD" 
  width={48} 
  height={51} 
  className="w-[48px] h-[51px] object-contain" 
/>

<Image 
  src="/ydflogo.png" 
  alt="YDF" 
  width={48} 
  height={51} 
  className="w-[48px] h-[51px] object-contain" 
/>

<Image 
  src="/uniceflogo.png" 
  alt="UNICEF" 
  width={48} 
  height={51} 
  className="w-[48px] h-[51px] object-contain" 
/>
 </div>

          {/* CENTER: nav (14px, weight 400) */}
          <nav className="hidden md:flex items-center gap-8 text-white/90">
            {nav.map((item) => (
              <a
                key={item.target}
                href={`#${item.target}`}
                onClick={(e) => handleClick(e, item.target)}
                className="text-[14px]
              
                 font-normal transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* RIGHT: Login */}
         <div className="flex items-center">
  <a
    href="/login"
    className="inline-flex items-center justify-center px-5 py-2.5 rounded-md
               text-[14px] font-normal
               bg-[var(--warning-400)] text-white "
  >
    Login
  </a>
</div>

        </div>
      </div>
    </header>
  );
};

export default Header;
