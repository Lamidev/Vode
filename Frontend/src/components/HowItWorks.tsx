"use client";

import React from "react";

interface Step {
  step: string;
  title: string;
  desc: string;
  offsetClass: string;
}

const STEPS: Step[] = [
  {
    step: "Step 01",
    title: 'Click “Try Vode Now”',
    desc: "This connects you directly to Vode’s official verified chat on WhatsApp",
    offsetClass: "md:translate-y-24",
  },
  {
    step: "Step 02",
    title: 'Send “Hi Vode”',
    desc: "Message Vode and open the instant 60-second onboarding sheet",
    offsetClass: "md:translate-y-16",
  },
  {
    step: "Step 03",
    title: "Verify & set PIN",
    desc: "Confirm your identity and set your private 4-digit transaction PIN",
    offsetClass: "md:translate-y-8",
  },
  {
    step: "Step 04",
    title: "Start banking",
    desc: "Receive your permanent NUBAN, send transfers, and pay utility bills",
    offsetClass: "md:translate-y-0",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80">
      {/* Top Header Row */}
      <div className="space-y-4 mb-16 sm:mb-20">
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#525B6C]">
          [ONBOARDING]
        </span>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] max-w-xl leading-[1.06]">
            Up and running in under Two minutes.
          </h2>
          <p className="text-sm sm:text-base text-[#525B6C] max-w-md font-normal leading-relaxed">
            Most banking apps require lengthy paperwork and downloads. Vode accepts however you communicate—voice notes, receipts, or simple text.
          </p>
        </div>
      </div>

      {/* 4-Step Descending Staircase Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
        {STEPS.map((item, index) => (
          <div
            key={item.step}
            className={`relative flex flex-col justify-between ${item.offsetClass} transition-transform duration-500`}
          >
            {/* Step Card Content */}
            <div className="space-y-3 pb-8">
              {/* Header row with Title and Step Pill */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16] leading-snug">
                  {item.title}
                </h3>
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[#090D16] text-[11px] font-mono font-semibold">
                  {item.step}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                {item.desc}
              </p>
            </div>

            {/* Vertical Accent Stagger Line (Vode Mint to Obsidian Gradient) */}
            <div
              className="hidden md:block w-px bg-gradient-to-b from-[#00D084] via-[#090D16]/40 to-transparent self-end mr-2"
              style={{ height: `${(index + 1) * 44 + 40}px` }}
            />

            {/* Mobile divider */}
            <div className="block md:hidden w-12 h-0.5 bg-[#00D084]/40" />
          </div>
        ))}
      </div>
    </section>
  );
}
