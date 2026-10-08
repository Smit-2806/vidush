"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, userProfile } = useAuth();

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";
  const userPhoto = userProfile?.photoURL || user?.photoURL || "";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,32,69,0.05)] pt-safe">
      <div className="max-w-[1280px] mx-auto h-16 px-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="w-11 h-11 flex items-center justify-center text-primary rounded-full hover:bg-surface-container transition-colors active:scale-95 cursor-pointer"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <Link href="/home" className="flex items-center gap-2">
            <div className="h-8 w-auto flex items-center gap-2 font-display text-lg font-bold text-primary animate-fade-in">
              <div className="w-7 h-7 rounded bg-surface-container-lowest shadow-sm flex items-center justify-center p-0.5 overflow-hidden border border-surface-variant/30">
                <img
                  alt="VSITR Logo"
                  className="w-full h-full object-contain"
                  src="/app_logo.png"
                />
              </div>
              <span>VSITR</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          {userProfile?.role === "admin" && (
            <Link
              href="/admin"
              className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          )}
          {userProfile?.role === "alumni" && (
            <Link
              href="/alumni"
              className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span className="hidden sm:inline">Alumni Dashboard</span>
            </Link>
          )}
          <Link href="/profile" title={displayName}>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer text-on-primary font-bold text-sm shadow-sm overflow-hidden">
              {userPhoto ? (
                <img src={userPhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
