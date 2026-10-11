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
  admin:   "/admin",
  alumni:  "/alumni",
  student: "/student",
} as const;

const navIconMap: Record<string, string> = {
  admin:   "space_dashboard",
  alumni:  "work_history",
  student: "school",
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const role = userProfile?.role || "student";
  const dashboardPath = roleHomes[role as keyof typeof roleHomes] ?? "/student";
  const dashboardLabel =
    role === "admin" ? "Member management"
    : role === "alumni" ? "Alumni dashboard"
    : "Student dashboard";
  const displayName =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Portal member";

  const navItems = [
    {
      label: dashboardLabel,
      href: dashboardPath,
      icon: navIconMap[role] ?? "school",
      visible: true,
    },
    { label: "Alumni hiring", href: "/alumni", icon: "groups",         visible: role === "admin" },
    { label: "Directory",     href: "/directory", icon: "people_alt",  visible: true },
    { label: "Job board",     href: "/jobs",      icon: "work_outline", visible: true },
    { label: "Events",        href: "/events",    icon: "event",        visible: true },
    { label: "My profile",    href: "/profile",   icon: "account_circle", visible: true },
  ].filter((item) => item.visible);

  const isActive = (href: string) =>
    pathname === href || (href !== dashboardPath && pathname.startsWith(`${href}/`));

  const closeSidebar = () => setIsSidebarOpen(false);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav aria-label="Main navigation" className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            onClick={mobile ? closeSidebar : undefined}
            aria-current={active ? "page" : undefined}
            className={`
              group flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-sm font-medium
              transition-all duration-150
              ${active
                ? "bg-[rgba(255,255,255,0.12)] text-white shadow-sm"
                : "text-[#8aafc4] hover:bg-[rgba(255,255,255,0.07)] hover:text-white"
              }
            `}
          >
            <span
              className={`
                material-symbols-outlined text-[20px] shrink-0 transition-colors
                ${active ? "text-[#60c4e8]" : "text-[#5a8aa0] group-hover:text-[#a0c8de]"}
              `}
            >
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#60c4e8] shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href={dashboardPath}
        onClick={mobile ? closeSidebar : undefined}
        className="flex items-center gap-3 px-1 py-1 mb-6 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1.5 ring-1 ring-white/20">
          <img src="/app_logo.png" alt="VSITR" className="h-full w-full object-contain" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold tracking-wide text-white leading-tight">VSITR</span>
          <span className="block text-[11px] text-[#5a8aa0] leading-tight mt-0.5">Alumni Network</span>
        </span>
      </Link>

      {/* Section label */}
      <div className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#3d6070]">
        Workspace
      </div>

      {/* Nav */}
      <NavLinks mobile={mobile} />

      {/* Spacer */}
      <div className="mt-auto" />

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* User row */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/profile"
          onClick={mobile ? closeSidebar : undefined}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-2 hover:bg-white/07 transition-colors group"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1e6080] text-sm font-bold text-white ring-2 ring-white/10">
            {userProfile?.photoURL || user?.photoURL ? (
              <img
                src={userProfile?.photoURL || user?.photoURL || ""}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-white group-hover:text-[#60c4e8] transition-colors">
              {displayName}
            </span>
            <span className="block text-[10px] capitalize text-[#5a8aa0]">{role}</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => void logout()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5a8aa0] hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f1f5f9" }}>
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[260px] lg:flex flex-col px-4 py-5"
        style={{ background: "#0d2233" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          {/* Backdrop */}
          <button
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={closeSidebar}
          />
          {/* Drawer */}
          <aside
            className="relative flex h-full w-[min(280px,85vw)] flex-col px-4 py-5 shadow-2xl animate-slide-in"
            style={{ background: "#0d2233" }}
          >
            <button
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 transition-colors"
              aria-label="Close navigation"
              onClick={closeSidebar}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Header */}
      <Header onToggleSidebar={() => setIsSidebarOpen(true)} />

      {/* Main content */}
      <main className="min-h-screen pt-16 pb-24 lg:pb-8 lg:ml-[260px]">
        <div className="mx-auto w-full max-w-[1580px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 page-enter">
          {children}
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <BottomNav />
    </div>
  );
}