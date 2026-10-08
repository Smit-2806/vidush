"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/home", icon: "home" },
    { name: "Directory", path: "/directory", icon: "person_search" },
    { name: "Jobs", path: "/jobs", icon: "work" },
    { name: "Events", path: "/events", icon: "calendar_month" },
    { name: "Profile", path: "/profile", icon: "account_circle" },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,32,69,0.05)]">
      <div className="max-w-[1280px] mx-auto flex justify-between items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-95 duration-150 ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? "fill-1" : ""}`}>
                {item.icon}
              </span>
              <span className="font-label-sm text-label-sm mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
