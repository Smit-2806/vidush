"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { useAuth } from "@/context/AuthContext";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navigation */}
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Sidebar Simulation for Desktop / Drawer for Mobile */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[60] cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          {/* Sidebar Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 max-w-xs bg-surface-container-lowest shadow-lg flex flex-col p-6 pt-[calc(env(safe-area-inset-top)+24px)] z-[70] animate-slide-in">
            <div className="flex items-center justify-between mb-8 border-b border-surface-variant pb-3 shrink-0">
              <h2 className="font-display text-md font-bold text-primary">Navigation</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container cursor-pointer text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {userProfile?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-primary/10 text-primary font-bold font-label-md text-left cursor-pointer w-full transition-colors active:scale-[0.98] border border-primary/20 mb-1"
                >
                  <span className="material-symbols-outlined text-primary">admin_panel_settings</span> Admin Dashboard
                </Link>
              )}
              {userProfile?.role === "alumni" && (
                <Link
                  href="/alumni"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-primary/10 text-primary font-bold font-label-md text-left cursor-pointer w-full transition-colors active:scale-[0.98] border border-primary/20 mb-1"
                >
                  <span className="material-symbols-outlined text-primary">badge</span> Alumni Dashboard
                </Link>
              )}
              <Link
                href="/home"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-surface-container font-label-md text-on-surface text-left cursor-pointer w-full transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-primary">home</span> Home
              </Link>
              <Link
                href="/directory"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-surface-container font-label-md text-on-surface text-left cursor-pointer w-full transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-primary">person_search</span> Alumni Directory
              </Link>
              <Link
                href="/jobs"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-surface-container font-label-md text-on-surface text-left cursor-pointer w-full transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-primary">work</span> Job Board
              </Link>
              <Link
                href="/events"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-surface-container font-label-md text-on-surface text-left cursor-pointer w-full transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-primary">calendar_month</span> Events
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-surface-container font-label-md text-on-surface text-left cursor-pointer w-full transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-primary">account_circle</span> My Profile
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pt-16 pb-20 max-w-[1280px] w-full mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
