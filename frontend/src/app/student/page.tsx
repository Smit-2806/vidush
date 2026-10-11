"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useAuth } from "@/context/AuthContext";
import { Alumni, Application, EventItem, EventRegistration, Job } from "@/data/mockData";
import {
  fetchAlumni,
  fetchApplicationsForApplicant,
  fetchEventRegistrationsForStudent,
  fetchEvents,
  fetchJobs,
  registerForEvent,
} from "@/lib/api";

function shuffle<T>(items: T[]): T[] {
  const s = [...items];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function isEventCompleted(event: EventItem): boolean {
  if (event.date) {
    const d = new Date(`${event.date}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d < new Date(new Date().setHours(0, 0, 0, 0));
  }
  if (event.status) return event.status === "completed";
  const monthIndex = new Date(`${event.month} 1, 2000`).getMonth();
  const day = Number(event.day);
  if (!Number.isInteger(monthIndex) || !Number.isInteger(day) || day < 1 || day > 31) return false;
  const today = new Date();
  return new Date(today.getFullYear(), monthIndex, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

const statusStyle = (s: string) =>
  s === "Selected" ? "badge badge-success" : s === "Rejected" ? "badge badge-error" : "badge badge-warning";
const statusLabel = (s: string) =>
  s === "Selected" ? "Approved" : s === "Rejected" ? "Rejected" : "Pending";

/* ── Skeleton ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/"); return; }
    if (userProfile?.role && userProfile.role !== "student") {
      router.replace(userProfile.role === "admin" ? "/admin" : "/alumni");
    }
  }, [authLoading, user, userProfile?.role, router]);

  useEffect(() => {
    const uid = userProfile?.uid || user?.uid;
    if (!uid) return;
    const applicantId = uid;
    async function load() {
      setIsLoading(true);
      try {
        const [jobData, eventData, alumniData, applicationData, registrationData] = await Promise.all([
          fetchJobs(),
          fetchEvents(),
          fetchAlumni(),
          fetchApplicationsForApplicant(),
          fetchEventRegistrationsForStudent(applicantId).catch(() => []),
        ]);
        setJobs(jobData.slice(0, 4));
        setEvents(eventData);
        setAlumni(shuffle(alumniData).slice(0, 10));
        setApplications(applicationData);
        setEventRegistrations(registrationData);
      } catch { /* graceful */ } finally { setIsLoading(false); }
    }
    load();
  }, [userProfile?.uid, userProfile?.email, user?.uid, user?.email]);

  const handleEventRegistration = async (event: EventItem) => {
    if (!user || !userProfile) return;
    setRegisteringEventId(event.id); setEventMessage(null);
    try {
      const reg = await registerForEvent({
        eventId: event.id, eventTitle: event.title,
        studentUid: user.uid,
        studentName: userProfile.displayName || user.displayName || "Student",
        studentEmail: userProfile.email || user.email || "",
        status: "registered",
      });
      setEventRegistrations((prev) => [...prev.filter((r) => r.eventId !== event.id), reg]);
      setEventMessage(`Registered for "${event.title}"! See you there.`);
      setTimeout(() => setEventMessage(null), 4000);
    } catch { setEventMessage("Could not register. Please try again."); }
    finally { setRegisteringEventId(null); }
  };

  const displayName = userProfile?.displayName || user?.displayName || "Student";
  const firstName = displayName.split(" ")[0];
  const liveEvents = events.filter((e) => !isEventCompleted(e));
  const completedEvents = events.filter(isEventCompleted);

  if (authLoading || !user || !userProfile || userProfile.role !== "student") {
    return (
      <LayoutWrapper>
        <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#4a6072]">
          <div className="spinner" />
          <span className="text-sm font-medium">Loading your dashboard…</span>
        </div>
      </LayoutWrapper>
    );
  }

  const metrics = [
    { label: "Applications", value: applications.length, note: "submitted", icon: "description", color: "#1a4a5e", bg: "#cce5f0" },
    { label: "In Review",    value: applications.filter((a) => a.status === "Under Review").length, note: "awaiting decision", icon: "hourglass_top", color: "#d97706", bg: "#fef3c7" },
    { label: "Offers",       value: applications.filter((a) => a.status === "Selected").length, note: "selected", icon: "check_circle", color: "#059669", bg: "#d1fae5" },
    { label: "Events",       value: liveEvents.length, note: "upcoming", icon: "event", color: "#6366f1", bg: "#e0e7ff" },
  ];

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-[1500px] space-y-7">

        {/* ── Hero header ── */}
        <header className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
                style={{ background: "linear-gradient(135deg, #0d2233 0%, #1a4a5e 100%)" }}>
          {/* Decoration */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 pointer-events-none"
               style={{ background: "radial-gradient(circle, #60c4e8 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none"
               style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)" }} />

          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.20em] text-white/45 mb-2">
                Student Workspace
                {userProfile.department && (
                  <> <span className="text-white/25 mx-1.5">/</span> {userProfile.department}</>
                )}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5"
                  style={{ fontFamily: "Poppins, system-ui, sans-serif", letterSpacing: "-0.025em" }}>
                Welcome back, {firstName} 👋
              </h1>
              <p className="text-sm text-white/55">Your next opportunity starts with one good connection.</p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link href="/jobs"
                    className="btn inline-flex min-h-[44px] items-center gap-2 px-5 text-sm font-semibold cursor-pointer"
                    style={{ background: "#60c4e8", color: "#0d2233", borderRadius: "10px" }}>
                <span className="material-symbols-outlined text-[18px]">search</span>
                Find a Role
              </Link>
              <Link href="/events"
                    className="btn inline-flex min-h-[44px] items-center gap-2 px-5 text-sm font-semibold cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px" }}>
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Events
              </Link>
            </div>
          </div>
        </header>

        {/* ── Metric cards ── */}
        <section aria-label="Activity overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="stat-card flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: m.bg, color: m.color }}>
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.10em] text-[#8199a9]">{m.label}</p>
                <p className="text-2xl font-bold tracking-tight text-[#0f1f2e] leading-none mt-0.5"
                   style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                  {isLoading ? "—" : m.value}
                </p>
                <p className="text-[11px] text-[#8199a9] mt-0.5">{m.note}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Main grid ── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.75fr)]">

          {/* ── Left column ── */}
          <div className="space-y-6">

            {/* Applications table */}
            <section aria-labelledby="app-heading" className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8199a9]">Career Progress</p>
                  <h2 id="app-heading" className="mt-1 text-lg font-bold text-[#0f1f2e]"
                      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                    Application Activity
                  </h2>
                </div>
                <Link href="/jobs" className="text-xs font-semibold text-[#1a4a5e] hover:underline underline-offset-2 whitespace-nowrap shrink-0 mt-1">
                  Browse jobs →
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : applications.length ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full min-w-[520px] text-left text-sm border-collapse">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e1e8ee" }}>
                        {["Position", "Company", "Applied", "Status"].map((h, i) => (
                          <th key={h}
                              className={`py-3 text-[10px] font-bold uppercase tracking-[0.10em] text-[#8199a9] ${i === 0 ? "pl-0 pr-4" : i === 3 ? "pl-4 pr-0 text-right" : "px-4"}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 5).map((a) => (
                        <tr key={a.id} className="hover:bg-[#f8fafc] transition-colors" style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td className="py-3.5 pr-4 font-semibold text-[#0f1f2e] text-sm">{a.jobTitle}</td>
                          <td className="px-4 py-3.5 text-[#4a6072] text-sm">{a.company}</td>
                          <td className="px-4 py-3.5 text-[#8199a9] text-xs">{a.appliedDate}</td>
                          <td className="py-3.5 pl-4 text-right">
                            <span className={statusStyle(a.status)}>{statusLabel(a.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="material-symbols-outlined text-[40px] text-[#c2cfd8] mb-3">inbox</span>
                  <p className="text-sm font-medium text-[#4a6072]">No applications yet</p>
                  <p className="text-xs text-[#8199a9] mt-1">Browse current openings to get started.</p>
                  <Link href="/jobs" className="mt-4 btn btn-primary text-xs px-5 py-2 rounded-lg min-h-0 h-9">Find roles</Link>
                </div>
              )}
            </section>

            {/* Jobs */}
            <section aria-labelledby="jobs-heading" className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8199a9]">Community Hiring</p>
                  <h2 id="jobs-heading" className="mt-1 text-lg font-bold text-[#0f1f2e]"
                      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                    New Opportunities
                  </h2>
                </div>
                <Link href="/jobs" className="text-xs font-semibold text-[#1a4a5e] hover:underline underline-offset-2 whitespace-nowrap shrink-0 mt-1">
                  Browse all →
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : jobs.length ? (
                <div className="space-y-0">
                  {jobs.map((job) => (
                    <Link key={job.id} href="/jobs"
                          className="group flex items-center gap-4 py-4 -mx-2 px-2 rounded-xl hover:bg-[#f8fafc] transition-colors cursor-pointer"
                          style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#1a4a5e]"
                            style={{ background: "#cce5f0" }}>
                        <span className="material-symbols-outlined text-[20px]">work</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#0f1f2e] group-hover:text-[#1a4a5e] transition-colors">
                          {job.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#8199a9]">
                          {job.company} <span className="mx-1 text-[#c2cfd8]">·</span> {job.location}
                        </span>
                      </span>
                      <span className="hidden sm:flex flex-col items-end shrink-0">
                        <span className="text-xs font-semibold text-[#1a4a5e]">{job.type}</span>
                        <span className="mt-0.5 text-[11px] text-[#8199a9]">{job.level}</span>
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-[#c2cfd8] group-hover:text-[#1a4a5e] group-hover:translate-x-0.5 transition-all">
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-[#8199a9]">No opportunities posted yet.</p>
              )}
            </section>

            {/* Alumni network */}
            <section aria-labelledby="alumni-heading" className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8199a9]">Build Your Network</p>
                  <h2 id="alumni-heading" className="mt-1 text-lg font-bold text-[#0f1f2e]"
                      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                    Alumni to Know
                  </h2>
                </div>
                <Link href="/directory" className="text-xs font-semibold text-[#1a4a5e] hover:underline underline-offset-2 whitespace-nowrap shrink-0 mt-1">
                  Full directory →
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[1,2,3,4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : alumni.length ? (
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {alumni.slice(0, 6).map((member) => (
                    <article key={member.id}
                             className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f8fafc] transition-colors">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #1a4a5e 0%, #0f766e 100%)" }}>
                        {member.avatarUrl
                          ? <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
                          : member.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#0f1f2e]">{member.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-[#8199a9]">
                          {member.role}{member.company ? ` · ${member.company}` : ""}
                        </span>
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[#8199a9]">Alumni profiles will appear here.</p>
              )}
            </section>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">

            {/* Event message */}
            {eventMessage && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 animate-fade-in"
                   style={{ background: "#d1fae5", border: "1px solid #a7f3d0" }}>
                <span className="material-symbols-outlined text-[18px] text-[#059669] shrink-0 mt-0.5">check_circle</span>
                <p className="text-xs font-medium text-[#065f46]">{eventMessage}</p>
              </div>
            )}

            {/* Upcoming events */}
            <section aria-labelledby="events-heading" className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8199a9]">Campus Calendar</p>
                  <h2 id="events-heading" className="mt-1 text-base font-bold text-[#0f1f2e]"
                      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                    Upcoming Events
                  </h2>
                </div>
                <Link href="/events" aria-label="View all events"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1a4a5e] hover:bg-[#cce5f0] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">{[1,2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : liveEvents.slice(0, 4).length ? (
                <div className="space-y-0">
                  {liveEvents.slice(0, 4).map((event) => {
                    const reg = eventRegistrations.find((r) => r.eventId === event.id);
                    return (
                      <article key={event.id} className="py-3.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <div className="flex gap-3">
                          {/* Date badge */}
                          <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-xl py-2 text-center"
                               style={{ background: "#cce5f0" }}>
                            <span className="block text-[9px] font-bold uppercase text-[#1a4a5e]">{event.month}</span>
                            <span className="mt-0.5 block text-lg font-bold leading-none text-[#0d2233]">{event.day}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-[#0f1f2e] leading-snug">{event.title}</h3>
                            {event.location && (
                              <p className="mt-0.5 text-xs text-[#8199a9] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                {event.location}
                              </p>
                            )}
                            {reg ? (
                              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]">
                                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                Registered
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEventRegistration(event)}
                                disabled={registeringEventId === event.id}
                                className="mt-2 text-xs font-bold text-[#1a4a5e] hover:text-[#0d2233] underline underline-offset-2 decoration-[#c2cfd8] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {registeringEventId === event.id ? "Registering…" : "Register →"}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[#8199a9]">No upcoming events scheduled.</p>
              )}
            </section>

            {/* Completed events */}
            <section aria-labelledby="done-heading" className="card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 id="done-heading" className="text-sm font-bold text-[#0f1f2e]"
                    style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
                  Recently Completed
                </h2>
                <span className="badge badge-neutral">{completedEvents.length}</span>
              </div>

              {completedEvents.length ? (
                <ul className="space-y-0">
                  {completedEvents.slice(0, 3).map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2.5 text-xs"
                        style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <span className="text-[#4a6072] font-medium">{e.title}</span>
                      <span className="text-[#8199a9] shrink-0 ml-3">{e.month} {e.day}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#8199a9] text-center py-4">Completed events will appear here.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
