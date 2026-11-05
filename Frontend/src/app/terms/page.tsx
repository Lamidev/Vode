"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface TermSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: TermSection[] = [
  {
    id: "overview",
    title: "Overview of the Service",
    content: (
      <p>
        Vode is a WhatsApp-first digital financial utility designed to help you manage your everyday finances directly inside your messaging workflow. You can send money, pay bills, buy data, track your spending, and receive transaction alerts—all via WhatsApp chat, images (<strong className="font-semibold text-[#090D16]">Snap & Pay</strong>), or voice notes (<strong className="font-semibold text-[#090D16]">Speak to Pay</strong>). The Service is provided by <strong className="font-semibold text-[#090D16]">VODE SYSTEMS AND TECHNOLOGIES LIMITED</strong> ("Vode", "we", "us", or "our").
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "User Eligibility",
    content: (
      <div>
        <p className="mb-2">To use Vode, you must:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Be at least 18 years of age.</li>
          <li>Be the verified, rightful owner of the WhatsApp phone number used to access the service.</li>
          <li>Be authorized to operate any linked funding accounts or commercial bank payment methods.</li>
          <li>Comply with applicable Nigerian laws and identity verification regulations (Tier-1 KYC).</li>
        </ul>
      </div>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use & Anti-Fraud Policy",
    content: (
      <div>
        <p className="mb-2">By accessing or using Vode, you agree to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Use the Service solely for lawful, personal, or legitimate commercial financial activities.</li>
          <li>Provide true, accurate, current, and complete identity information during onboarding.</li>
          <li>Not impersonate any individual, corporate entity, or provide false or stolen identities.</li>
          <li>Not utilize the Service to conduct financial fraud, money laundering, terrorism financing, pyramid schemes, or any illegal enterprise.</li>
          <li>
            Not abuse, reverse engineer, or attempt to manipulate our conversational AI system in any manner—including sending automated spam requests to disrupt the Service, attempting prompt injection or jailbreak attacks to override transaction safeguards, or probing internal infrastructure.
          </li>
        </ul>
        <p className="mt-3">
          We reserve the absolute right to immediately freeze your wallet, block associated WhatsApp accounts, and report suspicious activities to law enforcement and regulatory authorities if these terms are violated.
        </p>
      </div>
    ),
  },
  {
    id: "privacy-data",
    title: "Data and Privacy",
    content: (
      <p>
        Your use of Vode is strictly governed by our <Link href="/privacy" className="text-[#090D16] font-semibold underline hover:text-[#00D084]">Privacy Policy</Link>, which outlines how we collect, store, and process your data in compliance with the Nigeria Data Protection Act (NDPA) and NDPC guidelines. By using the Service, you explicitly consent to the collection and processing of your transaction records as set forth in that policy.
      </p>
    ),
  },
  {
    id: "banking-rails",
    title: "Banking Rails & Non-Bank Status",
    content: (
      <p>
        Vode is a financial technology software provider, not a licensed deposit money bank. All dedicated 10-digit NUBAN accounts, customer deposit safeguarding, and NIP (NIBSS Instant Payment) interbank settlements are powered by licensed Nigerian commercial banks and microfinance institutions regulated by the Central Bank of Nigeria (CBN).
      </p>
    ),
  },
  {
    id: "responsibility",
    title: "Transactions & User Responsibility",
    content: (
      <div>
        <p className="mb-2">
          You are entirely responsible for verifying the correctness of all payment commands, recipient account numbers, and amounts before entering your 4-digit PIN. Once confirmed via your private encrypted PIN sheet, transactions are dispatched to the interbank network in minor kobo units and are irrevocable.
        </p>
        <p className="mb-2">Vode is not liable for:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Mistaken transfers sent to incorrect account numbers entered by the user.</li>
          <li>Unauthorized payments initiated from your unlocked device if you failed to secure your phone.</li>
          <li>Network drops, timeout anomalies, or delays originating within external commercial banking switches.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "kill-switch",
    title: "Emergency Account Freeze Protocol",
    content: (
      <p>
        If your mobile phone or SIM card is lost, snatched, or compromised, you must immediately visit our web emergency portal at <Link href="/freeze" className="text-rose-600 font-semibold underline">usevode.com/freeze</Link> to trigger an instant kill-switch. This freezes all outbound payment activity on your wallet without requiring access to your WhatsApp device.
      </p>
    ),
  },
  {
    id: "service-availability",
    title: "Service Availability & Modifications",
    content: (
      <p>
        While we strive for 99.99% uptime, we may occasionally pause or limit certain transaction routes for scheduled maintenance, security hardening, or compliance audits. Vode provides conversational assistance and transaction execution, not certified tax or legal investment advisory.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property Rights",
    content: (
      <p>
        All logos, visual assets, software code, conversational interfaces, and multimodal OCR models associated with Vode are the exclusive intellectual property of VODE SYSTEMS AND TECHNOLOGIES LIMITED. You may not reproduce, decompile, or extract proprietary software without prior written authorization.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination & Account Closure",
    content: (
      <p>
        You may cease using Vode at any time by emptying your balance and contacting us via email at <a href="mailto:support@usevode.com" className="text-[#090D16] font-semibold underline">support@usevode.com</a>. We reserve the right to suspend or terminate accounts in accordance with statutory anti-money laundering (AML) directives or breaches of these Terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact & Legal Disclosures",
    content: (
      <div className="space-y-1 text-xs">
        <p><strong className="font-semibold text-[#090D16]">Company:</strong> VODE SYSTEMS AND TECHNOLOGIES LIMITED</p>
        <p><strong className="font-semibold text-[#090D16]">Support Email:</strong> <a href="mailto:support@usevode.com" className="underline">support@usevode.com</a></p>
        <p><strong className="font-semibold text-[#090D16]">Legal & Compliance:</strong> <a href="mailto:hello@usevode.com" className="underline">hello@usevode.com</a></p>
        <p><strong className="font-semibold text-[#090D16]">Jurisdiction:</strong> Federal Republic of Nigeria</p>
      </div>
    ),
  },
];

export default function TermsPage() {
  const [query, setQuery] = useState("");

  const filtered = SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] selection:bg-[#090D16] selection:text-white">
      <Header />

      <main className="flex-1 py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        {/* Top Header Row Matching Inspo Screenshot */}
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center px-4 py-1 rounded-full border border-slate-300 bg-white text-[11px] font-mono font-semibold tracking-wider text-[#525B6C] uppercase shadow-2xs">
            LEGAL
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-[#090D16]">
            Terms of Service
          </h1>

          <p className="text-sm sm:text-base text-[#525B6C] max-w-xl mx-auto">
            The terms that govern your access to Vode and its WhatsApp banking services.
          </p>
        </div>

        {/* Search & Notice Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-200">
          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search terms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#090D16] placeholder:text-slate-400 focus:outline-none focus:border-[#090D16] shadow-2xs"
            />
          </div>

          {/* Right Disclaimer Notice */}
          <p className="text-xs text-[#525B6C] max-w-sm md:text-right leading-relaxed">
            By accessing our website and WhatsApp service, you agree to be bound by these Terms of Service, and agree that you are responsible for compliance with any applicable Nigerian laws.
          </p>
        </div>

        {/* Preamble */}
        <div className="mb-10 p-5 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#525B6C] leading-relaxed shadow-2xs">
          Please note that your use of and access to the services (as defined below) are subject to the following terms; if you do not agree to all of these terms, you may not use or access the services in any manner.
        </div>

        {/* Terms Sections */}
        <div className="space-y-10">
          {filtered.length > 0 ? (
            filtered.map((sec) => (
              <section key={sec.id} id={sec.id} className="space-y-3">
                <h2 className="text-lg sm:text-xl font-display font-bold text-[#090D16]">
                  {sec.title}
                </h2>
                <div className="text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                  {sec.content}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-12 text-[#525B6C] text-sm">
              No sections matching "{query}". Try a different keyword.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

