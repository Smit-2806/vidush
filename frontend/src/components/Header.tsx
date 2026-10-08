"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const pageTitles: Record<string, string> = {
  "/student": "Student dashboard",
  "/alumni": "Alumni dashboard",
  "/admin": "Admin overview",
  "/directory": "Alumni directory",
  "/jobs": "Career hub",
  "/events": "University events",
  "/profile": "My profile",
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.displayName || user?.displayName || "Profile";
  const photo = userProfile?.photoURL || user?.photoURL || "";
  const title = pageTitles[pathname] || (pathname === "/home" ? "Community home" : "VSITR Alumni Portal");

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-[#dce4e6] bg-white/95 backdrop-blur lg:left-[258px]">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#213e49] hover:bg-[#edf2f3] lg:hidden"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="min-w-0">
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#657880] sm:block">VSITR Alumni Portal</p>
            <h1 className="truncate text-sm font-semibold text-[#152e38] sm:mt-0.5">{title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="block max-w-44 truncate text-xs font-semibold text-[#213e49]">{displayName}</span>
            <span className="block text-[10px] capitalize text-[#71838a]">{userProfile?.role || "Member"}</span>
          </span>
          <Link href="/profile" aria-label="Open profile" title={displayName} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#d7e1e4] bg-[#dcece8] text-sm font-bold text-[#174844]">
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : displayName.slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}