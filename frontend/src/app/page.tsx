"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function WelcomePage() {
  const router = useRouter();
  const { user, userProfile, loading, loginWithEmail, registerWithEmail, error, clearError } = useAuth();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "alumni">("student");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Unable to sign in. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      await registerWithEmail(email, password, name || email.split("@")[0], selectedRole);
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Unable to create the account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = error || localError;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      return;
    }

    if (!userProfile) return;

    router.push(userProfile.role === "admin" ? "/admin" : userProfile.role === "alumni" ? "/alumni" : "/student");
  }, [user, userProfile, loading, router]);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center items-center">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 hidden md:block">
        <svg height="100%" preserveAspectRatio="none" width="100%">
          <defs>
            <radialGradient cx="10%" cy="10%" fx="10%" fy="10%" id="grad-top" r="50%">
              <stop className="text-primary-fixed-dim" offset="0%" stopColor="currentColor" stopOpacity="0.3"></stop>
              <stop className="text-surface" offset="100%" stopColor="currentColor" stopOpacity="0"></stop>
            </radialGradient>
            <radialGradient cx="90%" cy="90%" fx="90%" fy="90%" id="grad-bottom" r="50%">
              <stop className="text-secondary-fixed-dim" offset="0%" stopColor="currentColor" stopOpacity="0.2"></stop>
              <stop className="text-surface" offset="100%" stopColor="currentColor" stopOpacity="0"></stop>
            </radialGradient>
          </defs>
          <rect fill="url(#grad-top)" height="100%" width="100%"></rect>
          <rect fill="url(#grad-bottom)" height="100%" width="100%"></rect>
        </svg>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 md:px-12 py-10 z-10 w-full max-w-[520px] mx-auto transition-all duration-300">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 mb-4 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center p-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-100 group-hover:scale-110 transition-transform duration-300"></div>
            <img alt="VSITR Logo" className="w-full h-full object-contain relative z-10" src="/app_logo.png" />
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface mb-2 tracking-tight">VSITR Alumni Portal</h1>
          <p className="font-body-md text-on-surface-variant max-w-[360px]">
              Sign in to continue to your dedicated dashboard.
          </p>
        </div>

        {activeError && (
          <div className="w-full mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error font-body-sm flex items-start gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
            <div className="flex-1 text-xs leading-relaxed">{activeError}</div>
            <button onClick={() => { setLocalError(null); clearError(); }} className="text-error/70 hover:text-error">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        <div className="w-full bg-surface-container-lowest rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_rgba(26,54,93,0.06)] relative overflow-hidden border border-surface-container">
          <div className="mb-6 flex rounded-full bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-all ${mode === "signin" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-all ${mode === "signup" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
            >
              Sign Up
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-5">
              <div className="relative group">
                <label htmlFor="email" className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-sm text-on-surface-variant z-10">Email Address</label>
                <input
                  required
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3.5 rounded-lg shadow-[inset_0_0_0_1px_#E2E8F0] focus:shadow-[inset_0_0_0_2px_#1a365d] focus:outline-none transition-shadow"
                />
              </div>

              <div className="relative group">
                <label htmlFor="password" className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-sm text-on-surface-variant z-10">Password</label>
                <input
                  required
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3.5 rounded-lg shadow-[inset_0_0_0_1px_#E2E8F0] focus:shadow-[inset_0_0_0_2px_#1a365d] focus:outline-none transition-shadow pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">{passwordVisible ? "visibility" : "visibility_off"}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary font-label-md py-4 rounded-lg shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-bold"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-5">
              <div className="relative group">
                <label htmlFor="signup-name" className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-sm text-on-surface-variant z-10">Full Name</label>
                <input
                  required
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3.5 rounded-lg shadow-[inset_0_0_0_1px_#E2E8F0] focus:shadow-[inset_0_0_0_2px_#1a365d] focus:outline-none transition-shadow"
                />
              </div>

              <div className="relative group">
                <label htmlFor="signup-email" className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-sm text-on-surface-variant z-10">Email Address</label>
                <input
                  required
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3.5 rounded-lg shadow-[inset_0_0_0_1px_#E2E8F0] focus:shadow-[inset_0_0_0_2px_#1a365d] focus:outline-none transition-shadow"
                />
              </div>

              <div className="relative group">
                <label htmlFor="signup-password" className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-sm text-on-surface-variant z-10">Password</label>
                <input
                  required
                  id="signup-password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password"
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3.5 rounded-lg shadow-[inset_0_0_0_1px_#E2E8F0] focus:shadow-[inset_0_0_0_2px_#1a365d] focus:outline-none transition-shadow pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">{passwordVisible ? "visibility" : "visibility_off"}</span>
                </button>
              </div>

              <div className="relative group">
                <label htmlFor="signup-role" className="block mb-1 text-xs font-semibold text-on-surface-variant">Select Your Role</label>
                <select
                  id="signup-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as "student" | "alumni")}
                  className="w-full bg-surface-container text-on-surface px-3.5 py-3 rounded-lg border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary font-label-md py-4 rounded-lg shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-bold"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-surface-container flex items-start gap-2.5 text-on-surface-variant text-xs leading-relaxed bg-surface-container-low/50 p-3 rounded-xl">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">badge</span>
            <p>
              {mode === "signin"
                ? "Your saved account role determines which dashboard opens after sign-in."
                : "Choose Student or Alumni when creating your account. Admin accounts are provisioned by an administrator."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
