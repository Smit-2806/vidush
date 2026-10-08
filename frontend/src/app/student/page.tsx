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
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function isEventCompleted(event: EventItem): boolean {
  if (event.date) {
    const date = new Date(`${event.date}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date < new Date(new Date().setHours(0, 0, 0, 0));
  }
  if (event.status) return event.status === "completed";
  const monthIndex = new Date(`${event.month} 1, 2000`).getMonth();
  const day = Number(event.day);
  if (!Number.isInteger(monthIndex) || !Number.isInteger(day) || day < 1 || day > 31) {
    return false;
  }

  const today = new Date();
  const date = new Date(today.getFullYear(), monthIndex, day);
  return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
    if (!user) {
      router.replace("/");
      return;
    }
    if (userProfile?.role && userProfile.role !== "student") {
      router.replace(userProfile.role === "admin" ? "/admin" : "/alumni");
    }
  }, [authLoading, user, userProfile?.role, router]);

  useEffect(() => {
    const uid = userProfile?.uid || user?.uid;
    if (!uid) return;
    const applicantId = uid;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [jobData, eventData, alumniData, applicationData, registrationData] = await Promise.all([
          fetchJobs(),
          fetchEvents(),
          fetchAlumni(),
          fetchApplicationsForApplicant(),
          fetchEventRegistrationsForStudent(applicantId).catch((err) => {
            console.error("Failed to load event registrations:", err);
            return [];
          }),
        ]);
        setJobs(jobData.slice(0, 4));
        setEvents(eventData);
        setAlumni(shuffle(alumniData).slice(0, 10));
        setApplications(applicationData);
        setEventRegistrations(registrationData);
      } catch (err) {
        console.error("Failed to load student dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [userProfile?.uid, userProfile?.email, user?.uid, user?.email]);

  const handleEventRegistration = async (event: EventItem) => {
    if (!user || !userProfile) return;
    setRegisteringEventId(event.id);
    setEventMessage(null);
    try {
      const registration = await registerForEvent({
        eventId: event.id,
        eventTitle: event.title,
        studentUid: user.uid,
        studentName: userProfile.displayName || user.displayName || "Student",
        studentEmail: userProfile.email || user.email || "",
        status: "registered",
      });
      setEventRegistrations((previous) => [
        ...previous.filter((item) => item.eventId !== event.id),
        registration,
      ]);
      setEventMessage(`You are registered for ${event.title}.`);
    } catch (err) {
      console.error("Failed to apply for event:", err);
      setEventMessage("Could not submit your event request. Please try again.");
    } finally {
      setRegisteringEventId(null);
    }
  };

  const displayName = userProfile?.displayName || user?.displayName || "Student";
  const liveEvents = events.filter((event) => !isEventCompleted(event));
  const completedEvents = events.filter(isEventCompleted);

  if (authLoading || !user || !userProfile || userProfile.role !== "student") {
    return (
      <LayoutWrapper>
        <div className="flex min-h-[55vh] items-center justify-center" aria-label="Loading student dashboard">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto w-full max-w-[1500px] space-y-8">
        <header className="flex flex-col justify-between gap-6 border-b border-[#d9e2e3] pb-7 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#54766f]">Student workspace <span className="px-1.5 text-[#a1b2b0]">/</span> {userProfile.department || "Campus"}</p>
            <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#142f38] sm:text-4xl">Welcome back, {displayName.split(" ")[0]}</h1>
            <p className="mt-2 text-sm text-[#63777d]">Your next opportunity starts with one good connection.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#173c42] px-4 text-sm font-semibold text-white transition hover:bg-[#21525a]">
              <span className="material-symbols-outlined text-[18px]">search</span> Find a role
            </Link>
            <Link href="/events" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#cbd8d9] px-4 text-sm font-semibold text-[#24444b] transition hover:bg-white">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span> Explore events
            </Link>
          </div>
        </header>

        <section aria-label="Student activity" className="grid grid-cols-2 divide-x divide-[#d6e0e1] border-y border-[#d6e0e1] py-5 md:grid-cols-4">
          {[
            { label: "Applications", value: applications.length, note: "submitted" },
            { label: "In review", value: applications.filter((application) => application.status === "Under Review").length, note: "awaiting decision" },
            { label: "Offers", value: applications.filter((application) => application.status === "Selected").length, note: "selected" },
            { label: "Upcoming events", value: liveEvents.length, note: "open to join" },
          ].map((metric) => (
            <div key={metric.label} className="px-4 py-2 first:pl-0 md:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#73868a]">{metric.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-[#173c42]">{isLoading ? "—" : metric.value}</p>
              <p className="mt-0.5 text-xs text-[#73868a]">{metric.note}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.8fr)]">
          <div className="min-w-0 space-y-10">
            <section aria-labelledby="application-heading">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Career progress</p>
                  <h2 id="application-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#172f38]">Application activity</h2>
                </div>
                <Link href="/jobs" className="text-xs font-semibold text-[#24635d] hover:underline">Open applications</Link>
              </div>
              {applications.length ? (
                <div className="overflow-x-auto border-y border-[#d9e2e3]">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#73868a]">
                        <th className="py-3 pr-4">Position</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Applied</th><th className="py-3 pl-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e9e9]">
                      {applications.slice(0, 5).map((application) => (
                        <tr key={application.id}>
                          <td className="py-3.5 pr-4 font-semibold text-[#18343c]">{application.jobTitle}</td>
                          <td className="px-4 py-3.5 text-[#64777d]">{application.company}</td>
                          <td className="px-4 py-3.5 text-[#64777d]">{application.appliedDate}</td>
                          <td className="py-3.5 pl-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${application.status === "Selected" ? "text-[#23705b]" : application.status === "Rejected" ? "text-[#a24e45]" : "text-[#8a681f]"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${application.status === "Selected" ? "bg-[#3b9975]" : application.status === "Rejected" ? "bg-[#c16a5f]" : "bg-[#c89d3c]"}`} />
                              {application.status === "Selected" ? "Approved" : application.status === "Rejected" ? "Rejected" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-y border-[#d9e2e3] py-8 text-sm text-[#718287]">{isLoading ? "Loading applications…" : "No applications yet. Browse current openings to get started."}</div>
              )}
            </section>

            <section aria-labelledby="opportunities-heading">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Community hiring</p>
                  <h2 id="opportunities-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#172f38]">New opportunities</h2>
                </div>
                <Link href="/jobs" className="text-xs font-semibold text-[#24635d] hover:underline">Browse all</Link>
              </div>
              {jobs.length ? (
                <div className="divide-y divide-[#dfe7e7] border-y border-[#d9e2e3]">
                  {jobs.map((job) => (
                    <Link key={job.id} href="/jobs" className="group flex items-center gap-4 py-4 transition-colors hover:bg-white/70">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e0eeea] text-[#24635d]"><span className="material-symbols-outlined">work</span></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#18343c]">{job.title}</span>
                        <span className="mt-1 block truncate text-xs text-[#718287]">{job.company} <span className="px-1">·</span> {job.location}</span>
                      </span>
                      <span className="hidden text-right sm:block">
                        <span className="block text-xs font-semibold text-[#355a60]">{job.type}</span>
                        <span className="mt-1 block text-[11px] text-[#849398]">{job.level}</span>
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-[#93a2a5] transition group-hover:translate-x-0.5 group-hover:text-[#24635d]">arrow_forward</span>
                    </Link>
                  ))}
                </div>
              ) : <p className="border-y border-[#d9e2e3] py-8 text-sm text-[#718287]">{isLoading ? "Loading opportunities…" : "No alumni opportunities are posted yet."}</p>}
            </section>

            <section aria-labelledby="alumni-heading">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Build your network</p>
                  <h2 id="alumni-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#172f38]">Alumni to know</h2>
                </div>
                <Link href="/directory" className="text-xs font-semibold text-[#24635d] hover:underline">Full directory</Link>
              </div>
              {alumni.length ? (
                <div className="grid grid-cols-1 divide-y divide-[#dfe7e7] border-y border-[#d9e2e3] sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8">
                  {alumni.slice(0, 6).map((member) => (
                    <article key={member.id} className="flex min-w-0 items-center gap-3 py-3 sm:border-b sm:border-[#dfe7e7]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dcebe5] text-sm font-semibold text-[#27564e]">
                        {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" /> : member.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#18343c]">{member.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-[#718287]">{member.role}{member.company ? ` · ${member.company}` : ""}</span>
                      </span>
                    </article>
                  ))}
                </div>
              ) : <p className="border-y border-[#d9e2e3] py-8 text-sm text-[#718287]">{isLoading ? "Loading alumni…" : "Alumni profiles will appear here."}</p>}
            </section>
          </div>

          <aside className="min-w-0 space-y-8">
            <section aria-labelledby="events-heading" className="border-t-2 border-[#235a57] pt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Campus calendar</p>
                  <h2 id="events-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#172f38]">Upcoming events</h2>
                </div>
                <Link href="/events" aria-label="View all events" className="flex h-9 w-9 items-center justify-center rounded-md text-[#24635d] hover:bg-white"><span className="material-symbols-outlined">arrow_forward</span></Link>
              </div>
              {eventMessage && <p role="status" className="mt-4 border-l-2 border-[#368d75] bg-[#e9f3ee] px-3 py-2 text-xs font-medium text-[#27614f]">{eventMessage}</p>}
              <div className="mt-4 divide-y divide-[#dfe7e7]">
                {liveEvents.slice(0, 4).length ? liveEvents.slice(0, 4).map((event) => {
                  const registration = eventRegistrations.find((item) => item.eventId === event.id);
                  return (
                    <article key={event.id} className="py-4 first:pt-0">
                      <div className="flex gap-3">
                        <div className="w-11 shrink-0 border-r border-[#d6e0e1] pr-3 text-center">
                          <span className="block text-[10px] font-bold uppercase text-[#728b87]">{event.month}</span>
                          <span className="mt-0.5 block text-xl font-semibold leading-none text-[#214a4c]">{event.day}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold leading-snug text-[#18343c]">{event.title}</h3>
                          <p className="mt-1 text-xs text-[#718287]">{event.location}</p>
                          {event.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#718287]">{event.description}</p>}
                          {registration ? (
                            <span className="mt-2 inline-block text-[11px] font-semibold text-[#26715a]">Registered</span>
                          ) : (
                            <button type="button" onClick={() => handleEventRegistration(event)} disabled={registeringEventId === event.id} className="mt-2 text-xs font-semibold text-[#24635d] underline decoration-[#a2bdb4] underline-offset-4 hover:text-[#173c42] disabled:opacity-50">
                              {registeringEventId === event.id ? "Registering…" : "Register for event"}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }) : <p className="py-6 text-sm text-[#718287]">{isLoading ? "Loading events…" : "No upcoming events scheduled."}</p>}
              </div>
            </section>

            <section aria-labelledby="completed-heading" className="border-t border-[#d9e2e3] pt-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="completed-heading" className="text-sm font-semibold text-[#304a50]">Recently completed</h2>
                <span className="text-[11px] text-[#849398]">{completedEvents.length}</span>
              </div>
              {completedEvents.length ? (
                <ul className="mt-3 divide-y divide-[#e2e9e9]">
                  {completedEvents.slice(0, 3).map((event) => <li key={event.id} className="py-2.5 text-xs text-[#6b7e83]">{event.title}<span className="ml-2 text-[#94a2a5]">{event.month} {event.day}</span></li>)}
                </ul>
              ) : <p className="mt-3 text-xs text-[#849398]">Completed events will appear here.</p>}
            </section>
          </aside>
        </div>
      </div>
    </LayoutWrapper>
  );
}
