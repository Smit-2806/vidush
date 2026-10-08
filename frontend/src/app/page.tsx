"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function WelcomePage() {
  const router = useRouter();
  const { user, userProfile, loginWithEmail, error, clearError } = useAuth();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Auto redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (userProfile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/home");
      }
    }
  }, [user, userProfile, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setIsSubmitting(true);

    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.log("Login attempt error caught");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = error || localError;

  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center items-center">
      {/* Ambient Background SVGs */}
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

      <div className="flex-1 flex flex-col justify-center items-center px-4 md:px-12 py-10 z-10 w-full max-w-[480px] mx-auto transition-all duration-300">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 mb-4 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center p-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-100 group-hover:scale-110 transition-transform duration-300"></div>
            <img
              alt="VSITR Logo"
              className="w-full h-full object-contain relative z-10"
              src="/app_logo.png"
            />
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface mb-2 tracking-tight">
            VSITR Alumni Portal
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-[340px]">
            Sign in to access your student, alumni, or administrator account.
          </p>
        </div>

        {/* Error Alert Box */}
        {activeError && (
          <div className="w-full mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error font-body-sm flex items-start gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
            <div className="flex-1 text-xs leading-relaxed">{activeError}</div>
            <button onClick={() => { setLocalError(null); clearError(); }} className="text-error/70 hover:text-error">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Sign In Card */}
        <div className="w-full bg-surface-container-lowest rounded-2xl p-6 md:p-10 shadow-[0_4px_24px_rgba(26,54,93,0.06)] relative overflow-hidden border border-surface-container">
          <div className="mb-6">
            <h2 className="font-headline-md text-on-surface font-bold text-xl">Sign In</h2>
            <p className="font-body-sm text-on-surface-variant text-xs mt-1">
              Enter your credentials to continue to the portal
            </p>
          </div>

          <form onSubmit={handleSignIn} className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div className="relative group">
                <label
                  className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors z-10"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  required
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3.5 rounded-lg shadow-[inset_0_0_0_1px_#E2E8F0] focus:shadow-[inset_0_0_0_2px_#1a365d] focus:outline-none transition-shadow"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <label
                  className="absolute -top-2 left-3 bg-surface-container-lowest px-1 font-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors z-10"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  required
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md px-4 py-3.5 rounded-lg shadow-[inset_0_0_0_1px_#E2E8F0] focus:shadow-[inset_0_0_0_2px_#1a365d] focus:outline-none transition-shadow pr-10"
                  id="password"
                  placeholder="••••••••"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {passwordVisible ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>

              <div className="flex justify-between items-center mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    defaultChecked
                    className="w-4 h-4 rounded-sm text-primary focus:ring-primary/20 accent-primary shadow-[inset_0_0_0_1px_#E2E8F0]"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors text-xs">
                    Remember me
                  </span>
                </label>
                <a className="font-label-sm text-primary hover:text-primary-container transition-colors text-xs" href="#">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary font-label-md py-4 rounded-lg mt-2 shadow-sm hover:shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 font-bold"
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Notice about sign up being restricted to administrator */}
          <div className="mt-6 pt-5 border-t border-surface-container flex items-start gap-2.5 text-on-surface-variant text-xs leading-relaxed bg-surface-container-low/50 p-3 rounded-xl">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
              admin_panel_settings
            </span>
            <p>
              Account registration is managed by portal administrators. Please contact your administrator if you need your student or alumni login credentials.
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center gap-6 font-label-sm text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity text-xs">
          <span>VSITR Academic Network</span>
          <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
          <span>Secure Authentication</span>
        </div>
      </div>
    </main>
  );
}
