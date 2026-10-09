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
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-[#e2e8ea] bg-white/85 backdrop-blur-md lg:left-[258px] transition-all">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#213e49] hover:bg-[#edf2f3] active:scale-95 transition-all lg:hidden cursor-pointer"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="min-w-0">
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-[#657880] sm:block">
              VSITR Alumni Portal
            </p>
            <h1 className="truncate text-sm sm:text-base font-bold text-[#112a32] sm:mt-0.5 tracking-tight">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="block max-w-44 truncate text-xs font-bold text-[#1d3c45]">{displayName}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6b828a]">{userProfile?.role || "Member"}</span>
          </span>
          <Link
            href="/profile"
            aria-label="Open profile"
            title={displayName}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#d5e2e4] bg-[#dcece7] text-sm font-bold text-[#174844] hover:ring-2 hover:ring-[#205b55]/30 hover:scale-105 transition-all shadow-xs"
          >
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : displayName.slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}