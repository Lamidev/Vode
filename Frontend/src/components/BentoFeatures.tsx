"use client";

import React from "react";
import { CheckCircle2, Mic, Camera } from "lucide-react";

export default function BentoFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80">
      {/* Section Title - [CAPABILITIES] removed as requested */}
      <div className="max-w-2xl mb-14 sm:mb-18">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] leading-[1.06]">
          Everything you need. Inside one conversation.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[#525B6C] font-normal leading-relaxed">
          Eliminate the friction of switching across four bloated banking apps. Vode connects you directly to regulated financial rails through a native chat flow.
        </p>
      </div>

      {/* 4-Box Asymmetric Bento Grid - Refined Sophisticated Palette */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        {/* Box 1: Dedicated 10-Digit NUBAN (Span 7) */}
        <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                ACCOUNT INFRASTRUCTURE
              </span>
              <span className="text-xs font-mono text-[#525B6C]">01 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              Your Permanent 10-Digit NUBAN
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] max-w-md leading-relaxed">
              Upon onboarding, receive a dedicated 10-digit Nigerian bank account in your name. Anyone can transfer funds to it from any commercial bank app, and your WhatsApp wallet is credited immediately.
            </p>
          </div>

          {/* Account Plaque Mockup */}
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#525B6C]">
              <span className="font-semibold text-[#090D16]">
                Providus / Wema Partner Rail
              </span>
              <span className="font-mono text-[11px] font-semibold text-[#090D16]">NUBAN: 904 128 3910</span>
            </div>
            <div className="text-lg sm:text-xl font-display font-extrabold text-[#090D16] tracking-tight">
              ADEBAYO TUNDE JOHNSON
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-[#525B6C]">
              <span className="flex items-center gap-1.5 text-[#090D16] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D084]" />
                Auto-swept to Vode Wallet
              </span>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 border border-slate-200 rounded">
                TIER-1 CBN COMPLIANT
              </span>
            </div>
          </div>
        </div>

        {/* Box 2: Multimodal Speak & Snap (Span 5) */}
        <div className="md:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                MULTIMODAL INTELLIGENCE
              </span>
              <span className="text-xs font-mono text-[#525B6C]">02 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              Speak to Pay & Snap & Pay
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
              Don’t feel like typing? Send a 4-second voice note or forward a photo of any paper invoice, POS receipt, or bank screenshot. Vode parses details instantly.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs text-[#090D16]">
              <div className="flex items-center gap-2 font-medium">
                <Mic className="w-4 h-4 text-[#090D16]" />
                <span>"Send 15k to Chioma for groceries"</span>
              </div>
              <span className="font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-bold">
                0:04
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs text-[#090D16]">
              <div className="flex items-center gap-2 font-medium">
                <Camera className="w-4 h-4 text-[#090D16]" />
                <span>Invoice / Receipt OCR Scan</span>
              </div>
              <span className="font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-bold text-[#059669]">
                DETECTED
              </span>
            </div>
          </div>
        </div>

        {/* Box 3: Instant Bank Transfers (Span 5) */}
        <div className="md:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                NIP DISBURSEMENT
              </span>
              <span className="text-xs font-mono text-[#525B6C]">03 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              Instant Bank Transfers
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
              Send money to GTBank, Access, Zenith, OPay, Palmpay, and over 60+ institutions with sub-second verified recipient lookups.
            </p>
          </div>

          <div className="mt-6 p-4 bg-[#090D16] text-white rounded-xl border border-black text-xs space-y-2">
            <div className="flex justify-between items-center text-[#00D084] font-mono text-[10px]">
              <span>RESOLVED VIA NIBSS RAILS</span>
              <span>&lt; 3 SECONDS</span>
            </div>
            <p className="font-medium text-xs text-white/90">
              Recipient name is confirmed before funds are debited. Zero blind retries, zero double charges.
            </p>
          </div>
        </div>

        {/* Box 4: Airtime & Telco Data Bundles (Span 7) */}
        <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                TELCO & UTILITIES
              </span>
              <span className="text-xs font-mono text-[#525B6C]">04 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              Airtime, SME Data & Power Tokens
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] max-w-md leading-relaxed">
              Top up your line, gift SME data bundles (1GB, 5GB, 10GB), or pay IKEDC, EKEDC, and DSTV without visiting third-party web portals.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
            {["MTN", "Airtel", "Glo", "9mobile", "DSTV", "IKEDC", "EKEDC"].map((provider) => (
              <span
                key={provider}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-medium text-[#090D16] rounded-md hover:border-[#090D16] transition-colors"
              >
                {provider}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
