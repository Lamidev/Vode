"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function OnboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [fullName, setFullName] = useState("");
  const [bvn, setBvn] = useState("");
  const [showBvn, setShowBvn] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [accountDetails, setAccountDetails] = useState<{
    accountNumber?: string;
    bankName?: string;
    accountName?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full legal name as it appears on your bank documents.");
      return;
    }

    const cleanBvn = bvn.replace(/\D/g, "");
    if (cleanBvn.length !== 11) {
      setErrorMessage("BVN or NIN must be exactly 11 digits.");
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setErrorMessage("Please choose a 4-digit transaction PIN.");
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage("PINs do not match. Please verify your 4 digits.");
      return;
    }

    setIsSubmitting(true);

    try {
      // POST directly to Vode production backend
      const response = await fetch("https://api.usevode.com/webhook/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          bvn: cleanBvn,
          pin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete account registration. Please try again.");
      }

      setIsSuccess(true);
      if (data.account) {
        setAccountDetails(data.account);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 relative rounded-lg overflow-hidden border border-[#0D0D0C]/15 shadow-xs">
            <Image src="/logo.png" alt="Vode" fill className="object-cover" />
          </div>
          <span className="font-display font-extrabold text-base tracking-tight text-[#090D16]">
            vode
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0E63F4]/10 text-[#0E63F4] rounded-md text-[11px] font-mono font-semibold">
          <Lock className="w-3 h-3" />
          <span>256-BIT ENCRYPTED</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full bg-white border border-[#090D16]/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        {!isSuccess ? (
          <div>
            {/* Header Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#090D16]/5 text-[#090D16] rounded-sm text-[10.5px] font-mono uppercase font-bold tracking-wider w-fit mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0E63F4]" />
              <span>SECURE BANKING ONBOARDING</span>
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight text-[#090D16] mb-2">
              Create your permanent account
            </h1>
            <p className="text-xs text-[#525B6C] leading-relaxed mb-6">
              Your credentials are encrypted end-to-end and never stored in WhatsApp chat logs. Powered by CBN-licensed financial partners.
            </p>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-[#AF0908]/10 border border-[#AF0908]/20 flex items-start gap-2 text-xs text-[#AF0908]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                  Full Legal Name
                </label>
                <Input
                  type="text"
                  placeholder="First and Last name as on your BVN"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#FAF9F5] border-[#090D16]/15 text-[#090D16] text-sm h-11 focus-visible:ring-[#0E63F4]"
                  required
                />
                <span className="text-[10.5px] text-[#525B6C] mt-1 block">
                  Must match the name on your government identification.
                </span>
              </div>

              {/* BVN / NIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#090D16]">
                    11-digit BVN or NIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBvn(!showBvn)}
                    className="text-[11px] font-medium text-[#0E63F4] flex items-center gap-1"
                  >
                    {showBvn ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showBvn ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <Input
                  type={showBvn ? "text" : "password"}
                  maxLength={11}
                  placeholder="•••••••••••"
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                  className="bg-[#FAF9F5] border-[#090D16]/15 text-[#090D16] font-mono tracking-widest text-base h-11 focus-visible:ring-[#0E63F4]"
                  required
                />
                <span className="text-[10.5px] text-[#525B6C] mt-1 block">
                  Encrypted with AES-256. Required by CBN regulations to provision your NUBAN.
                </span>
              </div>

              {/* 4-Digit PIN */}
              <div className="pt-2 border-t border-[#090D16]/10">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#090D16]">
                    Set 4-Digit Transaction PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] font-medium text-[#0E63F4] flex items-center gap-1"
                  >
                    {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPin ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type={showPin ? "text" : "password"}
                      maxLength={4}
                      placeholder="PIN (4 digits)"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      className="bg-[#FAF9F5] border-[#090D16]/15 text-[#090D16] text-center font-mono tracking-widest text-lg h-11 focus-visible:ring-[#0E63F4]"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type={showPin ? "text" : "password"}
                      maxLength={4}
                      placeholder="Confirm PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                      className="bg-[#FAF9F5] border-[#090D16]/15 text-[#090D16] text-center font-mono tracking-widest text-lg h-11 focus-visible:ring-[#0E63F4]"
                      required
                    />
                  </div>
                </div>
                <span className="text-[10.5px] text-[#525B6C] mt-1 block">
                  You will use this 4-digit PIN to authorize transfers inside WhatsApp.
                </span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0E63F4] hover:bg-[#0B4FC2] text-white font-medium h-12 rounded-xl text-sm transition-all shadow-md mt-4 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Encrypting & Provisioning NUBAN...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Complete Setup & Generate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-[#14A800]/10 text-[#14A800] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#14A800]/10 text-[#14A800] rounded-full text-[11px] font-mono font-bold uppercase mb-2">
              <Sparkles className="w-3 h-3" />
              <span>ACCOUNT PROVISIONED</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-[#090D16] mb-2">
              You are ready to roll!
            </h2>
            <p className="text-xs text-[#525B6C] max-w-xs mx-auto mb-6">
              Your dedicated Nigerian bank account has been created and linked to your WhatsApp.
            </p>

            {accountDetails && (
              <div className="bg-[#FAF9F5] border border-[#090D16]/10 rounded-xl p-4 text-left mb-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#525B6C]">Bank:</span>
                  <span className="font-bold text-[#090D16]">{accountDetails.bankName || "Nombank MFB"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#525B6C]">Account No:</span>
                  <span className="font-mono font-bold text-[#0E63F4] text-sm tracking-wider">
                    {accountDetails.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#525B6C]">Account Name:</span>
                  <span className="font-medium text-[#090D16]">{accountDetails.accountName}</span>
                </div>
              </div>
            )}

            <a
              href="https://wa.me/2347071238658"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#14A800] hover:bg-[#118A00] text-white font-medium h-12 rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              <span>Return to WhatsApp Chat</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Compliance Footer */}
      <div className="max-w-md mx-auto w-full text-center mt-6">
        <p className="text-[11px] text-[#525B6C]">
          NDPC Certified • NDPA Compliant • Bank-Grade 256-bit TLS
        </p>
      </div>
    </main>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-[#0E63F4] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardContent />
    </Suspense>
  );
}

