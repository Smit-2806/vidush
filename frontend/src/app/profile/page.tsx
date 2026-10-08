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
        <div className="flex min-h-[55vh] items-center justify-center"><span className="material-symbols-outlined animate-spin text-3xl text-[#24635d]">progress_activity</span></div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-[1320px] space-y-8">
        <header className="border-b border-[#d9e2e3] pb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#54766f]">Account <span className="px-1.5 text-[#a1b2b0]">/</span> Profile</p>
          <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#142f38] sm:text-4xl">Your profile</h1>
          <p className="mt-2 text-sm text-[#63777d]">Keep your community details current and recognizable.</p>
        </header>

        {notice && <div role="status" className={`flex items-center gap-2 border-l-2 px-4 py-3 text-sm ${notice.type === "success" ? "border-[#368d75] bg-[#e9f3ee] text-[#27614f]" : "border-[#bd6558] bg-[#fbefed] text-[#8d4039]"}`}><span className="material-symbols-outlined text-[18px]">{notice.type === "success" ? "check_circle" : "error"}</span>{notice.message}</div>}

        <section className="grid gap-5 border-b border-[#d9e2e3] pb-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#dcebe5] text-3xl font-semibold text-[#27564e] ring-4 ring-white">
            {photoURL ? <img src={photoURL} alt={displayName} className="h-full w-full object-cover" /> : displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-semibold tracking-tight text-[#17343b]">{displayName}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e4eeeb] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#28594f]"><span className="material-symbols-outlined text-[14px]">{workspace.icon}</span>{role}</span>
            </div>
            <p className="mt-1 truncate text-sm text-[#63777d]">{email}</p>
            <p className="mt-1 text-xs text-[#819095]">{[userProfile.classYear, userProfile.department, userProfile.company].filter(Boolean).join(" · ") || "Add your study and career details below."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label htmlFor="profile-photo" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-[#cbd8d9] px-3.5 text-xs font-semibold text-[#24444b] transition hover:bg-white"><span className="material-symbols-outlined text-[17px]">photo_camera</span>{isUploading ? "Uploading…" : "Change photo"}</label>
            <input id="profile-photo" type="file" accept="image/*" disabled={isUploading} onChange={changePhoto} className="sr-only" />
            <Link href={workspace.href} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#173c42] px-3.5 text-xs font-semibold text-white transition hover:bg-[#21525a]"><span className="material-symbols-outlined text-[17px]">arrow_back</span>{workspace.label}</Link>
          </div>
        </section>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
          <section aria-labelledby="profile-details-heading">
            <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Personal information</p><h2 id="profile-details-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#172f38]">Profile details</h2></div>
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-[#52696f]">Full name<input name="displayName" required defaultValue={displayName} className="mt-1.5 min-h-11 w-full rounded-md border border-[#ccd8d9] bg-white px-3 text-sm text-[#17343b] outline-none focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20" /></label>
                <label className="block text-xs font-semibold text-[#52696f]">Email address<input value={email} readOnly className="mt-1.5 min-h-11 w-full rounded-md border border-[#d9e2e3] bg-[#edf2f2] px-3 text-sm text-[#6c7d81] outline-none" /></label>
                <label className="block text-xs font-semibold text-[#52696f]">Department / major<input name="department" defaultValue={userProfile.department || ""} placeholder="e.g. Computer Engineering" className="mt-1.5 min-h-11 w-full rounded-md border border-[#ccd8d9] bg-white px-3 text-sm text-[#17343b] outline-none focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20" /></label>
                <label className="block text-xs font-semibold text-[#52696f]">Class year / batch<input name="classYear" defaultValue={role === "admin" ? "Administration" : userProfile.classYear || ""} placeholder="e.g. 2027" className="mt-1.5 min-h-11 w-full rounded-md border border-[#ccd8d9] bg-white px-3 text-sm text-[#17343b] outline-none focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20" /></label>
                {role !== "student" && <label className="block text-xs font-semibold text-[#52696f] sm:col-span-2">Company / organization<input name="company" defaultValue={userProfile.company || ""} placeholder="e.g. TCS" className="mt-1.5 min-h-11 w-full rounded-md border border-[#ccd8d9] bg-white px-3 text-sm text-[#17343b] outline-none focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20" /></label>}
              </div>
              <label className="block text-xs font-semibold text-[#52696f]">About you<textarea name="bio" rows={5} defaultValue={userProfile.bio || ""} maxLength={500} placeholder="Share a short introduction with your community." className="mt-1.5 w-full resize-y rounded-md border border-[#ccd8d9] bg-white px-3 py-2.5 text-sm leading-relaxed text-[#17343b] outline-none focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20" /></label>
              <div className="flex flex-wrap items-center gap-3 border-t border-[#d9e2e3] pt-5">
                <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#173c42] px-5 text-sm font-semibold text-white transition hover:bg-[#21525a] disabled:opacity-60"><span className="material-symbols-outlined text-[18px]">save</span>{isSaving ? "Saving…" : "Save profile"}</button>
                <span className="text-xs text-[#829196]">Your role and email are managed by the portal.</span>
              </div>
            </form>
          </section>

          <aside className="space-y-7">
            <section className="border-t-2 border-[#235a57] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Account</p><h2 className="mt-1 text-lg font-semibold text-[#172f38]">Access details</h2>
              <dl className="mt-4 divide-y divide-[#dfe7e7] border-y border-[#d9e2e3]">
                <div className="flex items-center justify-between gap-3 py-3"><dt className="text-xs text-[#718287]">Account type</dt><dd className="text-xs font-semibold capitalize text-[#244b4e]">{role}</dd></div>
                <div className="flex items-center justify-between gap-3 py-3"><dt className="text-xs text-[#718287]">Email status</dt><dd className="inline-flex items-center gap-1 text-xs font-semibold text-[#287359]"><span className="material-symbols-outlined text-[15px]">verified</span>{user?.emailVerified || role === "admin" ? "Verified" : "Active"}</dd></div>
                <div className="flex items-start justify-between gap-3 py-3"><dt className="text-xs text-[#718287]">Workspace</dt><dd className="text-right text-xs font-semibold text-[#244b4e]">{workspace.label}</dd></div>
              </dl>
            </section>
            <section className="border-t border-[#d9e2e3] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Session</p><h2 className="mt-1 text-lg font-semibold text-[#172f38]">Account security</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#718287]">Sign out when you finish using a shared or public device.</p>
              <button type="button" onClick={() => void signOut()} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#d6b9b4] px-3.5 text-xs font-semibold text-[#984c43] transition hover:bg-[#fbefed]"><span className="material-symbols-outlined text-[17px]">logout</span>Sign out</button>
            </section>
          </aside>
        </div>
      </div>
    </LayoutWrapper>
  );
}