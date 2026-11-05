"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white">
      {/* Pre-Footer Action Banner */}
      <div className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b border-slate-200/80">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] max-w-2xl mx-auto leading-tight">
          Ready to experience everyday money in WhatsApp?
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[#525B6C] max-w-lg mx-auto">
          No app downloads. No waiting in lines. Start with a simple "Hi" right now.
        </p>

        <div className="mt-8 flex justify-center">
          <a
            href="https://wa.me/2347071238658?text=Hi%20Vode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#090D16] hover:bg-[#1A202C] text-white text-sm font-semibold rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md group"
          >
            <span>Try Vode Now</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12">
          {/* Brand Info (Full width on mobile, 6 cols on desktop) */}
          <div className="col-span-2 md:col-span-6 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-7 h-7 relative rounded-md overflow-hidden border border-[#E2E8F0] shadow-2xs">
                <Image
                  src="/logo.png"
                  alt="Vode"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-display font-extrabold text-lg text-[#090D16]">
                vode
              </span>
            </Link>
            <p className="text-xs text-[#525B6C] max-w-sm leading-relaxed">
              Vode is a WhatsApp-first digital financial utility. We make sending, receiving, and managing money as easy as sending a message.
            </p>
            <div className="pt-2">
              <a
                href="mailto:hello@usevode.com"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#090D16] hover:text-[#00D084] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>hello@usevode.com</span>
              </a>
            </div>
          </div>

          {/* Navigation (Left column on mobile, 3 cols on desktop) */}
          <div className="col-span-1 md:col-span-3 space-y-2.5">
            <p className="text-xs font-mono font-semibold uppercase text-[#090D16] tracking-wider">
              Navigation
            </p>
            <ul className="space-y-2 text-xs text-[#525B6C]">
              <li>
                <Link href="/#features" className="hover:text-[#090D16]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#090D16]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#security" className="hover:text-[#090D16]">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#090D16]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Legal (Opposite Navigation on mobile, 3 cols on desktop) */}
          <div className="col-span-1 md:col-span-3 space-y-2.5">
            <p className="text-xs font-mono font-semibold uppercase text-[#090D16] tracking-wider">
              Safety & Legal
            </p>
            <ul className="space-y-2 text-xs text-[#525B6C]">
              <li>
                <Link href="/freeze" className="text-rose-600 font-semibold hover:underline">
                  Emergency Account Freeze
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#090D16] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#090D16] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-[#525B6C]">NDPC Data Certified</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Notice */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#525B6C]">
          <p>© 2026 VODE SYSTEMS AND TECHNOLOGIES LIMITED. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <Link href="/privacy" className="hover:text-[#090D16] underline">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#090D16] underline">
              Terms
            </Link>
            <span>•</span>
            <span>Lagos, Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
