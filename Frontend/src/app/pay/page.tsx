"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Building2,
  Delete,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentSession {
  recipientName: string;
  recipientAccountNumber: string;
  recipientBankName: string;
  amountInNaira: number;
  feeInNaira: number;
  totalDebitInNaira: number;
  expiresAt: string;
}

function PayContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("tx") || searchParams.get("token") || "";

  const [session, setSession] = useState<PaymentSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [pin, setPin] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    reference?: string;
    balanceNaira?: number;
  } | null>(null);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4000"
      : "https://api.usevode.com");

  // 1. Fetch Session Details on Mount
  useEffect(() => {
    let isMounted = true;

    async function fetchSession() {
      if (!token) {
        if (isMounted) {
          setIsLoadingSession(false);
          setSessionError("No payment authorization token provided. Please initiate your transfer in WhatsApp.");
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/webhook/banking/token/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to retrieve payment session details.");
        }

        if (isMounted) {
          setSession(data);
          const expiryTime = new Date(data.expiresAt).getTime();
          const now = Date.now();
          const diffSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
          setSecondsRemaining(diffSeconds);
          setIsLoadingSession(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load payment session.";
          setSessionError(msg);
          setIsLoadingSession(false);
        }
      }
    }

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [token, API_BASE]);

  // 2. Countdown Timer
  useEffect(() => {
    if (!session || isSuccess || sessionError) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionError("Payment session has expired (90s limit). Please initiate the transfer again in WhatsApp.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, isSuccess, sessionError]);

  // 3. Handle Keypad Inputs
  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setErrorMessage("");
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage("");
  };

  const handleClear = () => {
    setPin("");
    setErrorMessage("");
  };

  // 4. Submit Payment Authorization
  const handleAuthorize = async () => {
    if (pin.length !== 4) {
      setErrorMessage("Please enter your complete 4-digit PIN.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/webhook/banking/execute-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment execution failed. Please verify your PIN.");
      }

      setIsSuccess(true);
      setSuccessReceipt({
        reference: data.reference,
        balanceNaira: data.balanceNaira,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transfer failed. Please check your PIN and try again.";
      setErrorMessage(msg);
      setPin(""); // Clear PIN on failure for safety
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F5] flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
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
          <span>90s Instant Auth</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full bg-white border border-[#090D16]/10 rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#0E63F4]/5 rounded-full blur-2xl pointer-events-none" />

        {/* LOADING STATE */}
        {isLoadingSession && (
          <div className="py-12 text-center space-y-4">
            <div className="w-10 h-10 border-3 border-[#0E63F4]/20 border-t-[#0E63F4] rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#525B6C]">
              Verifying payment session security...
            </p>
          </div>
        )}

        {/* ERROR / EXPIRED STATE */}
        {!isLoadingSession && sessionError && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-[#FF453A]/10 text-[#FF453A] rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#090D16]">Session Expired</h2>
              <p className="text-xs text-[#525B6C] mt-1.5 leading-relaxed max-w-xs mx-auto">
                {sessionError}
              </p>
            </div>
            <div className="pt-2">
              <a
                href="https://wa.me/2347071238658"
                className="inline-flex items-center justify-center gap-2 w-full bg-[#090D16] text-white font-medium h-11 rounded-xl text-xs hover:bg-[#202738] transition-colors"
              >
                <span>Return to WhatsApp Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {!isLoadingSession && isSuccess && session && (
          <div className="text-center py-4 space-y-5">
            <div className="w-14 h-14 bg-[#14A800]/10 text-[#14A800] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 bg-[#14A800]/10 text-[#14A800] text-[10.5px] font-mono font-bold uppercase rounded-full mb-1">
                Payment Authorized & Sent
              </span>
              <h2 className="text-xl font-extrabold text-[#090D16]">
                ₦{session.amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-[#525B6C] mt-0.5">
                Sent to {session.recipientName}
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="bg-[#FAF9F5] border border-[#090D16]/10 rounded-xl p-3.5 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-[#525B6C]">
                <span>Destination Bank</span>
                <span className="font-semibold text-[#090D16]">{session.recipientBankName}</span>
              </div>
              <div className="flex justify-between items-center text-[#525B6C]">
                <span>Account Number</span>
                <span className="font-mono font-semibold text-[#090D16]">{session.recipientAccountNumber}</span>
              </div>
              {successReceipt?.reference && (
                <div className="flex justify-between items-center text-[#525B6C]">
                  <span>Vode Reference</span>
                  <span className="font-mono text-[11px] font-semibold text-[#0E63F4]">
                    {successReceipt.reference}
                  </span>
                </div>
              )}
              {typeof successReceipt?.balanceNaira === "number" && (
                <div className="flex justify-between items-center pt-2 border-t border-[#090D16]/10 text-[#525B6C]">
                  <span>Remaining Balance</span>
                  <span className="font-semibold text-[#090D16]">
                    ₦{successReceipt.balanceNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <a
              href="https://wa.me/2347071238658"
              className="inline-flex items-center justify-center gap-2 w-full bg-[#14A800] hover:bg-[#118A00] text-white font-medium h-12 rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              <span>Done • Back to WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* READY / AUTHORIZATION KEYPAD STATE */}
        {!isLoadingSession && !sessionError && !isSuccess && session && (
          <div>
            {/* Countdown Banner */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#090D16]/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#090D16]">
                <Clock className="w-3.5 h-3.5 text-[#0E63F4]" />
                <span>Expires in</span>
              </div>
              <div
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  secondsRemaining < 20
                    ? "bg-[#FF453A]/10 text-[#FF453A] animate-pulse"
                    : "bg-[#0E63F4]/10 text-[#0E63F4]"
                }`}
              >
                00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
              </div>
            </div>

            {/* Recipient & Amount Card */}
            <div className="bg-[#FAF9F5] border border-[#090D16]/10 rounded-xl p-4 mb-4 text-center">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#525B6C] block">
                Transfer Amount
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#090D16] tracking-tight my-1">
                ₦{session.amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#090D16] font-medium mt-1">
                <Building2 className="w-3.5 h-3.5 text-[#525B6C]" />
                <span>{session.recipientName}</span>
              </div>
              <div className="text-[11px] text-[#525B6C] mt-0.5 font-mono">
                {session.recipientBankName} • {session.recipientAccountNumber}
              </div>

              {/* Fee Notice */}
              <div className="mt-3 pt-2 border-t border-[#090D16]/10 flex justify-between items-center text-[11px] text-[#525B6C]">
                <span>NIP Clearing Fee</span>
                <span>₦{session.feeInNaira.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-[#090D16] mt-0.5">
                <span>Total Debit</span>
                <span>₦{session.totalDebitInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-3 p-2.5 bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-lg flex items-center gap-2 text-xs text-[#FF453A]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* PIN Dots Display */}
            <div className="text-center mb-4">
              <label className="text-xs font-semibold text-[#090D16] block mb-2">
                Enter your 4-digit PIN to authorize
              </label>
              <div className="flex justify-center items-center gap-3">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-11 h-12 rounded-xl flex items-center justify-center border transition-all ${
                        isFilled
                          ? "border-[#0E63F4] bg-[#0E63F4]/5 shadow-xs"
                          : "border-[#090D16]/20 bg-white"
                      }`}
                    >
                      {isFilled ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-[#0E63F4]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#090D16]/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Numeric Keypad for Instant Mobile Thumb Auth */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EFE8] active:bg-[#E5E1D8] text-base font-semibold text-[#090D16] border border-[#090D16]/10 flex items-center justify-center transition-colors cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isSubmitting}
                className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EFE8] active:bg-[#E5E1D8] text-xs font-medium text-[#525B6C] border border-[#090D16]/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                disabled={isSubmitting}
                className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EFE8] active:bg-[#E5E1D8] text-base font-semibold text-[#090D16] border border-[#090D16]/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isSubmitting}
                className="h-12 rounded-xl bg-[#FAF9F5] hover:bg-[#F2EFE8] active:bg-[#E5E1D8] text-sm text-[#090D16] border border-[#090D16]/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Authorize Button */}
            <Button
              type="button"
              onClick={handleAuthorize}
              disabled={pin.length !== 4 || isSubmitting}
              className="w-full bg-[#0E63F4] hover:bg-[#0B4FC2] disabled:opacity-50 text-white font-medium h-12 rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Clearing Transfer with Banking Rail...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Authorize ₦{session.amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="mt-5 pt-3.5 border-t border-[#090D16]/10 flex items-center justify-center gap-1.5 text-[11px] text-[#525B6C]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#14A800]" />
          <span>Bank-grade 256-bit encryption • PIN never shared in chat</span>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="max-w-md mx-auto w-full text-center mt-6">
        <p className="text-[11px] text-[#525B6C]">
          Vode Technologies Limited. Licensed CBN payment partners & NDIC insured.
        </p>
      </div>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#0E63F4]/20 border-t-[#0E63F4] rounded-full animate-spin" />
        </div>
      }
    >
      <PayContent />
    </Suspense>
  );
}

