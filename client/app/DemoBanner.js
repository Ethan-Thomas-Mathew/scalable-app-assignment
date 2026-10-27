"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Shown only in the GitHub Pages demo build.
export default function DemoBanner() {
  // Open on the landing, login and register pages; collapsed to a small chip elsewhere so it never covers the market.
  const path = usePathname() || '/';
  const showByDefault = /^\/(login|register)?\/?$/.test(path);
  const [open, setOpen] = useState(showByDefault);
  useEffect(() => { setOpen(showByDefault); }, [showByDefault]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-[200] rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black shadow-lg"
      >
        DEMO
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 left-3 z-[200] max-w-[17rem] rounded-2xl border border-white/20 bg-black/80 p-4 text-xs leading-relaxed text-white shadow-2xl backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-black uppercase tracking-widest text-yellow-400">Demo mode</span>
        <button onClick={() => setOpen(false)} aria-label="Hide demo notice" className="text-lg leading-none text-gray-400 hover:text-white">×</button>
      </div>
      <p>Sample market data. Everything you do is saved only in this browser. No real payments.</p>
      <p className="mt-2">
        Sign in with <b>demo@cryptox.dev</b> / <b>demo1234</b>, or register. Please don&apos;t enter a real password.
      </p>
      <a
        href="https://github.com/Ethan-Thomas-Mathew/scalable-app-assignment"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block font-bold text-yellow-400 underline"
      >
        View the source
      </a>
    </div>
  );
}
