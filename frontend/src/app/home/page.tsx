"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useAuth } from "@/context/AuthContext";
import { fetchJobs, fetchEvents } from "@/lib/api";
import { Job, EventItem } from "@/data/mockData";

export default function HomePage() {
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobsList, eventsList] = await Promise.all([
          fetchJobs(),
          fetchEvents(),
        ]);
        setRecentJobs(jobsList.slice(0, 3));
        setEvents(eventsList);
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Alumni";
  const userPhoto = userProfile?.photoURL || user?.photoURL || "";
  const userInitial = displayName.charAt(0).toUpperCase();
  const classYear = userProfile?.classYear || "Community Member";
  const isAlumni = userProfile?.role === "alumni";
  const isAdmin = userProfile?.role === "admin";
  const userRole = isAlumni ? "Alumni" : isAdmin ? "Admin" : "Student";

  return (
    <LayoutWrapper>
      <div className="flex flex-col w-full pb-6">
        {/* Welcome Section */}
        <div className="px-4 pt-4 pb-10 bg-surface relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute top-20 -left-10 w-32 h-32 bg-tertiary/5 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10 max-w-2xl">
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {userPhoto ? (
                <img
                  alt={displayName}
                  className="w-full h-full object-cover"
                  src={userPhoto}
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Welcome back, {displayName}!
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {classYear} • {userRole}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 relative z-10 max-w-xl">
            <div className="bg-surface-container-lowest rounded-full shadow-sm flex items-center px-4 h-12 focus-within:ring-2 focus-within:ring-primary focus-within:shadow-md transition-all duration-200">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                className="w-full bg-transparent border-none focus:outline-none ml-3 font-body-md text-body-md text-on-surface placeholder-on-surface-variant/70"
                placeholder="Search alumni, jobs, or events..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="flex gap-3 mt-6 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {isAlumni ? (
              <>
                <Link
                  href="/alumni"
                  className="snap-start flex-shrink-0 bg-primary/10 text-primary border border-primary/20 rounded-xl px-5 py-3 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                  <span className="font-label-md text-label-md">Review Applicants</span>
                </Link>
                <Link
                  href="/jobs"
                  className="snap-start flex-shrink-0 bg-primary text-on-primary rounded-xl px-5 py-3 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">add_box</span>
                  <span className="font-label-md text-label-md">Post a Job</span>
                </Link>
              </>
            ) : (
              <Link
                href="/jobs"
                className="snap-start flex-shrink-0 bg-primary text-on-primary rounded-xl px-5 py-3 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">work</span>
                <span className="font-label-md text-label-md">Explore Jobs</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/events"
                className="snap-start flex-shrink-0 bg-tertiary text-on-tertiary rounded-xl px-5 py-3 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span className="font-label-md text-label-md">Host Event</span>
              </Link>
            )}
            
            <Link
              href="/directory"
              className="snap-start flex-shrink-0 bg-secondary-container text-on-secondary-container rounded-xl px-5 py-3 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">psychology</span>
              <span className="font-label-md text-label-md">Find a Mentor</span>
            </Link>

            <Link
              href="/events"
              className="snap-start flex-shrink-0 bg-surface-container-high text-on-surface rounded-xl px-5 py-3 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              <span className="font-label-md text-label-md">View Events</span>
            </Link>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">Upcoming Events</h2>
            <Link
              href="/events"
              className="font-label-sm text-label-sm text-primary flex items-center hover:text-primary-container transition-colors"
            >
              See all{" "}
              <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="p-6 bg-surface-container-lowest rounded-2xl border border-surface-container text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-2">event_busy</span>
              <p className="font-label-md text-on-surface font-semibold">No upcoming events yet</p>
              <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                {isAdmin ? "Host an event to bring alumni and students together" : "Check back later for university workshops and reunions"}
              </p>
              <Link href="/events" className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                {isAdmin ? "Host an Event" : "Go to Events"} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div
              className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {events.map((event) => (
                <div
                  key={event.id}
                  className="snap-start flex-shrink-0 w-64 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden relative group hover:shadow-md transition-all duration-300"
                >
                  <div className="h-32 w-full relative overflow-hidden bg-surface-container">
                    {event.imageUrl ? (
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={event.title}
                        src={event.imageUrl}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/40">
                        <span className="material-symbols-outlined text-[40px]">calendar_month</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur text-on-surface px-2 py-1 rounded-md flex flex-col items-center justify-center min-w-[48px] shadow-sm">
                      <span className="font-label-sm text-label-sm uppercase text-error text-[10px] font-bold">
                        {event.month}
                      </span>
                      <span className="font-headline-md text-headline-md leading-none mt-0.5 text-primary">
                        {event.day}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-label-md text-label-md text-on-surface line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-on-surface-variant font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-[16px]">
                        {event.isVirtual ? "videocam" : "location_on"}
                      </span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Job Postings Section */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">Recent Job Postings</h2>
            <Link
              href="/jobs"
              className="font-label-sm text-label-sm text-primary flex items-center hover:text-primary-container transition-colors"
            >
              View board{" "}
              <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-6 bg-surface-container-lowest rounded-2xl border border-surface-container text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-2">work_outline</span>
              <p className="font-label-md text-on-surface font-semibold">No job postings yet</p>
              <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                {isAlumni ? "Post opportunities or alumni referrals to help the community" : "Check back soon for new opportunities posted by alumni"}
              </p>
              <Link href="/jobs" className="mt-3 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                {isAlumni ? "Post a Job" : "Explore Board"} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href="/jobs"
                  className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex gap-4 items-start hover:shadow-md hover:bg-surface-container-low transition-all active:scale-[0.99] duration-150"
                >
                  <div className={`w-12 h-12 rounded-lg ${job.logoColorClass || "bg-primary-fixed text-primary"} flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden font-bold`}>
                    {job.logoUrl ? (
                      <img className="w-full h-full object-cover" src={job.logoUrl} alt={job.company} />
                    ) : (
                      <span>{job.logoText || job.company?.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-label-md text-label-md text-on-surface truncate pr-2">
                        {job.title}
                      </h3>
                      {job.featured && (
                        <span className="font-label-sm text-label-sm text-primary whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded text-[11px] font-bold">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {job.company} • {job.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </LayoutWrapper>
  );
}
