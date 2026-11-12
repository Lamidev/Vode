"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FreezePage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [secretType, setSecretType] = useState<"pin" | "bvn">("pin");
  const [secretValue, setSecretValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeRef, setFreezeRef] = useState("");

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://api.usevode.com");

  const handleFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!phoneNumber || !secretValue) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/webhook/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          secretType,
          secretValue: secretValue.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to freeze account. Please check your details.");
      }

      setFreezeRef(data.freezeRef || "VODE-LCK-CONFIRMED");
      setIsFrozen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to freeze account. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#62665D] hover:text-[#0D0D0C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 relative rounded-sm overflow-hidden border border-[#0D0D0C]/20">
            <Image src="/logo.png" alt="Vode" fill className="object-cover" />
          </div>
          <span className="font-display font-bold text-sm text-[#0D0D0C]">
            vode
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md mx-auto w-full bg-white border border-[#0D0D0C]/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        {!isFrozen ? (
          <div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#AF0908]/10 text-[#AF0908] rounded-sm text-[11px] font-mono font-semibold uppercase w-fit mb-4">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Emergency Web Kill-Switch</span>
            </div>

            <h1 className="text-2xl font-display font-extrabold text-[#0D0D0C] tracking-tight">
              Freeze Your Vode Account
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-[#62665D] leading-relaxed">
              If your phone or SIM card was stolen, lock your account immediately.
              This requires <strong>zero SMS codes</strong> and takes effect instantly.
            </p>

            <form onSubmit={handleFreeze} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase font-mono text-[#0D0D0C] mb-1.5">
                  Registered WhatsApp Phone Number
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="+234 800 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-[#FAF9F5] border-[#0D0D0C]/15 text-sm h-11"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase font-mono text-[#0D0D0C] mb-1.5">
                  Verify Identity With:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSecretType("pin");
                      setSecretValue("");
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border transition-all ${
                      secretType === "pin"
                        ? "bg-[#0D0D0C] text-[#FAF9F5] border-[#0D0D0C]"
                        : "bg-[#FAF9F5] text-[#62665D] border-[#0D0D0C]/10 hover:text-[#0D0D0C]"
                    }`}
                  >
                    4-Digit PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSecretType("bvn");
                      setSecretValue("");
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border transition-all ${
                      secretType === "bvn"
                        ? "bg-[#0D0D0C] text-[#FAF9F5] border-[#0D0D0C]"
                        : "bg-[#FAF9F5] text-[#62665D] border-[#0D0D0C]/10 hover:text-[#0D0D0C]"
                    }`}
                  >
                    Last 4 of BVN
                  </button>
                </div>

                <Input
                  type="password"
                  required
                  maxLength={4}
                  placeholder={secretType === "pin" ? "••••" : "Last 4 digits"}
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  className="bg-[#FAF9F5] border-[#0D0D0C]/15 font-mono tracking-widest text-center text-sm h-11"
                />
              </div>

              <div className="p-3 bg-[#FAF9F5] border border-[#0D0D0C]/10 rounded-md text-[11px] text-[#62665D] flex gap-2">
                <AlertTriangle className="w-4 h-4 text-[#AF0908] flex-shrink-0 mt-0.5" />
                <span>
                  Freezing immediately logs out all WhatsApp sessions and rejects all outbound bank transfers.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-[#AF0908]/10 border border-[#AF0908]/25 rounded-md text-xs text-[#AF0908]">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#AF0908] hover:bg-[#8D0706] text-white text-xs font-semibold uppercase tracking-wider rounded-md transition-all shadow-md"
              >
                {isSubmitting ? "Locking Account..." : "Lock Account Immediately"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-[#25D366]/20 text-[#075E54] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-display font-extrabold text-[#0D0D0C]">
              Your Account is Locked
            </h2>

            <p className="text-xs sm:text-sm text-[#62665D] leading-relaxed">
              Your Vode account has been placed into emergency freeze. All active WhatsApp sessions have been evicted, and no money can leave your wallet.
            </p>

            <div className="p-3.5 bg-[#FAF9F5] border border-[#0D0D0C]/10 rounded-md font-mono text-xs">
              <span className="text-[#62665D] block text-[10px] uppercase">
                Lock Reference Number
              </span>
              <strong className="text-[#0D0D0C] text-sm">{freezeRef}</strong>
            </div>

            <p className="text-[11px] text-[#62665D]">
              To unfreeze your account when you recover your device, email our emergency team at <strong>support@usevode.com</strong> with your lock reference number.
            </p>

            <div className="pt-2">
              <Button asChild className="w-full h-11 bg-[#0D0D0C] text-white text-xs font-semibold rounded-md">
                <Link href="/">Return to Homepage</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="text-center text-[11px] text-[#A0A5A8] py-4">
        Vode Systems and Technologies Limited • Emergency Security Response
      </div>
    </main>
  );
}
