import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "#hero",       label: "About" },
  { href: "#how",        label: "How it works" },
  { href: "#demo",       label: "Live demo" },
  { href: "#results",    label: "Results" },
  { href: "#features",   label: "Features" },
  { href: "#use-cases",  label: "Use cases" },
  { href: "#limitation", label: "Limitations" },
  { href: "#roadmap",    label: "Roadmap" },
  { href: "#me",         label: "Me" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#hero");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on scroll (mobile UX)
  useEffect(() => {
    const handler = () => setOpen(false);
    if (open) window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [open]);

  return (
    <header className="w-full h-[60px] fixed top-0 z-50 flex items-center justify-between px-5
      bg-[#05080F]/70 backdrop-blur-xl border-b border-white/[0.06]">

      {/* Logo */}
      <a href="#hero" className="flex items-center gap-2 no-underline group">
        <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-blue-700 to-blue-500
          flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 stroke-white fill-none stroke-2" viewBox="0 0 16 16"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8h3M11 8h3M8 2v3M8 11v3"/>
            <circle cx="8" cy="8" r="2"/>
          </svg>
        </div>
        <span className="text-[15px] font-bold text-slate-100 tracking-tight">
          Supply<span className="text-blue-400">Pilot</span>
        </span>
      </a>

      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center gap-0.5">
        {links.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            onClick={() => setActive(href)}
            className={`text-[13px] px-[11px] py-[5px] rounded-md transition-all duration-150
              ${active === href
                ? "text-white bg-white/[0.08]"
                : "text-white/50 hover:text-white/90 hover:bg-white/[0.06]"
              }`}
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Desktop right */}
      <div className="hidden lg:flex items-center gap-2.5">
        <span className="font-mono text-[10px] tracking-[.05em] text-white/35
          flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400
            shadow-[0_0_0_2px_rgba(52,211,153,.2)]" />
          v0.9 beta
        </span>
        <div className="w-px h-4 bg-white/10" />
        <a href="#demo"
          className="text-[12px] font-medium text-white px-3.5 py-1.5 rounded-[7px]
          bg-blue-700/80 border border-blue-500/40
          hover:bg-blue-700 transition-colors duration-150">
          Try the demo
        </a>
      </div>

      {/* Mobile right */}
      <div className="flex lg:hidden items-center gap-2" ref={menuRef}>
        <a href="#demo"
          className="text-[11px] font-medium text-white px-3 py-1.5 rounded-[7px]
          bg-blue-700/80 border border-blue-500/40">
          Try demo
        </a>
        <button
          onClick={() => setOpen(p => !p)}
          aria-label="Toggle menu"
          className="w-[34px] h-[34px] flex items-center justify-center rounded-[7px]
          bg-white/[0.05] border border-white/10 text-white/70
          hover:text-white hover:bg-white/10 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>

        {/* Mobile drawer */}
        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute top-[64px] right-4 w-52 rounded-xl
                bg-[#080D1A]/95 border border-white/[0.08] backdrop-blur-xl
                py-2 flex flex-col shadow-xl shadow-black/40"
            >
              {links.map(({ href, label }, i) => (
                <div key={href}>
                  {i === 7 && (
                    <div className="h-px bg-white/[0.06] my-1.5 mx-3" />
                  )}
                  <a
                    href={href}
                    onClick={() => { setActive(href); setOpen(false); }}
                    className={`block text-[14px] px-4 py-2.5 transition-colors duration-100
                      ${active === href
                        ? "text-white bg-white/[0.07]"
                        : "text-white/50 hover:text-white/90 hover:bg-white/[0.05]"
                      }`}
                  >
                    {label}
                  </a>
                </div>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

    </header>
  );
};

export default memo(Header);