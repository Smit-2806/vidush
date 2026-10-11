"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useAuth } from "@/context/AuthContext";
import { uploadPhotoViaApi } from "@/lib/api";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("This file is not a valid image."));
      image.onload = () => {
        const scale = Math.min(1, 480 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Image processing is unavailable."));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

const dashboardLinks = {
  admin: { href: "/admin", label: "Admin workspace", icon: "admin_panel_settings" },
  alumni: { href: "/alumni", label: "Alumni workspace", icon: "work_history" },
  student: { href: "/student", label: "Student workspace", icon: "school" },
} as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading, updateUserProfilePhoto, updateUserProfileDetails, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Community member";
  const email = userProfile?.email || user?.email || "";
  const role = userProfile?.role || "student";
  const photoURL = userProfile?.photoURL || user?.photoURL || "";
  const workspace = dashboardLinks[role];

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setIsSaving(true);
    setNotice(null);
    try {
      await updateUserProfileDetails({
        displayName: String(data.get("displayName") || "").trim(),
        department: String(data.get("department") || "").trim(),
        classYear: String(data.get("classYear") || "").trim(),
        company: String(data.get("company") || "").trim(),
        bio: String(data.get("bio") || "").trim(),
      });
      setNotice({ type: "success", message: "Profile saved." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Could not save your profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const changePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", message: "Select an image file such as JPG, PNG, or WebP." });
      return;
    }
    setIsUploading(true);
    setNotice(null);
    try {
      const compressed = await compressImage(file);
      const hostedURL = await uploadPhotoViaApi(compressed);
      await updateUserProfilePhoto(hostedURL || compressed);
      setNotice({ type: "success", message: "Profile photo updated." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Could not update your photo." });
    } finally {
      setIsUploading(false);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace("/");
  };

  if (loading || !userProfile) {
    return (
      <LayoutWrapper>
        <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#4a6072]">
          <div className="spinner" />
          <span className="text-sm">Loading your profile…</span>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-[1200px] space-y-6">

        {/* Hero header */}
        <header className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
                style={{ background: "linear-gradient(135deg, #0d2233 0%, #1a4a5e 100%)" }}>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 pointer-events-none"
               style={{ background: "radial-gradient(circle, #60c4e8 0%, transparent 70%)" }} />
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-2xl text-3xl font-bold text-white ring-4 ring-white/20"
                   style={{ background: "linear-gradient(135deg, #1e6080 0%, #0f766e 100%)" }}>
                {photoURL
                  ? <img src={photoURL} alt={displayName} className="h-full w-full object-cover rounded-2xl" />
                  : displayName.slice(0, 1).toUpperCase()}
              </div>
              <label htmlFor="profile-photo"
                     className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-[#1a4a5e] shadow-md hover:scale-110 transition-transform"
                     title={isUploading ? "Uploading…" : "Change photo"}>
                <span className="material-symbols-outlined text-[16px]">{isUploading ? "sync" : "photo_camera"}</span>
              </label>
              <input id="profile-photo" type="file" accept="image/*" disabled={isUploading} onChange={changePhoto} className="sr-only" />
            </div>

            {/* Name + info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white"
                    style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>{displayName}</h1>
                <span className="badge" style={{ background: "rgba(96,196,232,0.15)", color: "#60c4e8", border: "1px solid rgba(96,196,232,0.25)" }}>
                  <span className="material-symbols-outlined text-[11px]">{workspace.icon}</span>
                  {role}
                </span>
              </div>
              <p className="text-sm text-white/60 mb-2">{email}</p>
              <p className="text-xs text-white/40">
                {[userProfile.classYear, userProfile.department, userProfile.company].filter(Boolean).join(" · ") || "Add your details below"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href={workspace.href}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-xs font-semibold cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                {workspace.label}
              </Link>
            </div>
          </div>
        </header>

        {/* Notice */}
        {notice && (
          <div role="status" className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm animate-fade-in ${
            notice.type === "success"
              ? "bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]"
              : "bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]"
          }`}>
            <span className="material-symbols-outlined text-[18px]">{notice.type === "success" ? "check_circle" : "error"}</span>
            {notice.message}
          </div>
        )}

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.7fr)]">

          {/* Profile form */}
          <section aria-labelledby="profile-details-heading" className="card p-6">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8199a9]">Personal Information</p>
              <h2 id="profile-details-heading" className="mt-1 text-lg font-bold text-[#0f1f2e]"
                  style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>Profile Details</h2>
            </div>
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pf-name" className="text-xs font-semibold text-[#1e3a4a]">Full Name</label>
                  <input id="pf-name" name="displayName" required defaultValue={displayName}
                    className="input" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1e3a4a]">Email Address</label>
                  <input value={email} readOnly
                    className="input" style={{ background: "#f1f5f9", color: "#8199a9" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pf-dept" className="text-xs font-semibold text-[#1e3a4a]">Department / Major</label>
                  <input id="pf-dept" name="department" defaultValue={userProfile.department || ""}
                    placeholder="e.g. Computer Engineering" className="input" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pf-year" className="text-xs font-semibold text-[#1e3a4a]">Class Year / Batch</label>
                  <input id="pf-year" name="classYear" defaultValue={role === "admin" ? "Administration" : userProfile.classYear || ""}
                    placeholder="e.g. 2027" className="input" />
                </div>
                {role !== "student" && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="pf-company" className="text-xs font-semibold text-[#1e3a4a]">Company / Organization</label>
                    <input id="pf-company" name="company" defaultValue={userProfile.company || ""}
                      placeholder="e.g. TCS, Infosys…" className="input" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pf-bio" className="text-xs font-semibold text-[#1e3a4a]">About You</label>
                <textarea id="pf-bio" name="bio" rows={5} defaultValue={userProfile.bio || ""} maxLength={500}
                  placeholder="Share a short introduction with your community…"
                  className="input h-auto resize-y py-3 leading-relaxed" />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-4" style={{ borderTop: "1px solid #e1e8ee" }}>
                <button type="submit" disabled={isSaving}
                        className="btn btn-primary text-sm disabled:opacity-60">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {isSaving ? "Saving…" : "Save Profile"}
                </button>
                <span className="text-xs text-[#8199a9]">Role and email are managed by the portal.</span>
              </div>
            </form>
          </section>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Access details */}
            <section className="card p-5">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8199a9]">Account</p>
                <h2 className="mt-1 text-base font-bold text-[#0f1f2e]"
                    style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>Access Details</h2>
              </div>
              <dl className="space-y-0" style={{ borderTop: "1px solid #f1f5f9" }}>
                {[
                  { label: "Account type", value: <span className="capitalize font-semibold text-[#0f1f2e]">{role}</span> },
                  { label: "Email status",
                    value: (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#059669]">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        {user?.emailVerified || role === "admin" ? "Verified" : "Active"}
                      </span>
                    )
                  },
                  { label: "Workspace", value: <span className="font-semibold text-[#0f1f2e] text-right">{workspace.label}</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 py-3 text-xs"
                       style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <dt className="text-[#8199a9]">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Security */}
            <section className="card p-5">
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8199a9]">Session</p>
                <h2 className="mt-1 text-base font-bold text-[#0f1f2e]"
                    style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>Account Security</h2>
              </div>
              <p className="text-xs leading-relaxed text-[#8199a9] mb-4">
                Sign out when using a shared or public device to keep your account secure.
              </p>
              <button type="button" onClick={() => void signOut()}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-xs font-semibold cursor-pointer transition-all"
                      style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign Out
              </button>
            </section>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}