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
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-[#FAF9F5] bg-vode-grid relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Ambient Vode Glow matching Landing Page */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[320px] bg-gradient-to-b from-[#00D084]/18 via-[#0E63F4]/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="inline-flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Vode"
              width={36}
              height={36}
              className="rounded-lg object-contain"
            />
            <span className="font-display font-extrabold text-2xl tracking-tight text-[#090D16]">
              Vode
            </span>
            <Badge variant="info" className="ml-1">
              Ops Portal
            </Badge>
          </div>
          <p className="text-xs text-[#525B6C]">
            Double-Entry Ledger, Maker–Checker &amp; Emergency Controls
          </p>
        </div>

        <Card className="shadow-xl border-[#090D16]/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>
                  {mode === "bootstrap" ? "First-Time Admin Setup" : "Sign in to Vode Ops"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {mode === "bootstrap"
                    ? "Create the initial SUPER_ADMIN account (locks automatically after setup)."
                    : "Restricted to authorized Vode operations & finance staff."}
                </CardDescription>
              </div>
            </div>

            {!challengeToken && needsBootstrap && (
              <div className="flex gap-1.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    mode === "login"
                      ? "bg-[#090D16] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Sign In
                </button>
                {needsBootstrap && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("bootstrap");
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      mode === "bootstrap"
                        ? "bg-[#0E63F4] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Create First Admin
                  </button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {bootstrapSuccess ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Super Admin Created: {bootstrapSuccess.email}
                  </div>
                  <p className="text-emerald-800">
                    Save this 2FA Secret Key in Google Authenticator / 1Password, then sign in:
                  </p>
                  <div className="font-mono font-bold bg-white px-2.5 py-1.5 rounded border border-emerald-200 select-all">
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
              <form onSubmit={handleBootstrap} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vode Founder"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bootstrapEmail">Official Work Email</Label>
                  <Input
                    id="bootstrapEmail"
                    type="email"
                    required
                    value={bootstrapEmail}
                    onChange={(e) => setBootstrapEmail(e.target.value)}
                    placeholder="hello@usevode.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bootstrapPassword">Password (8+ characters)</Label>
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

                <Button type="submit" variant="primary" disabled={submitting} className="w-full">
                  <UserPlus className="w-4 h-4" />
                  {submitting ? "Creating Super Admin..." : "Create Super Admin"}
                </Button>
              </form>
            ) : !challengeToken ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@usevode.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
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
                  <Lock className="w-4 h-4" />
                  {submitting ? "Authenticating..." : "Sign In to Ops"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify2fa} className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-[#0E63F4]" />
                  <span>
                    Enter the 6-digit code from your authenticator app to complete 2FA.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="totp">6-Digit Authenticator Code</Label>
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
                    className="text-center text-lg font-mono tracking-[0.35em]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || totpCode.length !== 6}
                  className="w-full"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {submitting ? "Verifying..." : "Verify & Enter"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setChallengeToken(null);
                    setTotpCode("");
                    setError(null);
                  }}
                  className="w-full text-xs text-[#525B6C] hover:text-[#090D16] cursor-pointer"
                >
                  Back to email &amp; password
                </button>
              </form>
            )}

            <div className="pt-3 border-t border-slate-100 text-[11px] text-[#525B6C] text-center">
              All sessions are HTTP-only cookie bound and recorded in the Audit Log.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
