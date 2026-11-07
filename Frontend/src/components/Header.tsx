"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 w-full max-w-6xl mx-auto transform-gpu">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl shadow-[0_4px_20px_-4px_rgba(9,13,22,0.06)] transition-colors">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E2E8F0] shadow-2xs shrink-0 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Vode"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-[#090D16]">
            vode
          </span>
        </Link>

        {/* Center Nav - Anchor Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/#security"
            className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
          >
            Security
          </Link>
          <Link
            href="/#faq"
            className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
          >
            FAQ
          </Link>
        </nav>

        {/* Right Action CTA (Desktop) */}
        <div className="hidden sm:flex items-center">
          <a
            href="https://wa.me/2347071238658?text=Hi%20Vode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#090D16] hover:bg-[#1A202C] text-white text-xs font-semibold rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-xs group"
          >
            <span>Try Vode on WhatsApp</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white opacity-90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-[#090D16] hover:bg-slate-100 rounded-md"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-xl space-y-4">
          <nav className="flex flex-col gap-3">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
            >
              How it works
            </Link>
            <Link
              href="/#security"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
            >
              Security
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
            >
              FAQ
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#525B6C] py-1 border-b border-slate-100"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#525B6C] py-1 border-b border-slate-100"
            >
              Terms of Service
            </Link>
          </nav>

          <a
            href="https://wa.me/2347071238658?text=Hi%20Vode"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#090D16] text-white text-xs font-semibold rounded-md shadow-xs"
          >
            <span>Try Vode on WhatsApp</span>
            <ArrowUpRight className="w-4 h-4 text-white" />
          </a>
        </div>
      )}
    </header>
  );
}
