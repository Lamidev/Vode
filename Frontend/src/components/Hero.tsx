"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  HardDrive,
  Copy,
  Check,
  Lock,
  Mic,
  Camera,
  ShieldCheck,
} from "lucide-react";

interface AnchorCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  bgClass: string;
  textColor: string;
  tabBg: string;
  tabText: string;
  graphic: React.ReactNode;
}

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.15 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("0123456789");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CARDS: AnchorCard[] = [
    // Card 1: No App to Download (Anchor Style - Soft Sage)
    {
      id: "card-1",
      badge: "0.0 MB",
      title: "No App to Download",
      description:
        "Traditional bank apps eat up 400MB+ of phone memory. Vode works 100% inside the WhatsApp you already have.",
      bgClass: "bg-[#E6F0EA]",
      textColor: "text-[#1B3828]",
      tabBg: "bg-[#183525]",
      tabText: "text-white",
      graphic: (
        <div className="w-full flex flex-col items-center justify-center py-4">
          <div className="w-20 h-20 rounded-2xl bg-white/80 border border-[#183525]/10 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
            <HardDrive className="w-7 h-7 text-[#183525] mb-1" />
            <span className="font-mono text-xs font-bold text-[#183525]">0.0 MB</span>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-[#183525]" />
          </div>
          <p className="mt-2.5 text-[11px] font-mono text-[#1B3828]/70">No downloads needed</p>
        </div>
      ),
    },

    // Card 2: Your Own Account Number (Anchor Style - Deep Navy Obsidian)
    {
      id: "card-2",
      badge: "ACTIVE",
      title: "Your Own Account Number",
      description:
        "Get a real 10-digit Nigerian bank account in your name. Anyone from GTBank, OPay, or Zenith can send you money.",
      bgClass: "bg-[#1E2536]",
      textColor: "text-white",
      tabBg: "bg-[#E6F0EA]",
      tabText: "text-[#183525]",
      graphic: (
        <div className="w-full flex flex-col items-center justify-center py-4">
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-left shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono uppercase text-white/70">Personal Bank Account</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D084]" />
            </div>
            <p className="font-mono font-bold text-sm text-white tracking-wider whitespace-nowrap">0123 456 789</p>
            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-white/70">
              <span>All Nigerian Banks</span>
              <button
                onClick={handleCopy}
                type="button"
                className="hover:text-white transition-colors"
                title="Copy account"
              >
                {copied ? <Check className="w-3 h-3 text-[#00D084]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      ),
    },

    // Card 3: Safe 4-Digit PIN (Anchor Style - Warm Cream Sand)
    {
      id: "card-3",
      badge: "PRIVATE PIN",
      title: "Safe 4-Digit PIN",
      description:
        "Your money is locked with your private PIN. You never type it in open chat, so nobody can ever see it.",
      bgClass: "bg-[#F5ECE1]",
      textColor: "text-[#382C1E]",
      tabBg: "bg-[#382C1E]",
      tabText: "text-white",
      graphic: (
        <div className="w-full flex flex-col items-center justify-center py-4">
          <div className="w-20 h-20 rounded-2xl bg-white/80 border border-[#382C1E]/10 flex flex-col items-center justify-center shadow-sm">
            <Lock className="w-6 h-6 text-[#382C1E] mb-1.5" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#382C1E]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#382C1E]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#382C1E]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#382C1E]" />
            </div>
          </div>
          <p className="mt-2.5 text-[11px] font-mono text-[#382C1E]/70">Masked keypad sheet</p>
        </div>
      ),
    },

    // Card 4: Pay by Voice or Photo (Anchor Style - Warm Terracotta)
    {
      id: "card-4",
      badge: "VOICE & PHOTO",
      title: "Pay by Voice or Photo",
      description:
        "Too tired to type? Send a voice note like 'Send 5k to Mummy' or snap a photo of any bill. Vode handles the rest.",
      bgClass: "bg-[#D96B27]",
      textColor: "text-white",
      tabBg: "bg-[#1E2536]",
      tabText: "text-white",
      graphic: (
        <div className="w-full flex flex-col items-center justify-center py-4">
          <div className="w-full bg-white/15 backdrop-blur-md border border-white/25 rounded-xl p-3 text-left shadow-md space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-white">
              <Mic className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">"Send 5k to Tunde"</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80 pt-1 border-t border-white/10">
              <Camera className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">Receipt detected</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="top" className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto overflow-hidden">
      {/* Ambient Hero Gradient Canopy & Precision Pattern */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[650px] pointer-events-none z-0 overflow-hidden"
        style={{
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 25%, black 45%, transparent 95%)",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 25%, black 45%, transparent 95%)",
        }}
      >
        {/* Soft Multi-stop Radial Glow (Vode Mint + Electric Cobalt) */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[720px] sm:w-[920px] h-[400px] bg-gradient-to-b from-[#00D084]/25 via-[#00D084]/10 to-transparent blur-3xl" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[520px] h-[300px] bg-gradient-to-tr from-[#1E40AF]/14 via-[#00D084]/12 to-transparent blur-2xl" />

        {/* Crisp Vector Grid Pattern with Mint Dots */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(9, 13, 22, 0.08)" strokeWidth="1" />
              <circle cx="40" cy="40" r="1.5" fill="rgba(0, 208, 132, 0.35)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Concentric Financial Vault Rings */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full border border-[#00D084]/25" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[760px] h-[760px] rounded-full border border-dashed border-[#090D16]/12" />
      </div>

      {/* Clean Unboxed Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
        {/* Bracket Notation Eyebrow */}
        <div className="flex items-center justify-center">
          <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#525B6C]">
            [YOUR BANK ACCOUNT INSIDE WHATSAPP]
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-display font-extrabold tracking-tight leading-[1.06] text-[#090D16]">
          Send, receive, and spend money. <br className="hidden sm:inline" />
          Right inside WhatsApp.
        </h1>

        {/* Subhead */}
        <p className="text-base sm:text-lg md:text-xl text-[#525B6C] max-w-2xl mx-auto font-normal leading-relaxed">
          Get your own 10-digit Nigerian bank account in 60 seconds. Send money with a voice note, pay bills by sending a photo, and buy airtime or data. No app to download. Zero storage used.
        </p>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <a
            href="https://wa.me/2347071238658?text=Hi%20Vode"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#090D16] hover:bg-[#1A202C] text-white text-sm font-semibold rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md group"
          >
            <span>Try Vode on WhatsApp</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </a>

          <Link
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 text-[#090D16] text-sm font-semibold rounded-md border border-[#E2E8F0] transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-xs"
          >
            <span>See How It Works</span>
            <span className="text-xs text-[#525B6C] font-mono">↓</span>
          </Link>
        </div>
      </div>

      {/* Anchor-Style Cards Section: All 4 Cards Showing Fully in a Clean Grid, Sliding in from Right */}
      <div ref={containerRef} className="mt-16 sm:mt-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
          {CARDS.map((card, index) => (
            <div
              key={card.id}
              style={{
                transitionDelay: `${index * 130}ms`,
              }}
              className={`w-full min-h-[420px] rounded-3xl p-6 flex flex-col justify-between ${card.bgClass} shadow-[0_8px_24px_-6px_rgba(0,0,0,0.06)] border border-black/5 hover:-translate-y-1.5 transition-all duration-700 ease-out ${
                inView ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"
              }`}
            >
              {/* Card Top: Text Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                      card.textColor === "text-white"
                        ? "bg-white/20 text-white"
                        : "bg-black/10 text-[#090D16]"
                    }`}
                  >
                    {card.badge}
                  </span>
                </div>

                <h3 className={`text-xl font-display font-bold leading-tight ${card.textColor}`}>
                  {card.title}
                </h3>

                <p
                  className={`text-xs leading-relaxed font-normal ${
                    card.textColor === "text-white"
                      ? "text-white/80"
                      : "text-[#1B3828]/80"
                  }`}
                >
                  {card.description}
                </p>
              </div>

              {/* Card Center: Visual Artifact Graphic */}
              <div className="my-auto flex items-center justify-center">
                {card.graphic}
              </div>

              {/* Card Bottom: Solid Anchor-Style Bottom Pill Tab */}
              <div className="pt-2">
                <div
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-xs text-center transition-all shadow-xs ${card.tabBg} ${card.tabText}`}
                >
                  {card.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
