"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    value: "item-1",
    q: "Is Vode a bank?",
    a: "Vode is a digital financial technology platform, not a bank. All deposit-holding, dedicated NUBAN account issuance, and NIP settlement are provided by licensed financial institutions and microfinance bank partners regulated by the Central Bank of Nigeria (CBN).",
  },
  {
    value: "item-2",
    q: "How do I access Vode without downloading an app?",
    a: "Vode operates 100% inside WhatsApp. Tap 'Try Vode Now' on this site or message our verified WhatsApp business number. You chat with Vode the exact same way you chat with friends.",
  },
  {
    value: "item-3",
    q: "What is Speak to Pay and Snap & Pay?",
    a: "Speak to Pay lets you send a short voice note (e.g. 'Send 5,000 to Tunde for groceries') to initiate a transfer without typing. Snap & Pay lets you forward a photo or screenshot of any invoice or POS receipt, and Vode automatically parses the account number and amount.",
  },
  {
    value: "item-4",
    q: "How does Vode protect my PIN if I'm on WhatsApp?",
    a: "You never type your PIN into chat history. When confirming a payment, Vode launches an encrypted, single-use keypad sheet that runs on a 90-second token. Your PIN is verified via secure hashing and is never visible in chat history or lock screen notifications.",
  },
  {
    value: "item-5",
    q: "What happens if someone steals my phone?",
    a: "No funds can leave your wallet without your secret PIN. Furthermore, our Instant Kill-Switch at usevode.com/freeze allows you to immediately freeze your account from any web browser on a laptop or borrowed phone without needing an SMS code.",
  },
  {
    value: "item-6",
    q: "Are there fees for using Vode?",
    a: "Transfers between Vode users are completely free. Outward transfers to external commercial banks carry standard nominal network clearing fees displayed clearly before you confirm the transaction.",
  },
];

export default function FAQSection() {
  return (
    <section
      id="faq"
      className="py-20 sm:py-28 px-4 sm:px-6 max-w-4xl mx-auto border-t border-slate-200/80"
    >
      <div className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-slate-300 bg-white text-[11px] font-mono font-semibold tracking-wider text-[#090D16] uppercase shadow-2xs mb-4">
          FREQUENTLY ASKED QUESTIONS
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#090D16]">
          Answers to your questions.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[#525B6C]">
          Everything you need to know about our technology, security, and WhatsApp banking.
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="item-1" className="space-y-3">
        {FAQS.map((faq) => (
          <AccordionItem
            key={faq.value}
            value={faq.value}
            className="bg-white border border-[#E2E8F0] rounded-xl px-5 sm:px-6 py-1 data-[state=open]:border-[#00D084]/60 shadow-2xs transition-colors"
          >
            <AccordionTrigger className="font-display font-bold text-base sm:text-lg text-[#090D16] hover:no-underline py-4 text-left">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-[#525B6C] leading-relaxed pt-1 pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
