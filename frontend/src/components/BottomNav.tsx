"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Home",      path: "/home",      icon: "home" },
  { name: "Directory", path: "/directory", icon: "person_search" },
  { name: "Jobs",      path: "/jobs",      icon: "work" },
  { name: "Events",    path: "/events",    icon: "calendar_month" },
  { name: "Profile",   path: "/profile",   icon: "account_circle" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  // Show dashboard shortcut on mobile for logged-in users
  const dashPath =
    role === "admin" ? "/admin" : role === "alumni" ? "/alumni" : "/student";
  const dashIcon =
    role === "admin" ? "space_dashboard" : role === "alumni" ? "work_history" : "school";

  const items = [
    { name: "Dash",      path: dashPath,     icon: dashIcon },
    { name: "Directory", path: "/directory", icon: "person_search" },
    { name: "Jobs",      path: "/jobs",      icon: "work" },
    { name: "Events",    path: "/events",    icon: "calendar_month" },
    { name: "Profile",   path: "/profile",   icon: "account_circle" },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 pb-safe lg:hidden"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(193,207,216,0.6)",
        boxShadow: "0 -4px 24px rgba(15,31,46,0.07)",
      }}
    >
      <div className="flex h-[60px] items-stretch px-1 max-w-lg mx-auto">
        {items.map((item) => {
          const active =
            pathname === item.path ||
            (item.path !== dashPath && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex flex-col items-center justify-center flex-1 gap-0.5
                transition-all duration-150 active:scale-90
                ${active ? "text-[#1a4a5e]" : "text-[#8199a9] hover:text-[#1a4a5e]"}
              `}
            >
              <div
                className={`
                  flex items-center justify-center w-11 h-7 rounded-full transition-all duration-150
                  ${active ? "bg-[#cce5f0]" : ""}
                `}
              >
                <span
                  className={`material-symbols-outlined transition-all ${
                    active
                      ? "text-[20px] font-black text-[#1a4a5e]"
                      : "text-[20px]"
                  }`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
              </div>
              <span className={`text-[9.5px] font-semibold tracking-tight leading-none ${active ? "text-[#1a4a5e]" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
