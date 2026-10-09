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
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-white/90 backdrop-blur-xl border-t border-[#e2eaec] shadow-[0_-4px_24px_rgba(17,42,50,0.06)] lg:hidden">
      <div className="flex justify-between items-center h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/home" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 duration-150 ${
                isActive
                  ? "text-[#1d524d] font-bold"
                  : "text-[#6c838a] hover:text-[#1d524d]"
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-7 rounded-full transition-all ${isActive ? "bg-[#dcece7]" : ""}`}>
                <span className={`material-symbols-outlined text-[21px] ${isActive ? "text-[#174844]" : ""}`}>
                  {item.icon}
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
