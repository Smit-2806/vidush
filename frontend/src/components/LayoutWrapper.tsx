"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { useAuth } from "@/context/AuthContext";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const roleHomes = {
  admin: "/admin",
  alumni: "/alumni",
  student: "/student",
} as const;

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const role = userProfile?.role || "student";
  const dashboardPath = roleHomes[role];
  const dashboardLabel = role === "admin" ? "Member management" : role === "alumni" ? "Alumni dashboard" : "Student dashboard";
  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Portal member";
  const navItems = [
    { label: dashboardLabel, href: dashboardPath, icon: role === "admin" ? "space_dashboard" : role === "alumni" ? "work_history" : "school", visible: true },
    { label: "Alumni hiring", href: "/alumni", icon: "groups", visible: role === "admin" },
    { label: "Directory", href: "/directory", icon: "people_alt", visible: true },
    { label: "Job board", href: "/jobs", icon: "work_outline", visible: true },
    { label: "Events", href: "/events", icon: "event", visible: true },
    { label: "My profile", href: "/profile", icon: "account_circle", visible: true },
  ].filter((item) => item.visible);

  const navigation = (mobile = false) => (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== dashboardPath && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            onClick={mobile ? () => setIsSidebarOpen(false) : undefined}
            aria-current={isActive ? "page" : undefined}
            className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
              isActive
                ? "bg-[#dcece7] font-semibold text-[#173d39]"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className={`material-symbols-outlined text-[19px] ${isActive ? "text-[#205b55]" : "text-white/60 group-hover:text-white"}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (mobile = false) => (
    <>
      <Link href={dashboardPath} className="flex items-center gap-3 px-1 py-1" onClick={mobile ? () => setIsSidebarOpen(false) : undefined}>
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5">
          <img src="/app_logo.png" alt="VSITR" className="h-full w-full object-contain" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold tracking-wide text-white">VSITR</span>
          <span className="block text-[11px] text-white/55">Alumni network</span>
        </span>
      </Link>

      <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        Workspace
      </div>
      <div className="mt-2">{navigation(mobile)}</div>

      <div className="mt-auto flex min-w-0 items-center gap-2 border-t border-white/10 pt-4">
        <Link href="/profile" onClick={mobile ? () => setIsSidebarOpen(false) : undefined} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 hover:bg-white/10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#b9ddd5] text-sm font-bold text-[#143d3d]">
            {userProfile?.photoURL || user?.photoURL ? (
              <img src={userProfile?.photoURL || user?.photoURL || ""} alt="" className="h-full w-full object-cover" />
            ) : displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-white">{displayName}</span>
            <span className="block text-[10px] capitalize text-white/50">{role}</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => void logout()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f3f6f7] text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] flex-col bg-[#112a32] px-4 py-5 lg:flex">
        {sidebarContent()}
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button className="absolute inset-0 cursor-default bg-black/45" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative flex h-full w-[min(290px,85vw)] flex-col bg-[#112a32] px-4 py-5 shadow-2xl animate-slide-in">
            <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-white/70 hover:bg-white/10" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
      <main className="min-h-screen pt-16 pb-24 lg:pb-8 lg:ml-[258px]">
        <div className="mx-auto w-full max-w-[1580px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}