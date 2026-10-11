"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Role = "student" | "alumni";

export default function AuthenticationPage() {
  const router = useRouter();
  const { user, userProfile, loginWithEmail, registerWithEmail, resetPassword, resendVerification, logout, error, clearError } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const update = (key: string, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const fail = (value: unknown) => setMessage(value instanceof Error ? value.message : "Something went wrong.");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); clearError();
    try {
      if (forgot) { await resetPassword(email); setMessage("Password reset email sent."); setForgot(false); return; }
      if (mode === "register") {
        await registerWithEmail(email, password, name, role, fields);
        setMessage("Registration submitted. Verify your email, then wait for admin approval.");
        setMode("login");
      } else {
        await loginWithEmail(email, password);
        router.push(role === "alumni" ? "/alumni" : "/student");
      }
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  const input = "input";
  return <main className="min-h-screen bg-[#0d2233] px-4 py-10 text-on-surface">
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-2">
      <section className="hidden text-white lg:block"><p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#8de2d7]">VSITR Alumni Portal</p><h1 className="max-w-xl text-5xl font-bold leading-tight">Your academic community, thoughtfully connected.</h1><p className="mt-6 max-w-lg text-lg text-[#c8dce8]">Create an account, verify your email, and let the administration review your registration before access is granted.</p><div className="mt-10 grid gap-3 text-sm text-[#c8dce8]"><p>✓ Firebase identity verification</p><p>✓ Student and Alumni registration review</p><p>✓ Approval-gated portal access</p></div></section>
      <section className="rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
        <div className="mb-7"><p className="text-sm font-semibold text-secondary">Secure access</p><h2 className="mt-1 text-3xl font-bold">{forgot ? "Reset password" : mode === "login" ? "Welcome back" : `Register as ${role === "student" ? "a Student" : "an Alumni"}`}</h2></div>
        {!forgot && <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-1"><button type="button" onClick={() => setRole("student")} className={`rounded-lg py-2 text-sm font-semibold ${role === "student" ? "bg-white shadow" : "text-on-surface-variant"}`}>Student</button><button type="button" onClick={() => setRole("alumni")} className={`rounded-lg py-2 text-sm font-semibold ${role === "alumni" ? "bg-white shadow" : "text-on-surface-variant"}`}>Alumni</button></div>}
        {(error || message) && <div className={`mb-4 rounded-xl p-3 text-sm ${error ? "bg-error-container text-error" : "bg-success-container text-success"}`}>{error || message}</div>}
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && !forgot && <label className="block text-sm font-semibold">Full name<input className={input + " mt-1"} required value={name} onChange={(e) => setName(e.target.value)} /></label>}
          <label className="block text-sm font-semibold">{role === "student" ? "College email" : "Personal email"}<input className={input + " mt-1"} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {!forgot && <label className="block text-sm font-semibold">Password<input className={input + " mt-1"} type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
          {mode === "register" && role === "student" && <><Field label="Enrollment number" name="enrollmentNumber" update={update}/><Field label="Department" name="department" update={update}/><Field label="Degree / course" name="degree" update={update}/></>}
          {mode === "register" && role === "alumni" && <><Field label="Phone number" name="phone" update={update}/><Field label="Enrollment number" name="enrollmentNumber" update={update}/><Field label="Department" name="department" update={update}/><Field label="Degree / course" name="degree" update={update}/><Field label="Graduation year" name="graduationYear" update={update}/><Field label="Current professional status" name="professionalStatus" update={update}/></>}
          <button disabled={busy} className="btn btn-primary w-full">{busy ? "Please wait…" : forgot ? "Send reset email" : mode === "login" ? "Sign in" : "Submit registration"}</button>
        </form>
        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-secondary"><button type="button" onClick={() => { setForgot(!forgot); setMessage(""); }}> {forgot ? "Back to login" : "Forgot password?"}</button>{!forgot && <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "Create an account" : "Already registered? Sign in"}</button>}</div>
        {user && <div className="mt-5 border-t pt-4 text-center text-sm"><button type="button" onClick={() => logout()} className="text-error">Sign out</button>{userProfile?.emailVerified === false && <button type="button" onClick={() => resendVerification()} className="ml-4 text-secondary">Resend verification</button>}</div>}
        <p className="mt-6 text-center text-xs text-on-surface-variant">Administrator? Use the controlled <a href="/admin" className="font-semibold text-secondary">Admin Login</a>.</p>
      </section>
    </div>
  </main>;
}

function Field({ label, name, update }: { label: string; name: string; update: (key: string, value: string) => void }) {
  return <label className="block text-sm font-semibold">{label}<input className="input mt-1" required onChange={(e) => update(name, e.target.value)} /></label>;
}
