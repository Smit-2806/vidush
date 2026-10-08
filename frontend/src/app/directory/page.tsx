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
      <div className="flex flex-col w-full px-4 gap-6 mt-4 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Alumni Directory
            </h1>
            <p className="font-body-md text-on-surface-variant mt-1">
              Connect with graduates, network with industry professionals, and find mentors.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full shadow-sm rounded-full overflow-hidden bg-surface-container-lowest focus-within:shadow-md transition-shadow">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            className="w-full bg-transparent h-12 pl-12 pr-4 outline-none font-body-md text-on-background placeholder:text-on-surface-variant/70"
            placeholder="Search by name, company, role, or skills..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Scroll Area */}
        <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x">
          <div className="flex items-center gap-2 w-max pb-1">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDepartment("All");
                setSelectedRole("all");
              }}
              className={`snap-start shrink-0 flex items-center justify-center gap-1.5 font-label-md px-4 py-2 rounded-full shadow-sm transition-colors active:scale-95 cursor-pointer ${
                searchQuery || selectedDepartment !== "All" || selectedRole !== "all"
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Reset Filters
            </button>

            {departments.length > 1 && (
              <div className="relative snap-start shrink-0">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="appearance-none bg-surface-container text-on-surface font-label-md pl-4 pr-8 py-2 rounded-full hover:bg-surface-container-high transition-colors shadow-sm outline-none cursor-pointer"
                >
                  <option value="All">Department: All</option>
                  {departments
                    .filter((d) => d !== "All")
                    .map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                </select>
                <span className="material-symbols-outlined text-[16px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Alumni List / Cards */}
        {alumni.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-2xl shadow-sm border border-dashed border-outline-variant/30 mt-4 flex flex-col items-center justify-center p-6">
            <span className="material-symbols-outlined text-[48px] text-outline opacity-40">people_outline</span>
            <p className="font-headline-md text-on-surface mt-2 font-bold">No Alumni Listed Yet</p>
            <p className="font-body-sm text-on-surface-variant mt-1 max-w-sm">
              The alumni directory is currently empty. Registered alumni members will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-on-surface-variant text-xs px-1">
              <span>Showing {filteredAlumni.length} alumni</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlumni.map((alumnus) => {
                const initial = alumnus.name?.charAt(0).toUpperCase() || "A";
                return (
                  <div
                    key={alumnus.id}
                    className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-surface-container group"
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-primary/10 bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                          {alumnus.avatarUrl ? (
                            <img
                              className="w-full h-full object-cover"
                              src={alumnus.avatarUrl}
                              alt={alumnus.name}
                            />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="font-headline-md text-on-surface truncate group-hover:text-primary transition-colors text-base font-bold">
                              {alumnus.name}
                            </h3>
                            {alumnus.isMentor && (
                              <span className="shrink-0 bg-secondary-container/20 text-on-secondary-container font-label-sm px-2 py-0.5 rounded-full flex items-center gap-0.5 text-[10px] font-bold">
                                Mentor
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-on-surface-variant truncate text-xs mt-0.5">
                            {alumnus.classYear} • {alumnus.department}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-on-surface text-xs">
                            <span className="material-symbols-outlined text-[14px] text-primary">work</span>
                            <p className="truncate font-medium">
                              {alumnus.role} at <span className="font-bold">{alumnus.company}</span>
                            </p>
                          </div>
                          {alumnus.email && (
                            <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant text-[11px]">
                              <span className="material-symbols-outlined text-[13px] text-primary">mail</span>
                              <span className="truncate">{alumnus.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {alumnus.skills && alumnus.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {alumnus.skills.map((skill) => (
                            <span
                              key={skill}
                              className="bg-surface-container-low text-on-surface font-label-sm px-2.5 py-0.5 rounded-full text-[11px]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-surface-container-low">
                      <a
                        href={
                          alumnus.email
                            ? `mailto:${alumnus.email}?subject=${encodeURIComponent(`Connecting via Alumni Portal - ${alumnus.name}`)}&body=${encodeURIComponent(`Hi ${alumnus.name},\n\nI found your profile on the Alumni Directory and would love to connect with you regarding your experience at ${alumnus.company}.\n\nBest regards,`)}`
                            : `mailto:alumni@alumniportal.com?subject=${encodeURIComponent(`Inquiry to connect with ${alumnus.name}`)}`
                        }
                        className="flex-1 bg-primary text-on-primary hover:bg-primary/95 transition-colors font-label-md py-2 rounded-lg text-center font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer no-underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        Connect
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
