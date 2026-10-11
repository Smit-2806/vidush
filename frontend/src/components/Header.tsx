"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/student":   { title: "Student Dashboard",  subtitle: "Track your career journey" },
  "/alumni":    { title: "Alumni Dashboard",   subtitle: "Manage opportunities & candidates" },
  "/admin":     { title: "Admin Overview",     subtitle: "Portal management" },
  "/directory": { title: "Alumni Directory",   subtitle: "Browse & connect with alumni" },
  "/jobs":      { title: "Career Hub",         subtitle: "Explore open positions" },
  "/events":    { title: "University Events",  subtitle: "Campus activities & networking" },
  "/profile":   { title: "My Profile",         subtitle: "Manage your portal identity" },
  "/home":      { title: "Community Home",     subtitle: "What's happening in your network" },
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const displayName = userProfile?.displayName || user?.displayName || "Profile";
  const photo = userProfile?.photoURL || user?.photoURL || "";
  const page = pageTitles[pathname] ?? { title: "VSITR Alumni Portal", subtitle: "Connect, mentor & grow" };

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 h-16 lg:left-[260px]"
      style={{
        background: "rgba(241,245,249,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(193,207,216,0.55)",
        boxShadow: "0 1px 0 rgba(15,31,46,0.04), 0 2px 16px rgba(15,31,46,0.04)",
      }}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-5 lg:px-7">
        {/* Left — hamburger + page title */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#1a4a5e] hover:bg-[#e1e8ee] active:scale-95 transition-all lg:hidden cursor-pointer"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          {/* Page info */}
          <div className="min-w-0">
            <p className="hidden text-[9.5px] font-bold uppercase tracking-[0.20em] text-[#8199a9] sm:block">
              VSITR Alumni Portal
            </p>
            <h1 className="truncate text-sm font-bold text-[#0f1f2e] sm:text-[15px] sm:mt-0.5"
                style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
              {page.title}
            </h1>
          </div>
        </div>

        {/* Right — user info + avatar */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Name + role text (hidden on small screens) */}
          <span className="hidden text-right sm:block">
            <span className="block max-w-40 truncate text-xs font-semibold text-[#0f1f2e]">
              {displayName}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#8199a9]">
              {userProfile?.role || "Member"}
            </span>
          </span>

          {/* Avatar */}
          <Link
            href="/profile"
            aria-label="Open profile"
            title={displayName}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full
              border-2 border-[#c2cfd8] bg-[#1a4a5e] text-sm font-bold text-white
              hover:ring-3 hover:ring-[#1a4a5e]/20 hover:scale-105 transition-all shadow-sm"
          >
            {photo
              ? <img src={photo} alt="" className="h-full w-full object-cover" />
              : displayName.slice(0, 1).toUpperCase()
            }
          </Link>
        </div>
      </div>
    </header>
  );
}