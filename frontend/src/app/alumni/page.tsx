"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useAuth } from "@/context/AuthContext";
import { Job, Application } from "@/data/mockData";
import {
  fetchJobs,
  fetchApplicationsForPoster,
  updateApplicationStatusViaApi,
} from "@/lib/api";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function AlumniDashboardPage() {
  const { userProfile, user } = useAuth();
  const isAlumni = userProfile?.role === "alumni" || userProfile?.role === "admin";

  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedJobFilter, setSelectedJobFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const userUid   = userProfile?.uid   || user?.uid   || "";
  const userEmail = userProfile?.email || user?.email || "";

  useEffect(() => {
    async function load() {
      if (!userUid && !userEmail) { setLoading(false); return; }
      try {
        setLoading(true);
        const allJobs = await fetchJobs();
        const myJobs  = allJobs.filter(
          (j) => (j.postedBy && j.postedBy === userUid) ||
                 (j.postedByEmail && j.postedByEmail.toLowerCase() === userEmail.toLowerCase())
        );
        const effectiveJobs = myJobs.length > 0 ? myJobs : (userProfile?.role === "admin" ? allJobs : []);
        setPostedJobs(effectiveJobs);

        const myJobIds = effectiveJobs.map((j) => j.id);
        const apps = await fetchApplicationsForPoster();
        const final = apps.filter(
          (a) => (a.posterId && a.posterId === userUid) ||
                 (a.posterEmail && a.posterEmail.toLowerCase() === userEmail.toLowerCase()) ||
                 myJobIds.includes(a.jobId) ||
                 userProfile?.role === "admin"
        );
        setApplications(final);
      } catch (err) { console.error("Alumni dashboard load failed:", err); }
      finally { setLoading(false); }
    }
    load();
  }, [userUid, userEmail, userProfile?.role]);

  const handleStatusChange = async (id: string, status: "Under Review" | "Selected" | "Rejected") => {
    setUpdatingAppId(id);
    try {
      await updateApplicationStatusViaApi(id, status);
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      const msg =
        status === "Selected"    ? "Candidate marked as Selected!" :
        status === "Rejected"    ? "Candidate marked as Rejected." :
                                   "Status reset to Under Review.";
      setNotification(msg);
      setTimeout(() => setNotification(null), 4000);
    } catch { alert("Failed to update. Please try again."); }
    finally { setUpdatingAppId(null); }
  };

  const filtered = useMemo(() =>
    applications.filter((a) => {
      const matchJob    = selectedJobFilter === "ALL" || a.jobId === selectedJobFilter;
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchQ = !q ||
        a.applicantName.toLowerCase().includes(q) ||
        a.applicantEmail.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q) ||
        (a.coverLetter && a.coverLetter.toLowerCase().includes(q));
      return matchJob && matchStatus && matchQ;
    }),
    [applications, selectedJobFilter, statusFilter, searchQuery]
  );

  const metrics = [
    { label: "Total Applicants", value: applications.length,                                          icon: "groups",       color: "#1a4a5e", bg: "#cce5f0" },
    { label: "In Review",        value: applications.filter((a) => a.status === "Under Review").length, icon: "hourglass_top", color: "#d97706", bg: "#fef3c7" },
    { label: "Selected",         value: applications.filter((a) => a.status === "Selected").length,    icon: "check_circle", color: "#059669", bg: "#d1fae5" },
    { label: "Rejected",         value: applications.filter((a) => a.status === "Rejected").length,   icon: "cancel",       color: "#dc2626", bg: "#fee2e2" },
  ];

  /* ── Not alumni guard ── */
  if (!isAlumni && !loading) {
    return (
      <LayoutWrapper>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-5"
               style={{ background: "#fee2e2" }}>
            <span className="material-symbols-outlined text-[32px] text-red-600">lock</span>
          </div>
          <h1 className="text-xl font-bold text-[#0f1f2e] mb-2"
              style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
            Alumni Access Only
          </h1>
          <p className="text-sm text-[#4a6072] leading-relaxed max-w-sm mx-auto">
            The Candidate Review Dashboard is reserved for verified alumni members who post job listings and evaluate student applications.
          </p>
          <Link href="/jobs" className="mt-6 btn btn-primary inline-flex px-6">
            Explore Job Board
          </Link>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">

        {/* ── Toast notification ── */}
        {notification && (
          <div className="fixed top-20 right-4 z-[100] max-w-sm rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3 animate-scale-in"
               style={{ background: "#0f1f2e", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="material-symbols-outlined text-[20px] text-[#34d399]">check_circle</span>
            <p className="text-xs font-semibold text-white flex-1">{notification}</p>
            <button onClick={() => setNotification(null)} className="text-white/50 hover:text-white transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* ── Hero header ── */}
        <header className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
                style={{ background: "linear-gradient(135deg, #0d2233 0%, #1a4a5e 100%)" }}>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 pointer-events-none"
               style={{ background: "radial-gradient(circle, #60c4e8 0%, transparent 70%)" }} />
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.20em] text-white/45 mb-2">
                Alumni Workspace <span className="text-white/25 mx-1">/</span> Hiring
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5"
                  style={{ fontFamily: "Poppins, system-ui, sans-serif", letterSpacing: "-0.025em" }}>
                Candidate Review
              </h1>
              <p className="text-sm text-white/55">Manage your postings and review applicants in one place.</p>
            </div>
            <div className="shrink-0">
              <Link href="/jobs"
                    className="inline-flex min-h-[44px] items-center gap-2 px-5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: "#60c4e8", color: "#0d2233" }}>
                <span className="material-symbols-outlined text-[18px]">add_box</span>
                Post Another Job
              </Link>
            </div>
          </div>
        </header>

        {/* ── Metric cards ── */}
        <section aria-label="Applicant statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="stat-card flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: m.bg, color: m.color }}>
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#8199a9]">{m.label}</p>
                <p className="text-2xl font-bold tracking-tight text-[#0f1f2e] mt-0.5"
                   style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                  {loading ? "—" : m.value}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Filter bar ── */}
        <div className="card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8199a9] text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by candidate name, email, or job title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#dde5eb] bg-[#f8fafc] text-sm text-[#0f1f2e] focus:border-[#1a4a5e] focus:ring-2 focus:ring-[#1a4a5e]/10 focus:outline-none transition-all placeholder:text-[#8199a9]"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#dde5eb] bg-white px-3 pr-8 text-sm font-medium text-[#0f1f2e] focus:border-[#1a4a5e] focus:outline-none cursor-pointer appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%238199a9' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "16px" }}
              >
                <option value="ALL">All Jobs ({postedJobs.length})</option>
                {postedJobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-[#dde5eb] bg-white px-3 pr-8 text-sm font-medium text-[#0f1f2e] focus:border-[#1a4a5e] focus:outline-none cursor-pointer appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%238199a9' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "16px" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Under Review">Under Review</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Applicants list ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f1f2e] flex items-center gap-2"
                style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
              <span className="material-symbols-outlined text-[#1a4a5e] text-[22px]">badge</span>
              Applicants
              <span className="ml-1 text-sm font-normal text-[#8199a9]">({filtered.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c2cfd8] mb-3">person_search</span>
              <h3 className="text-base font-bold text-[#0f1f2e] mb-1"
                  style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                No Applicants Found
              </h3>
              <p className="text-xs text-[#8199a9] max-w-xs">
                {applications.length === 0
                  ? "When students apply to your job listings, their profiles will appear here."
                  : "No applicants match your current filters. Try clearing them."}
              </p>
              {applications.length === 0 && (
                <Link href="/jobs" className="mt-5 btn btn-primary px-5 text-xs min-h-0 h-10 rounded-xl">
                  View Job Board
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((app) => {
                const isSelected = app.status === "Selected";
                const isRejected = app.status === "Rejected";
                const isBusy     = updatingAppId === app.id;
                return (
                  <div key={app.id} className="card p-5 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      {/* Left: Applicant info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                             style={{ background: "linear-gradient(135deg, #1a4a5e 0%, #0f766e 100%)" }}>
                          {app.applicantName?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#0f1f2e]">{app.applicantName}</h3>
                            <span className="badge badge-neutral capitalize">{app.applicantRole || "student"}</span>
                            <span className="text-xs text-[#8199a9]">Applied {app.appliedDate}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#4a6072] mb-2">
                            <a href={`mailto:${app.applicantEmail}`}
                               className="flex items-center gap-1 font-semibold text-[#1a4a5e] hover:underline">
                              <span className="material-symbols-outlined text-[13px]">mail</span>
                              {app.applicantEmail}
                            </a>
                            <span className="text-[#c2cfd8]">·</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-[#1a4a5e]">work</span>
                              <strong className="text-[#0f1f2e]">{app.jobTitle}</strong> — {app.company}
                            </span>
                          </div>

                          {/* Resume */}
                          <div className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#4a6072]"
                               style={{ background: "#f1f5f9", border: "1px solid #e1e8ee" }}>
                            <span className="material-symbols-outlined text-[14px] text-[#1a4a5e]">description</span>
                            {app.resumeName || "Resume.pdf"}
                          </div>

                          {/* Cover letter */}
                          {app.coverLetter && (
                            <details className="mt-2.5 group">
                              <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold text-[#1a4a5e] hover:underline">
                                <span className="material-symbols-outlined text-[13px]">notes</span>
                                Read Cover Letter
                              </summary>
                              <div className="mt-2 rounded-xl p-3 text-xs text-[#4a6072] whitespace-pre-wrap leading-relaxed"
                                   style={{ background: "#f8fafc", border: "1px solid #e1e8ee" }}>
                                {app.coverLetter}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>

                      {/* Right: Status + Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0 pt-4 lg:pt-0"
                           style={{ borderTop: "1px solid #f1f5f9" }}>
                        {/* Status badge */}
                        <span className={`badge ${isSelected ? "badge-success" : isRejected ? "badge-error" : "badge-warning"}`}>
                          <span className="material-symbols-outlined text-[12px]">
                            {isSelected ? "check_circle" : isRejected ? "cancel" : "hourglass_top"}
                          </span>
                          {isSelected ? "Selected" : isRejected ? "Rejected" : "Under Review"}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isBusy || isSelected}
                            onClick={() => handleStatusChange(app.id, "Selected")}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            style={{ background: isSelected ? "#16a34a" : "#16a34a" }}
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            {isSelected ? "Selected" : "Select"}
                          </button>
                          <button
                            disabled={isBusy || isRejected}
                            onClick={() => handleStatusChange(app.id, "Rejected")}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            style={{
                              background: isRejected ? "#dc2626" : "#fee2e2",
                              color: isRejected ? "#fff" : "#dc2626",
                              border: "1px solid #fecaca",
                            }}
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                            {isRejected ? "Rejected" : "Reject"}
                          </button>
                          {(isSelected || isRejected) && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleStatusChange(app.id, "Under Review")}
                              className="flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#4a6072] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">replay</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </LayoutWrapper>
  );
}
