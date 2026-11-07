"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function SecuritySection() {
  const [isLocked, setIsLocked] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const padlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            setTimeout(() => {
              setIsLocked(false);
              setTimeout(() => {
                setIsLocked(true);
              }, 1200);
            }, 600);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (padlockRef.current) {
      observer.observe(padlockRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section id="security" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80">
      {/* Top Header Row */}
      <div className="space-y-4 mb-14 sm:mb-18">
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#525B6C]">
          [BANK-GRADE SAFETY]
        </span>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] max-w-xl leading-[1.06]">
            Your money is safe, insured, and under your control.
          </h2>
          <p className="text-sm sm:text-base text-[#525B6C] max-w-md font-normal leading-relaxed">
            Protected at every step—from one-time private PIN authorization to the licensed banking partners safeguarding your funds.
          </p>
        </div>
      </div>

      {/* 3-Card Crisp Elevated Fintech Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Passcode for every payment */}
        <div className="flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(9,13,22,0.04)] hover:shadow-lg transition-shadow duration-300">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-display font-bold text-[#090D16]">
                Passcode for every payment
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-[#090D16]">
                90s EXPIRY
              </span>
            </div>

            {/* Visual: Phone Screen Mockup */}
            <div className="my-8 flex justify-center">
              <div className="w-48 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                {/* Header bar */}
                <div className="h-6 -mx-4 -mt-4 bg-[#090D16] border-b border-black flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D084]" />
                  <span className="text-[9px] font-mono text-white/80 uppercase">Encrypted Keypad</span>
                </div>

                {/* Masked PIN Asterisks */}
                <div className="py-6 flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-[#090D16] tracking-widest">
                    * * * *
                  </span>
                </div>

                {/* Keypad Row */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-semibold text-[#090D16]">
                  <div className="py-2 bg-white rounded-md shadow-2xs border border-slate-200/80">1</div>
                  <div className="py-2 bg-white rounded-md shadow-2xs border border-slate-200/80">2</div>
                  <div className="py-2 bg-white rounded-md shadow-2xs border border-slate-200/80">3</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Capsule Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-center gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#090D16] text-[#00D084] flex items-center justify-center flex-shrink-0 shadow-xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#090D16] font-medium leading-relaxed">
              Every transaction requires your private PIN. Never exposed in chat history.
            </p>
          </div>
        </div>

        {/* Card 2: NDPC – Certified */}
        <div className="flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(9,13,22,0.04)] hover:shadow-lg transition-shadow duration-300">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-display font-bold text-[#090D16]">
                NDPC – Certified
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-[#059669]">
                VERIFIED
              </span>
            </div>

            {/* Visual: Official NDPC Shield Badge with Nigerian Coat of Arms */}
            <div className="my-8 flex justify-center items-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Concentric Soft Rings */}
                <div className="absolute inset-0 rounded-full bg-emerald-50/60" />
                <div className="absolute inset-4 rounded-full bg-emerald-100/40" />

                {/* Actual Official NDPC Shield Badge */}
                <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(0,102,51,0.22)]">
                  <Image
                    src="/ndpc-badge.png"
                    alt="Official Nigeria Data Protection Commission (NDPC) Certified"
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Capsule Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-center gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#090D16] text-[#00D084] flex items-center justify-center flex-shrink-0 shadow-xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#090D16] font-medium leading-relaxed">
              Vode is certified by the Nigeria Data Protection Commission (NDPC), ensuring customer data safety.
            </p>
          </div>
        </div>

        {/* Card 3: Lock Vode Chat (Animated Sliding Padlock) */}
        <div
          ref={padlockRef}
          className="flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(9,13,22,0.04)] hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          onClick={() => setIsLocked(!isLocked)}
          title="Click to toggle lock state"
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-display font-bold text-[#090D16]">
                Lock Vode Chat
              </h3>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded transition-colors ${
                  isLocked ? "bg-slate-100 text-[#090D16]" : "bg-amber-100 text-amber-800"
                }`}
              >
                {isLocked ? "LOCKED" : "UNLOCKED"}
              </span>
            </div>

            {/* Visual: Animated Obsidian & Emerald Padlock */}
            <div className="my-8 flex justify-center items-center">
              <div
                className={`relative w-44 h-44 flex flex-col items-center justify-center transition-[transform,opacity] duration-700 ease-out transform-gpu ${
                  hasAnimated ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"
                }`}
              >
                {/* Shackle */}
                <div
                  className={`w-20 h-20 border-[8px] border-[#090D16] rounded-t-full transition-transform duration-500 ease-in-out ${
                    isLocked
                      ? "translate-y-4"
                      : "-translate-y-1 rotate-[-15deg] origin-bottom-left"
                  }`}
                />

                {/* Padlock Body */}
                <div className="relative w-32 h-26 bg-gradient-to-br from-[#090D16] to-[#1E293B] rounded-2xl shadow-[0_12px_24px_rgba(9,13,22,0.3)] flex items-center justify-center overflow-hidden border border-slate-700">
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(0,208,132,0.15)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />

                  {/* Keyhole with Mint Accent */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#00D084] shadow-xs" />
                    <div className="w-2.5 h-4 bg-[#00D084] -mt-1 shadow-xs rounded-b-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Capsule Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-center gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#090D16] text-[#00D084] flex items-center justify-center flex-shrink-0 shadow-xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#090D16] font-medium leading-relaxed">
              Keep your financial chats inside WhatsApp’s native locked folder, shielded by your biometrics.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
