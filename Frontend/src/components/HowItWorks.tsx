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
    title: 'Click "Try on WhatsApp"',
    desc: "Tap any button on this page to open our official verified chat on WhatsApp.",
    offsetClass: "md:translate-y-24",
  },
  {
    step: "Step 02",
    title: 'Say "Hi"',
    desc: "Send a quick hello, and Vode opens your private 60-second registration sheet.",
    offsetClass: "md:translate-y-16",
  },
  {
    step: "Step 03",
    title: "Create Your 4-Digit PIN",
    desc: "Set your confidential 4-digit PIN in our secure form to keep your money safe.",
    offsetClass: "md:translate-y-8",
  },
  {
    step: "Step 04",
    title: "You're Ready to Go!",
    desc: "Receive your 10-digit account number immediately. Top it up, send money, and pay bills.",
    offsetClass: "md:translate-y-0",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80">
      {/* Top Header Row */}
      <div className="space-y-4 mb-16 sm:mb-20">
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#525B6C]">
          [EASY 4-STEP SETUP]
        </span>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] max-w-xl leading-[1.06]">
            Up and running in under two minutes.
          </h2>
          <p className="text-sm sm:text-base text-[#525B6C] max-w-md font-normal leading-relaxed">
            No paperwork, no branch visits, and zero app downloads. Setting up your Vode account is as simple as sending a chat message.
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
