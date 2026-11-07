"use client";

import React from "react";
import { CheckCircle2, Mic, Camera } from "lucide-react";

export default function BentoFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80">
      {/* Section Title */}
      <div className="max-w-2xl mb-14 sm:mb-18">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] leading-[1.06]">
          Everything you need. Inside one conversation.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[#525B6C] font-normal leading-relaxed">
          Say goodbye to slow, bloated banking apps that freeze when you need them. Vode gives you instant, stress-free money transfers directly in your WhatsApp.
        </p>
      </div>

      {/* 4-Box Asymmetric Bento Grid - Refined Sophisticated Palette */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        {/* Box 1: An Account Number in Your Name (Span 7) */}
        <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                RECEIVE MONEY
              </span>
              <span className="text-xs font-mono text-[#525B6C]">01 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              An Account Number in Your Name
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] max-w-md leading-relaxed">
              Get a dedicated 10-digit Nigerian bank account created in your legal name in under 60 seconds. Anyone can transfer money to it from any banking app, and your WhatsApp balance is credited immediately.
            </p>
          </div>

          {/* Account Plaque Mockup (Strict single straight line on mobile) */}
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-[#525B6C]">
              <span className="font-semibold text-[#090D16]">
                Personal Bank Account
              </span>
              <span className="inline-flex items-center font-mono text-[10px] sm:text-[11px] font-bold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>

            {/* Single straight line account number on all devices */}
            <div className="overflow-x-auto py-1">
              <p className="font-mono font-extrabold text-2xl sm:text-3xl text-[#090D16] tracking-wider whitespace-nowrap">
                904 128 3910
              </p>
            </div>

            <div className="text-xs sm:text-sm font-display font-bold text-[#525B6C] tracking-tight uppercase">
              ADEBAYO TUNDE JOHNSON
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#525B6C]">
              <span className="flex items-center gap-1.5 text-[#090D16] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00D084] shrink-0" />
                <span>Receives money from all Nigerian banks</span>
              </span>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 border border-slate-200 rounded w-fit">
                TIER-1 CBN COMPLIANT
              </span>
            </div>
          </div>
        </div>

        {/* Box 2: Voice & Photos (Span 5) */}
        <div className="md:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                VOICE & PHOTOS
              </span>
              <span className="text-xs font-mono text-[#525B6C]">02 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              Speak to Pay & Snap to Pay
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
              Don’t feel like typing account numbers? Send a quick voice note or forward a photo of any invoice, POS receipt, or bank screenshot. Vode detects the bank and amount instantly.
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

        {/* Box 3: Send Money in Seconds (Span 5) */}
        <div className="md:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                SEND MONEY
              </span>
              <span className="text-xs font-mono text-[#525B6C]">03 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              Send Money in Seconds
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
              Transfer funds to GTBank, Access, Zenith, OPay, Moniepoint, and over 60+ banks. Vode confirms the recipient's real name before sending, so you never send money to the wrong person.
            </p>
          </div>

          <div className="mt-6 p-4 bg-[#090D16] text-white rounded-xl border border-black text-xs space-y-2">
            <div className="flex justify-between items-center text-[#00D084] font-mono text-[10px]">
              <span>VERIFIED RECIPIENT CHECK</span>
              <span>&lt; 3 SECONDS</span>
            </div>
            <p className="font-medium text-xs text-white/90">
              Recipient name is confirmed before funds are debited. Zero blind retries, zero double charges.
            </p>
          </div>
        </div>

        {/* Box 4: Airtime & Bills (Span 7) */}
        <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#090D16]/30 transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold tracking-wider uppercase bg-slate-100 border border-slate-200 text-[#090D16] rounded-md">
                BILLS & RECHARGE
              </span>
              <span className="text-xs font-mono text-[#525B6C]">04 / 04</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
              Airtime, Cheap Data & Power Tokens
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#525B6C] max-w-md leading-relaxed">
              Recharge your line, buy discounted SME data bundles (MTN, Airtel, Glo), or pay your electricity and DSTV bills without leaving WhatsApp.
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
