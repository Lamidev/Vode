"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PrivacySection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: PrivacySection[] = [
  {
    id: "welcome",
    title: "Introduction",
    content: (
      <p>
        Welcome to Vode, your WhatsApp-first digital financial utility. At <strong className="font-semibold text-[#090D16]">VODE SYSTEMS AND TECHNOLOGIES LIMITED</strong> ("Vode", "we", "us", or "our"), your privacy, personal data integrity, and financial confidentiality are of foundational importance. This Privacy Policy explains how we collect, use, store, and protect your personal information when you access our services through WhatsApp or our website.
      </p>
    ),
  },
  {
    id: "info-collected",
    title: "What Information We Collect",
    content: (
      <div className="space-y-3">
        <p>When you interact with Vode through WhatsApp or our website, we may collect the following categories of information:</p>

        <div>
          <h4 className="font-semibold text-[#090D16] mb-1">1. Personal & Identity Data</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full legal name and phone number (transmitted via WhatsApp messaging).</li>
            <li>Bank Verification Number (BVN) or National Identification Number (NIN) for Tier-1 regulatory verification.</li>
            <li>Public WhatsApp profile display name.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-[#090D16] mb-1">2. Transaction & Usage Data</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Details of financial transactions (amount in kobo, recipient bank, account number, session reference, purpose).</li>
            <li>Images of bills, receipts, or paper invoices forwarded via <strong className="font-semibold text-[#090D16]">Snap & Pay</strong>.</li>
            <li>Audio voice notes sent to authorize transfers via <strong className="font-semibold text-[#090D16]">Speak to Pay</strong>.</li>
            <li>Timestamps, network delivery receipts, and interaction frequency.</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-[#090D16] mb-1">3. Security & Device Logs</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Session IP addresses and browser metadata during 90-second encrypted PIN sheet authorization.</li>
            <li>Emergency freeze audit trails submitted via our kill-switch portal.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "pin-security",
    title: "Zero Plaintext PIN Commitment",
    content: (
      <p>
        Under no circumstances does Vode request, store, or transmit your secret 4-digit transaction PIN in plaintext within WhatsApp chat history. When confirming any debit, Vode opens a dedicated, 90-second encrypted keypad sheet. Your PIN is irreversibly hashed using industry-grade cryptographic salt before verification against our core ledger.
      </p>
    ),
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: (
      <div>
        <p className="mb-2">We use your information exclusively to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Execute, verify, and settle payments, transfers, utility tokens, and airtime recharges.</li>
          <li>Assign and maintain your permanent 10-digit NUBAN account in your name.</li>
          <li>Accurately parse transaction intent, amounts, and recipient bank routing from voice notes and receipt photos.</li>
          <li>Prevent payment fraud, money laundering, SIM-swap attacks, and unauthorized access.</li>
          <li>Fulfill statutory reporting obligations under the Central Bank of Nigeria (CBN) and Nigeria Data Protection Act (NDPA).</li>
        </ul>
        <p className="mt-3 font-semibold text-[#090D16]">
          We never sell, monetize, or rent your personal data to advertisers or third-party marketing brokers.
        </p>
      </div>
    ),
  },
  {
    id: "multimodal-processing",
    title: "Voice & Image Processing (Speak & Snap Privacy)",
    content: (
      <p>
        When you send voice notes (<strong className="font-semibold text-[#090D16]">Speak to Pay</strong>) or receipt photos (<strong className="font-semibold text-[#090D16]">Snap & Pay</strong>), our systems temporarily process the media using secure machine learning models solely to extract the required financial variables (e.g., recipient account number, amount due, bank name). Raw audio recordings and ephemeral image buffers are automatically purged after transaction validation.
      </p>
    ),
  },
  {
    id: "storage-security",
    title: "Data Storage, Encryption & NDPC Certification",
    content: (
      <div>
        <p className="mb-2">
          Vode is certified by the <strong className="font-semibold text-[#090D16]">Nigeria Data Protection Commission (NDPC)</strong>, ensuring institutional data governance. We deploy:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>AES-256 bit encryption for data at rest across all database partitions.</li>
          <li>TLS 1.3 cryptographic protocols for all in-transit communications.</li>
          <li>Strict role-based least-privilege access controls restricted to authorized compliance personnel.</li>
        </ul>
        <p className="mt-3">
          Your transaction ledger records are maintained only for the statutory periods mandated by financial anti-money laundering (AML) regulations (typically five years), after which records are permanently archived or expunged.
        </p>
      </div>
    ),
  },
  {
    id: "third-parties",
    title: "Third-Party Banking Infrastructure",
    content: (
      <p>
        To execute outward NIP transfers and generate dedicated 10-digit NUBAN accounts, Vode integrates directly with CBN-licensed commercial banks, payment switches (NIBSS), and microfinance bank partners. We only transmit the minimum data required to facilitate recipient name inquiries and interbank settlement. All banking partners are bound by strict non-disclosure and financial data regulations.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your Data Protection Rights",
    content: (
      <div>
        <p className="mb-2">Under the Nigeria Data Protection Act (NDPA), you hold the right to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Request a copy of the personal and financial records we hold about you.</li>
          <li>Request the correction or updating of any inaccurate details.</li>
          <li>Request the restriction of data processing or account deletion (subject to mandatory legal audit retention rules).</li>
          <li>Withdraw your consent to non-essential communications at any time.</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, contact our Data Protection Officer at <a href="mailto:privacy@usevode.com" className="text-[#090D16] font-semibold underline">privacy@usevode.com</a>.
        </p>
      </div>
    ),
  },
  {
    id: "minors",
    title: "Children’s Privacy",
    content: (
      <p>
        Vode is designed strictly for adults aged 18 and older. We do not knowingly collect personal or biometric information from minors. If we discover an account belongs to an individual under 18, we will immediately freeze the wallet and delete associated data.
      </p>
    ),
  },
  {
    id: "updates",
    title: "Policy Updates & Notification",
    content: (
      <p>
        We may update this Privacy Policy to reflect technical enhancements or regulatory updates. When significant changes occur, we will notify you through WhatsApp message or by posting a prominent notice on our website.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact Us",
    content: (
      <div className="space-y-1 text-xs">
        <p><strong className="font-semibold text-[#090D16]">Data Controller:</strong> VODE SYSTEMS AND TECHNOLOGIES LIMITED</p>
        <p><strong className="font-semibold text-[#090D16]">Privacy & Compliance:</strong> <a href="mailto:privacy@usevode.com" className="underline">privacy@usevode.com</a></p>
        <p><strong className="font-semibold text-[#090D16]">Customer Support:</strong> <a href="mailto:support@usevode.com" className="underline">support@usevode.com</a></p>
        <p><strong className="font-semibold text-[#090D16]">Headquarters:</strong> Lagos, Nigeria</p>
      </div>
    ),
  },
];

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-[#525B6C] max-w-xl mx-auto">
            How Vode collects, uses, stores, and protects your information while you bank through WhatsApp.
          </p>
        </div>

        {/* Search & Notice Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 mb-12 pb-8 border-b border-slate-200">
          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search privacy policy..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#090D16] placeholder:text-slate-400 focus:outline-none focus:border-[#090D16] shadow-2xs"
            />
          </div>

          {/* Right Disclaimer Notice */}
          <p className="text-xs text-[#525B6C] max-w-sm md:text-right leading-relaxed">
            By using our website and WhatsApp service, you consent to this Privacy Policy and agree to our processing of your personal data under Nigerian law.
          </p>
        </div>

        {/* Preamble */}
        <div className="mb-10 p-5 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#525B6C] leading-relaxed shadow-2xs">
          Welcome to Vode. This Privacy Policy outlines the standards we uphold to safeguard your financial privacy, biometric authorization integrity, and personal identifiable information (PII).
        </div>

        {/* Privacy Sections */}
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

