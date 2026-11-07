"use client";

import React from "react";
import Link from "next/link";
import BankTicker from "./BankTicker";

export default function EmergencyFreezeBanner() {
  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Vode Instant Block Card */}
      <div className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-16 shadow-[0_20px_50px_-20px_rgba(9,13,22,0.08)] bg-vode-grid">
        {/* Ambient Top Glow & Concentric Vault Rings */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#00D084]/22 via-[#1E40AF]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full border border-[#00D084]/25 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-dashed border-[#090D16]/12 pointer-events-none" />

        {/* Center Content Column */}
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#525B6C]">
            [EMERGENCY PROTECTION]
          </span>

          {/* Display Headline */}
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-[#090D16] leading-[1.12]">
            Lost Your Phone? Lock Your Vode Instantly.
          </h3>

          {/* Subtext */}
          <p className="text-xs sm:text-sm md:text-base text-[#525B6C] leading-relaxed max-w-xl mx-auto font-normal">
            If your phone is ever lost or stolen, freeze your Vode account with one click from any web browser on any device. Nobody will be able to spend a single kobo until you unlock it.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/freeze"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#090D16] hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold rounded-md shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Block Account Now
            </Link>

            <Link
              href="/freeze"
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-[#090D16] text-xs sm:text-sm font-semibold rounded-md border border-slate-300 shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Unblock Account
            </Link>
          </div>
        </div>

        {/* Real Partner Banks with Exact Official Logos Marquee */}
        <div className="relative z-10 mt-14 sm:mt-18 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs font-semibold text-[#525B6C] mb-3 tracking-wide">
            Settling Across All Regulated Nigerian Commercial Banks & FinTechs
          </p>
          <BankTicker />
        </div>
      </div>
    </section>
  );
}
