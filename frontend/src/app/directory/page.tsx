"use client";

import React, { useState, useMemo, useEffect } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Alumni } from "@/data/mockData";
import { fetchAlumni } from "@/lib/api";

export default function DirectoryPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedRole, setSelectedRole] = useState<"all" | "mentor" | "verified">("all");

  useEffect(() => {
    async function loadAlumni() {
      try {
        const data = await fetchAlumni();
        setAlumni(data);
      } catch (err) {
        console.error("Failed to load alumni:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAlumni();
  }, []);

  // Dynamic filter lists derived from data
  const departments = useMemo(() => {
    const deps = new Set(alumni.map((a) => a.department).filter(Boolean));
    return ["All", ...Array.from(deps)];
  }, [alumni]);

  // Filtered alumni logic
  const filteredAlumni = useMemo(() => {
    return alumni.filter((alumnus) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        alumnus.name?.toLowerCase().includes(q) ||
        alumnus.company?.toLowerCase().includes(q) ||
        alumnus.role?.toLowerCase().includes(q) ||
        alumnus.skills?.some((skill) => skill.toLowerCase().includes(q));

      const matchesDept =
        selectedDepartment === "All" ||
        alumnus.department === selectedDepartment;

      const matchesRole =
        selectedRole === "all" ||
        (selectedRole === "mentor" && alumnus.isMentor) ||
        (selectedRole === "verified" && alumnus.isVerified);

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [alumni, searchQuery, selectedDepartment, selectedRole]);

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-[1440px] space-y-7">
        <header className="flex flex-col justify-between gap-5 border-b border-[#d9e2e3] pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#54766f]">Community <span className="px-1.5 text-[#a1b2b0]">/</span> Directory</p>
            <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#142f38] sm:text-4xl">Alumni network</h1>
            <p className="mt-2 text-sm text-[#63777d]">
              Connect with graduates, network with industry professionals, and find mentors.
            </p>
          </div>
          <p className="text-sm font-medium text-[#60767b]">{filteredAlumni.length} <span className="text-[#8a9a9d]">of</span> {alumni.length} members</p>
        </header>

        <div className="grid gap-3 border-b border-[#d9e2e3] pb-5 md:grid-cols-[minmax(240px,1fr)_auto_auto] md:items-center">
          <label className="relative block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#72868a]">search</span>
            <input className="min-h-11 w-full rounded-md border border-[#cbd8d9] bg-white pl-10 pr-4 text-sm text-[#18343c] outline-none placeholder:text-[#879599] focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20" placeholder="Search people, companies, skills…" type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </label>
          {departments.length > 1 && <select aria-label="Filter by department" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="min-h-11 rounded-md border border-[#cbd8d9] bg-white px-3 text-sm text-[#29474e] outline-none focus:border-[#458a7c]"><option value="All">All departments</option>{departments.filter((department) => department !== "All").map((department) => <option key={department} value={department}>{department}</option>)}</select>}
          <div className="flex min-h-11 items-center gap-1 border-b border-[#cbd8d9] md:border-0" role="group" aria-label="Filter alumni">
            {(["all", "mentor", "verified"] as const).map((role) => <button key={role} type="button" onClick={() => setSelectedRole(role)} aria-pressed={selectedRole === role} className={`min-h-10 flex-1 px-3 text-xs font-semibold capitalize transition ${selectedRole === role ? "border-b-2 border-[#24635d] text-[#205b55]" : "text-[#74868b] hover:text-[#24444b]"}`}>{role === "all" ? "Everyone" : role === "mentor" ? "Mentors" : "Verified"}</button>)}
          </div>
        </div>

        {alumni.length === 0 ? (
          <div className="border-y border-dashed border-[#cbd8d9] py-16 text-center">
            <span className="material-symbols-outlined text-3xl text-[#829398]">groups</span>
            <p className="mt-2 text-sm font-semibold text-[#29474e]">{isLoading ? "Loading alumni…" : "No alumni profiles yet"}</p>
            <p className="mt-1 text-xs text-[#819095]">Registered alumni will appear in this directory.</p>
          </div>
        ) : (
          <div>
            {filteredAlumni.length ? <div className="divide-y divide-[#dfe7e7] border-y border-[#d9e2e3]">
              {filteredAlumni.map((alumnus) => {
                const initial = alumnus.name?.charAt(0).toUpperCase() || "A";
                return (
                  <article key={alumnus.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dcebe5] text-sm font-semibold text-[#27564e]">{alumnus.avatarUrl ? <img src={alumnus.avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold text-[#17343b]">{alumnus.name}</h2>{alumnus.isMentor && <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#a45d37]">Mentor</span>}</div>
                        <p className="mt-1 truncate text-xs text-[#718287]">{alumnus.classYear} <span className="px-1">·</span> {alumnus.department}</p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[#29474e]">{alumnus.role} <span className="text-[#879599">at</span> {alumnus.company}</p>
                      {alumnus.skills?.length > 0 && <p className="mt-1 truncate text-xs text-[#829196]">{alumnus.skills.slice(0, 3).join(" · ")}</p>}
                    </div>
                    <a href={alumnus.email ? `mailto:${alumnus.email}?subject=${encodeURIComponent(`Connecting via Alumni Portal - ${alumnus.name}`)}&body=${encodeURIComponent(`Hi ${alumnus.name},\n\nI found your profile on the Alumni Directory and would love to connect with you regarding your experience at ${alumnus.company}.\n\nBest regards,`)}` : `mailto:alumni@alumniportal.com?subject=${encodeURIComponent(`Inquiry to connect with ${alumnus.name}`)}`} className="inline-flex min-h-9 items-center gap-1.5 justify-self-start rounded-md border border-[#cbd8d9] px-3 text-xs font-semibold text-[#245e58] transition hover:bg-[#e8f1ee] sm:justify-self-end"><span className="material-symbols-outlined text-[16px]">mail</span>Connect</a>
                  </article>
                );
              })}
            </div> : <div className="border-y border-[#d9e2e3] py-12 text-center text-sm text-[#718287]">No alumni match those filters.</div>}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
