"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useAuth } from "@/context/AuthContext";

const roleDestinations = {
  admin: "/admin",
  alumni: "/alumni",
  student: "/student",
} as const;

export default function HomePage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (userProfile) router.replace(roleDestinations[userProfile.role]);
  }, [loading, user, userProfile, router]);

  return (
    <LayoutWrapper>
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-primary">
          <span className="material-symbols-outlined animate-pulse text-2xl">space_dashboard</span>
        </span>
        <h1 className="mt-5 text-xl font-semibold text-on-surface">Opening your workspace</h1>
        <p className="mt-2 max-w-sm text-sm text-on-surface-variant">We’re checking your account and opening the dashboard for your role.</p>
      </div>
    </LayoutWrapper>
  );
}