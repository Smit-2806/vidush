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
    <main className="min-h-screen bg-[#f3f7f6] relative flex flex-col justify-center items-center px-4 py-8 sm:py-12 overflow-hidden selection:bg-[#dcece7] selection:text-[#173d39]">
      {/* Subtle ambient light accents */}
      <div className="absolute -top-36 -left-36 w-96 h-96 bg-[#d8eae5]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-96 h-96 bg-[#dfeaf0]/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[480px] mx-auto flex flex-col items-center">
        {/* Header branding */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="w-18 h-18 sm:w-20 sm:h-20 mb-3.5 rounded-2xl bg-white shadow-[0_8px_24px_-6px_rgba(20,50,55,0.08)] border border-[#e2eaec] flex items-center justify-center p-2.5 transition-transform duration-300 hover:scale-105">
            <img alt="VSITR Logo" className="w-full h-full object-contain" src="/app_logo.png" />
          </div>
          <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#61777d] mb-1">
            Vishwabharati Institute of Technology
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112a32] tracking-tight">
            Alumni Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#5d737a] mt-1.5 max-w-[340px]">
            Connect, mentor, and grow with your academic community.
          </p>
        </div>

        {activeError && (
          <div className="w-full mb-4 p-3.5 bg-red-50/90 border border-red-200/80 rounded-2xl text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in shadow-xs">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-red-600">error</span>
            <div className="flex-1 leading-relaxed">{activeError}</div>
            <button
              type="button"
              onClick={() => { setLocalError(null); clearError(); }}
              className="text-red-500 hover:text-red-700 transition-colors p-0.5"
              aria-label="Dismiss error"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Main card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_16px_40px_-12px_rgba(17,42,50,0.08)] border border-[#e2e8ea]">
          {/* Segmented Tab Switcher */}
          <div className="mb-6 grid grid-cols-2 p-1 rounded-2xl bg-[#edf3f3] border border-[#e2ecea]">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center ${
                mode === "signin"
                  ? "bg-[#1d524d] text-white shadow-sm"
                  : "text-[#526a70] hover:text-[#173d39]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center ${
                mode === "signup"
                  ? "bg-[#1d524d] text-white shadow-sm"
                  : "text-[#526a70] hover:text-[#173d39]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4 sm:gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-[#304850]">
                  Email Address
                </label>
                <input
                  required
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 bg-[#fafcfc] text-[#142e36] text-sm px-4 rounded-xl border border-[#d6e2e4] focus:bg-white focus:border-[#205b55] focus:ring-3 focus:ring-[#205b55]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-[#304850]">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 bg-[#fafcfc] text-[#142e36] text-sm px-4 pr-11 rounded-xl border border-[#d6e2e4] focus:bg-white focus:border-[#205b55] focus:ring-3 focus:ring-[#205b55]/15 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-[#698188] hover:text-[#1d524d] transition-colors cursor-pointer rounded-lg"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {passwordVisible ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 h-12 bg-[#1d524d] hover:bg-[#153f3b] text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4 sm:gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-name" className="text-xs font-semibold text-[#304850]">
                  Full Name
                </label>
                <input
                  required
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-12 bg-[#fafcfc] text-[#142e36] text-sm px-4 rounded-xl border border-[#d6e2e4] focus:bg-white focus:border-[#205b55] focus:ring-3 focus:ring-[#205b55]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-email" className="text-xs font-semibold text-[#304850]">
                  Email Address
                </label>
                <input
                  required
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 bg-[#fafcfc] text-[#142e36] text-sm px-4 rounded-xl border border-[#d6e2e4] focus:bg-white focus:border-[#205b55] focus:ring-3 focus:ring-[#205b55]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-password" className="text-xs font-semibold text-[#304850]">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    id="signup-password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full h-12 bg-[#fafcfc] text-[#142e36] text-sm px-4 pr-11 rounded-xl border border-[#d6e2e4] focus:bg-white focus:border-[#205b55] focus:ring-3 focus:ring-[#205b55]/15 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-[#698188] hover:text-[#1d524d] transition-colors cursor-pointer rounded-lg"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {passwordVisible ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-role" className="text-xs font-semibold text-[#304850]">
                  Select Your Role
                </label>
                <div className="relative">
                  <select
                    id="signup-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as "student" | "alumni")}
                    className="w-full h-12 bg-[#fafcfc] text-[#142e36] text-sm px-4 pr-10 rounded-xl border border-[#d6e2e4] focus:bg-white focus:border-[#205b55] focus:ring-3 focus:ring-[#205b55]/15 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="alumni">Alumni</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#698188] text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 h-12 bg-[#1d524d] hover:bg-[#153f3b] text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          )}

          {/* Footer role helper */}
          <div className="mt-6 pt-4 border-t border-[#edf2f3] flex items-start gap-2.5 text-[#546d74] text-xs leading-relaxed bg-[#f6faf9] p-3.5 rounded-2xl border border-[#e4eeec]">
            <span className="material-symbols-outlined text-[18px] text-[#205b55] shrink-0 mt-0.5">
              badge
            </span>
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
