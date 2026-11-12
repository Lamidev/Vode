"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, KeyRound, AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refresh } = useAdminAuth();

  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  // Bootstrap state
  const [fullName, setFullName] = useState("");
  const [bootstrapEmail, setBootstrapEmail] = useState("hello@usevode.com");
  const [bootstrapPassword, setBootstrapPassword] = useState("");
  const [bootstrapSuccess, setBootstrapSuccess] = useState<{
    email: string;
    totpSecret: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        const res = await adminApi.bootstrapStatus();
        if (res.needsBootstrap) {
          setNeedsBootstrap(true);
          setMode("bootstrap");
        }
      } catch {
        // Backend offline or unreachable; keep login mode
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await adminApi.login({ email, password });
      if (res.requires2fa && res.challengeToken) {
        setChallengeToken(res.challengeToken);
      } else {
        await refresh();
        router.replace("/");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.verify2fa({ challengeToken, code: totpCode });
      await refresh();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid 2FA code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await adminApi.bootstrap({
        email: bootstrapEmail,
        fullName,
        password: bootstrapPassword,
      });
      setBootstrapSuccess({ email: res.admin.email, totpSecret: res.totpSecret });
      setNeedsBootstrap(false);
      setEmail(res.admin.email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create Super Admin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center space-y-1">
          <div className="inline-flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Vode"
              width={30}
              height={30}
              className="rounded-none object-contain"
            />
            <span className="font-display font-extrabold text-xl tracking-tight text-[#090D16]">
              VODE OPS
            </span>
          </div>
          <p className="text-[11px] text-[#525B6C]">
            Double-Entry Ledger &amp; Admin Operations
          </p>
        </div>

        <Card className="border-slate-300">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm">
              {mode === "bootstrap" ? "Create First Super Admin" : "Sign in to Vode Ops"}
            </CardTitle>
            <CardDescription className="text-[11px]">
              {mode === "bootstrap"
                ? "Set up the initial account. This locks automatically after creation."
                : "Enter your official staff credentials to continue."}
            </CardDescription>

            {!challengeToken && needsBootstrap && (
              <div className="flex gap-1 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={`flex-1 py-1 px-2 text-xs font-bold border transition-colors cursor-pointer ${
                    mode === "login"
                      ? "bg-[#090D16] text-white border-[#090D16]"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("bootstrap");
                    setError(null);
                  }}
                  className={`flex-1 py-1 px-2 text-xs font-bold border transition-colors cursor-pointer ${
                    mode === "bootstrap"
                      ? "bg-[#090D16] text-white border-[#090D16]"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  Create Admin
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3 pt-3">
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {bootstrapSuccess ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-100 border border-slate-300 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-[#090D16]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Admin Created: {bootstrapSuccess.email}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Save this 2FA key in Google Authenticator or 1Password:
                  </p>
                  <div className="font-mono font-bold bg-white p-2 border border-slate-300 select-all text-xs">
                    {bootstrapSuccess.totpSecret}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setBootstrapSuccess(null);
                    setMode("login");
                  }}
                >
                  Continue to Sign In
                </Button>
              </div>
            ) : mode === "bootstrap" ? (
              <form onSubmit={handleBootstrap} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName" className="text-[11px]">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vode Founder"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bootstrapEmail" className="text-[11px]">Official Work Email</Label>
                  <Input
                    id="bootstrapEmail"
                    type="email"
                    required
                    value={bootstrapEmail}
                    onChange={(e) => setBootstrapEmail(e.target.value)}
                    placeholder="hello@usevode.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bootstrapPassword" className="text-[11px]">Password (8+ chars)</Label>
                  <Input
                    id="bootstrapPassword"
                    type="password"
                    required
                    minLength={8}
                    value={bootstrapPassword}
                    onChange={(e) => setBootstrapPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  <UserPlus className="w-3.5 h-3.5" />
                  {submitting ? "Creating Admin..." : "Create Super Admin"}
                </Button>
              </form>
            ) : !challengeToken ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[11px]">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@usevode.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-[11px]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  <Lock className="w-3.5 h-3.5" />
                  {submitting ? "Signing In..." : "Sign In to Ops"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify2fa} className="space-y-3">
                <div className="p-2.5 bg-slate-100 border border-slate-300 text-xs flex items-start gap-2">
                  <KeyRound className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-700" />
                  <span>Enter the 6-digit code from your authenticator app.</span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="totp" className="text-[11px]">6-Digit Code</Label>
                  <Input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="text-center font-mono tracking-widest text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || totpCode.length !== 6}
                  className="w-full"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {submitting ? "Verifying..." : "Verify & Sign In"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setChallengeToken(null);
                    setTotpCode("");
                    setError(null);
                  }}
                  className="w-full text-center text-[11px] text-slate-500 hover:text-black cursor-pointer pt-1"
                >
                  Back to credentials
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center font-mono">
              HTTP-only cookie bound • Audit logged
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
