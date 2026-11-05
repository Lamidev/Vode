"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCheck, ShieldCheck, Lock, ArrowLeft, MoreVertical, Send, RefreshCw } from "lucide-react";

type ScenarioKey = "send" | "receive" | "airtime" | "request";

interface Scenario {
  key: ScenarioKey;
  label: string;
  badge: string;
  title: string;
  description: string;
  messages: Array<{
    sender: "user" | "vode";
    time: string;
    text?: string;
    interactive?: {
      type: "buttons" | "name_verify" | "pin_sheet" | "receipt";
      data?: any;
    };
  }>;
}

const SCENARIOS: Scenario[] = [
  {
    key: "send",
    label: "Send Money",
    badge: "NIP OUTWARD",
    title: "Instant transfers with name inquiry",
    description:
      "Verify the exact recipient name before money leaves your account. Approve securely without ever typing your PIN in plain chat.",
    messages: [
      {
        sender: "user",
        time: "10:41 AM",
        text: "Send 25,000 to 0123456789 Access Bank",
      },
      {
        sender: "vode",
        time: "10:41 AM",
        interactive: {
          type: "name_verify",
          data: {
            name: "ADEBAYO TUNDE JOHNSON",
            bank: "Access Bank",
            account: "0123456789",
            amount: "₦25,000.00",
            fee: "₦10.00",
            total: "₦25,010.00",
          },
        },
      },
      {
        sender: "vode",
        time: "10:41 AM",
        interactive: {
          type: "pin_sheet",
          data: {
            status: "Authorized via Encrypted Keypad",
          },
        },
      },
      {
        sender: "vode",
        time: "10:42 AM",
        interactive: {
          type: "receipt",
          data: {
            title: "Transfer Successful",
            amount: "₦25,000.00",
            recipient: "Adebayo Tunde Johnson",
            ref: "VODE-TX-89210",
            time: "Today, 10:42 AM",
          },
        },
      },
    ],
  },
  {
    key: "receive",
    label: "Receive Money",
    badge: "DEDICATED NUBAN",
    title: "Your permanent virtual account",
    description:
      "Anyone can transfer to your 10-digit NUBAN from any Nigerian bank. You receive an instant credit notification inside WhatsApp.",
    messages: [
      {
        sender: "user",
        time: "02:14 PM",
        text: "My account details",
      },
      {
        sender: "vode",
        time: "02:14 PM",
        interactive: {
          type: "name_verify",
          data: {
            name: "CHIDIEBERE EMMANUEL OKAFOR",
            bank: "Safe Haven MFB / Vode",
            account: "9041283910",
            amount: "Balance: ₦184,200.00",
            fee: "Dedicated Tier-1 Account",
            total: "Active & Monitored",
          },
        },
      },
      {
        sender: "vode",
        time: "02:18 PM",
        interactive: {
          type: "receipt",
          data: {
            title: "Credit Alert Received",
            amount: "₦50,000.00",
            recipient: "Deposit from Zenith Bank • Bola Tinubu",
            ref: "NIP-CR-441029",
            time: "Today, 02:18 PM",
          },
        },
      },
    ],
  },
  {
    key: "airtime",
    label: "Airtime & Data",
    badge: "INSTANT UTILITY",
    title: "One-tap top-ups for any network",
    description:
      "Recharge MTN, Airtel, Glo, or 9mobile instantly. Buy SME or corporate data bundles in 3 seconds.",
    messages: [
      {
        sender: "user",
        time: "06:05 PM",
        text: "Buy 5GB MTN data for 08031234567",
      },
      {
        sender: "vode",
        time: "06:05 PM",
        interactive: {
          type: "name_verify",
          data: {
            name: "MTN 5GB Monthly SME Data",
            bank: "Destination: 08031234567",
            account: "Valid for 30 Days",
            amount: "₦1,500.00",
            fee: "₦0.00 fee",
            total: "₦1,500.00",
          },
        },
      },
      {
        sender: "vode",
        time: "06:05 PM",
        interactive: {
          type: "receipt",
          data: {
            title: "Data Delivered Successfully",
            amount: "5 GB Monthly",
            recipient: "08031234567 (MTN)",
            ref: "TELCO-88129",
            time: "Today, 06:05 PM",
          },
        },
      },
    ],
  },
  {
    key: "request",
    label: "Request Money",
    badge: "P2P BILLING",
    title: "Collect payments without awkward reminders",
    description:
      "Generate clean, branded payment links. Friends and clients pay with any bank app or card.",
    messages: [
      {
        sender: "user",
        time: "08:30 PM",
        text: "Request 15,000 from Zainab for project design",
      },
      {
        sender: "vode",
        time: "08:30 PM",
        interactive: {
          type: "receipt",
          data: {
            title: "Payment Request Created",
            amount: "₦15,000.00",
            recipient: "Share Link: usevode.com/pay/req_99a",
            ref: "REQ-992104",
            time: "Expires in 48 hours",
          },
        },
      },
    ],
  },
];

export default function WhatsAppSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("send");

  const currentScenario =
    SCENARIOS.find((s) => s.key === selectedScenario) || SCENARIOS[0];

  return (
    <section id="simulator" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[#62665D]">
          [LIVE CONVERSATIONAL EXPERIENCE]
        </span>
        <h2 className="mt-3 text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#0D0D0C]">
          See how banking works in WhatsApp.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[#62665D]">
          No clunky multi-step menus. Real name verification, encrypted PIN
          authorization, and instant receipts—rendered right where you chat.
        </p>

        {/* 4-Corner Box Tab Switchers */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SCENARIOS.map((scenario) => {
            const isActive = scenario.key === selectedScenario;
            return (
              <button
                key={scenario.key}
                type="button"
                onClick={() => setSelectedScenario(scenario.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-md border transition-all ${
                  isActive
                    ? "bg-[#0D0D0C] text-[#FAF9F5] border-[#0D0D0C] shadow-sm"
                    : "bg-white text-[#62665D] border-[#0D0D0C]/10 hover:border-[#0D0D0C]/30 hover:text-[#0D0D0C]"
                }`}
              >
                {scenario.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-[#0D0D0C]/10 rounded-2xl p-6 sm:p-10 shadow-[0_20px_60px_-20px_rgba(13,12,11,0.06)]">
        {/* Left Explanation Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-block px-2.5 py-1 bg-[#FAF9F5] border border-[#0D0D0C]/10 rounded-sm text-[11px] font-mono font-semibold uppercase text-[#0D0D0C]">
            {currentScenario.badge}
          </div>

          <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#0D0D0C] tracking-tight">
            {currentScenario.title}
          </h3>

          <p className="text-sm sm:text-base text-[#62665D] leading-relaxed">
            {currentScenario.description}
          </p>

          <div className="pt-4 border-t border-[#0D0D0C]/10 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-[#0D0D0C] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#25D366]" />
              <span>Full Name Resolution via NIP bank rails</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#0D0D0C] font-medium">
              <Lock className="w-4 h-4 text-[#0D0D0C]" />
              <span>PIN sheet runs on one-time 90s encrypted token</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href="https://wa.me/2348000000000?text=Hi%20Vode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0D0D0C] hover:bg-[#20231E] text-[#FAF9F5] text-xs font-semibold rounded-md transition-all shadow-sm"
            >
              <span>Try this in WhatsApp</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
            </a>
          </div>
        </div>

        {/* Right Phone Screen (Pure HTML/CSS Authentic WhatsApp UI) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-sm sm:max-w-md bg-[#0D0D0C] rounded-[28px] p-2 sm:p-2.5 shadow-2xl border border-black/20">
            {/* Phone Screen Container */}
            <div className="w-full bg-[#EFEAE2] rounded-[22px] overflow-hidden flex flex-col h-[540px] relative border border-[#0D0D0C]/15">
              {/* WhatsApp App Header */}
              <div className="bg-[#075E54] text-white px-3.5 py-3 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 opacity-80 cursor-pointer" />
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black border border-white/20 relative flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="Vode"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold tracking-tight">
                        Vode
                      </span>
                      {/* Verified Badge */}
                      <svg
                        className="w-3.5 h-3.5 text-[#25D366] fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-white/80 leading-tight">
                      Official Business Account • online
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-80">
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>

              {/* Chat Message Scrollable Area */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto wa-wallpaper">
                {/* Security Encryption Notice */}
                <div className="text-center my-1">
                  <span className="inline-block px-2.5 py-1 bg-[#FFF8CC] text-[#554B1A] text-[9.5px] rounded-md shadow-xs max-w-[280px] leading-tight border border-[#E8DD9D]">
                    Messages are end-to-end encrypted. Vode never stores plain-text PINs.
                  </span>
                </div>

                {/* Scenario Messages */}
                {currentScenario.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    } animate-in fade-in duration-300`}
                  >
                    {/* Plain Text Bubble */}
                    {msg.text && (
                      <div
                        className={`max-w-[85%] px-3 py-1.5 rounded-lg text-xs leading-relaxed shadow-xs relative ${
                          msg.sender === "user"
                            ? "bg-[#D9FDD3] text-[#111B21] rounded-tr-none"
                            : "bg-white text-[#111B21] rounded-tl-none border border-black/5"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[9px] text-[#667781]">
                            {msg.time}
                          </span>
                          {msg.sender === "user" && (
                            <CheckCheck className="w-3 h-3 text-[#53BDEB]" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interactive Name Verification Bubble */}
                    {msg.interactive?.type === "name_verify" && (
                      <div className="max-w-[90%] bg-white rounded-lg rounded-tl-none p-3 shadow-xs border border-black/10 text-xs space-y-2">
                        <div className="flex items-center justify-between border-b border-black/5 pb-1.5">
                          <span className="text-[10px] font-semibold text-[#075E54] tracking-wider uppercase">
                            Verify Details
                          </span>
                          <span className="text-[9px] text-[#667781]">
                            {msg.time}
                          </span>
                        </div>

                        <div>
                          <p className="text-[11px] text-[#667781]">Recipient Name</p>
                          <p className="font-bold text-[#111B21] text-xs">
                            {msg.interactive.data.name}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF9F5] p-2 rounded border border-black/5">
                          <div>
                            <span className="text-[#667781]">Bank:</span>{" "}
                            <span className="font-medium text-[#111B21]">
                              {msg.interactive.data.bank}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#667781]">Account:</span>{" "}
                            <span className="font-medium text-[#111B21]">
                              {msg.interactive.data.account}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#667781]">Amount:</span>{" "}
                            <span className="font-bold text-[#111B21]">
                              {msg.interactive.data.amount}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#667781]">Fee:</span>{" "}
                            <span className="font-medium text-[#25D366]">
                              {msg.interactive.data.fee}
                            </span>
                          </div>
                        </div>

                        {/* WhatsApp Quick Reply Buttons */}
                        <div className="pt-1 flex gap-1.5">
                          <div className="flex-1 py-1.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-center font-semibold text-[11px] text-[#00A884] rounded border border-black/10 cursor-pointer">
                            Confirm & Transfer
                          </div>
                          <div className="py-1.5 px-3 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-center font-medium text-[11px] text-[#EA4335] rounded border border-black/10 cursor-pointer">
                            Cancel
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PIN Authorization Sheet Preview */}
                    {msg.interactive?.type === "pin_sheet" && (
                      <div className="max-w-[90%] bg-[#0D0D0C] text-[#FAF9F5] rounded-lg rounded-tl-none p-3 shadow-md border border-white/10 text-xs space-y-2 mt-1">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-1.5 text-[#25D366]">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono tracking-wider font-semibold uppercase">
                              Encrypted Keypad Sheet
                            </span>
                          </div>
                          <span className="text-[9px] text-[#A0A5A8]">90s TTL</span>
                        </div>
                        <p className="text-[11px] text-[#D1D5DB]">
                          Scrambled numeric pad opened in secure sheet. PIN verified without exposing text in chat.
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />
                          <span className="text-[10px] font-semibold text-[#25D366]">
                            {msg.interactive.data.status}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Receipt Bubble */}
                    {msg.interactive?.type === "receipt" && (
                      <div className="max-w-[90%] bg-white rounded-lg rounded-tl-none p-3 shadow-xs border border-black/10 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[#25D366] font-semibold">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                            <span className="text-xs">
                              {msg.interactive.data.title}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#667781]">
                            {msg.time}
                          </span>
                        </div>

                        <div className="bg-[#FAF9F5] p-2.5 rounded border border-black/5 space-y-1">
                          <div className="text-base font-bold font-display text-[#111B21]">
                            {msg.interactive.data.amount}
                          </div>
                          <div className="text-[11px] text-[#667781]">
                            {msg.interactive.data.recipient}
                          </div>
                          <div className="text-[10px] font-mono text-[#667781] pt-1 border-t border-black/5 flex justify-between">
                            <span>Ref: {msg.interactive.data.ref}</span>
                            <span>{msg.interactive.data.time}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom WhatsApp Input Bar Mockup */}
              <div className="bg-[#F0F2F5] px-2.5 py-2 flex items-center gap-2 border-t border-black/10">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-[#667781] border border-black/10 flex items-center justify-between">
                  <span>Type a message...</span>
                </div>
                <div className="w-7 h-7 bg-[#00A884] rounded-full flex items-center justify-center text-white shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

