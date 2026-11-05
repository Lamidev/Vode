import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import BentoFeatures from "@/components/BentoFeatures";
import HowItWorks from "@/components/HowItWorks";
import SecuritySection from "@/components/SecuritySection";
import EmergencyFreezeBanner from "@/components/EmergencyFreezeBanner";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] selection:bg-[#0E63F4] selection:text-white">
      {/* Floating Island Header with Squared Edges */}
      <Header />

      {/* Main Content Flow */}
      <main className="flex-1">
        {/* Section 1: Full-Width Unboxed Hero with Graphic Visual Artifacts */}
        <Hero />

        {/* Section 2: Bento Grid Core Capabilities */}
        <BentoFeatures />

        {/* Section 3: 4-Step Descending Staircase Onboarding (Xara Style) */}
        <HowItWorks />

        {/* Section 4: Security Section with NDPC Shield & Animated Padlock */}
        <SecuritySection />

        {/* Section 5: Instant Block Card with Nigerian Banks Marquee */}
        <EmergencyFreezeBanner />

        {/* Section 6: Interactive FAQ Accordion */}
        <FAQSection />
      </main>

      {/* Final Action CTA & Footer */}
      <Footer />
    </div>
  );
}
