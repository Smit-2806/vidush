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

export default function AlumniDashboardPage() {
  const { userProfile, user } = useAuth();
  const isAlumni = userProfile?.role === "alumni" || userProfile?.role === "admin";

  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const userUid = userProfile?.uid || user?.uid || "";
  const userEmail = userProfile?.email || user?.email || "";

  useEffect(() => {
    async function loadAlumniData() {
      if (!userUid && !userEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load all jobs to find those posted by this alumni
        const allJobs = await fetchJobs();
        const myJobs = allJobs.filter(
          (j) =>
            (j.postedBy && j.postedBy === userUid) ||
            (j.postedByEmail && j.postedByEmail.toLowerCase() === userEmail.toLowerCase())
        );
        // If user is admin or testing and has no posted jobs yet, include all jobs
        const effectiveJobs = myJobs.length > 0 ? myJobs : (userProfile?.role === "admin" ? allJobs : []);
        setPostedJobs(effectiveJobs);

        // Load applications received for jobs posted by this alumni
        const myJobIds = effectiveJobs.map((j) => j.id);
        const apps = await fetchApplicationsForPoster();

        // Also ensure any application matching the job IDs posted by this alumni is included
        const finalApps = apps.filter(
          (a) =>
            (a.posterId && a.posterId === userUid) ||
            (a.posterEmail && a.posterEmail.toLowerCase() === userEmail.toLowerCase()) ||
            myJobIds.includes(a.jobId) ||
            (userProfile?.role === "admin") // Admins can oversee all
        );

        setApplications(finalApps);
      } catch (err) {
        console.error("Failed to load alumni dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAlumniData();
  }, [userUid, userEmail, userProfile?.role]);

  // Handle Candidate Status Change (Selected / Rejected / Under Review)
  const handleStatusChange = async (
    applicationId: string,
    newStatus: "Under Review" | "Selected" | "Rejected"
  ) => {
    setUpdatingAppId(applicationId);
    try {
      await updateApplicationStatusViaApi(applicationId, newStatus);

      // Update state locally
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      const statusMsg =
        newStatus === "Selected"
          ? "Candidate marked as Selected! The applicant will see their offer on their review portal."
          : newStatus === "Rejected"
          ? "Candidate marked as Rejected. The applicant's review portal has been updated."
          : "Candidate status set to Under Review.";
      
      setNotification(statusMsg);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to update candidate status:", err);
      alert("Failed to update candidate status. Please try again.");
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Filtered applicants
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesJob =
        selectedJobFilter === "ALL" || app.jobId === selectedJobFilter;
      const matchesStatus =
        statusFilter === "ALL" || app.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        app.applicantName.toLowerCase().includes(q) ||
        app.applicantEmail.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q) ||
        (app.coverLetter && app.coverLetter.toLowerCase().includes(q));

      return matchesJob && matchesStatus && matchesSearch;
    });
  }, [applications, selectedJobFilter, statusFilter, searchQuery]);

  // Metric counts
  const totalApplicants = applications.length;
  const selectedCount = applications.filter((a) => a.status === "Selected").length;
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length;
  const reviewCount = applications.filter((a) => a.status === "Under Review").length;

  if (!isAlumni && !loading) {
    return (
      <LayoutWrapper>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
            Alumni Access Only
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2">
            The Alumni Career & Applicants Dashboard is reserved for verified alumni members who post job listings and evaluate student applications.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-block bg-primary text-on-primary px-6 py-2.5 rounded-xl font-label-md font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            Explore Job Opportunities
          </Link>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8">
        
        {/* Toast Notification */}
        {notification && (
          <div className="fixed top-20 right-4 z-[100] max-w-md bg-on-surface text-surface px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-down border border-outline-variant/20">
            <span className="material-symbols-outlined text-tertiary text-[22px]">
              check_circle
            </span>
            <p className="text-xs font-semibold flex-1">{notification}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-surface/70 hover:text-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Header Banner */}
        <header className="flex flex-col justify-between gap-5 border-b border-[#d9e2e3] pb-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#54766f]">Alumni workspace <span className="px-1.5 text-[#a1b2b0]">/</span> Hiring</p>
            <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#142f38] sm:text-4xl">Candidate review</h1>
            <p className="mt-2 text-sm text-[#63777d]">Manage opportunities and review applications submitted to your postings.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/jobs"
              className="inline-flex min-h-11 min-w-[168px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#173c42] px-4 text-sm font-semibold text-white transition hover:bg-[#21525a]"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              Post Another Job
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <section aria-label="Applicant totals" className="grid grid-cols-2 divide-x divide-[#d6e0e1] border-y border-[#d6e0e1] py-5 md:grid-cols-4">
          {[
            { label: "Applicants", value: totalApplicants },
            { label: "In review", value: reviewCount },
            { label: "Selected", value: selectedCount },
            { label: "Rejected", value: rejectedCount },
          ].map((metric) => <div key={metric.label} className="px-4 py-2 first:pl-0 md:px-6"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#73868a]">{metric.label}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-[#173c42]">{metric.value}</p></div>)}
        </section>

        {/* Filter Controls & Search */}
        <div className="flex flex-col items-stretch justify-between gap-3 border-b border-[#d9e2e3] pb-4 md:flex-row md:items-center">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by candidate name, email, or cover letter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#cbd8d9] bg-white py-2.5 pl-10 pr-4 text-sm text-[#18343c] outline-none focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            {/* Filter by Job */}
            <select
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="min-h-10 rounded-md border border-[#cbd8d9] bg-white px-3 text-sm font-medium text-[#29474e] outline-none focus:border-[#458a7c]"
            >
              <option value="ALL">All Posted Jobs ({postedJobs.length})</option>
              {postedJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-10 rounded-md border border-[#cbd8d9] bg-white px-3 text-sm font-medium text-[#29474e] outline-none focus:border-[#458a7c]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applicants List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
              Candidate Applicants ({filteredApplications.length})
            </h2>
          </div>

          {loading ? (
            <div className="border-y border-[#d9e2e3] py-16 text-center text-[#718287]">
              <span className="material-symbols-outlined animate-spin text-[36px] text-primary mb-2">
                progress_activity
              </span>
              <p className="text-xs text-on-surface-variant font-medium">Loading applicant records...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="border-y border-dashed border-[#cbd8d9] py-16 text-center text-[#718287]">
              <span className="material-symbols-outlined text-[48px] text-outline opacity-40 mb-2">
                group_off
              </span>
              <h3 className="font-headline-md text-on-surface font-bold">No Applicants Found</h3>
              <p className="font-body-sm text-on-surface-variant text-xs mt-1 max-w-sm">
                {applications.length === 0
                  ? "When students or fellow members apply to your job listings, their submitted profiles and resumes will appear here for your review."
                  : "No applicants matched your current search filters. Try clearing the filter."}
              </p>
              {applications.length === 0 && (
                <Link
                  href="/jobs"
                  className="mt-4 bg-primary text-on-primary px-5 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                >
                  View Job Board
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#dfe7e7] border-y border-[#d9e2e3]">
              {filteredApplications.map((app) => {
                const isSelected = app.status === "Selected";
                const isRejected = app.status === "Rejected";
                const isBusy = updatingAppId === app.id;

                return (
                  <div
                    key={app.id}
                    className="py-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      
                      {/* Left: Applicant Information */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0 border border-primary/20">
                          {app.applicantName?.charAt(0).toUpperCase() || "A"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-headline-md text-base text-on-surface font-bold truncate">
                              {app.applicantName}
                            </h3>
                            <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {app.applicantRole || "student"}
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium">
                              Applied on {app.appliedDate}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                            <a
                              href={`mailto:${app.applicantEmail}`}
                              className="text-primary hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span className="material-symbols-outlined text-[14px]">mail</span>
                              {app.applicantEmail}
                            </a>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium text-on-surface">
                              <span className="material-symbols-outlined text-[14px] text-tertiary">work</span>
                              Role: <strong>{app.jobTitle}</strong> ({app.company})
                            </span>
                          </div>

                          {/* Resume & Documents */}
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface border border-surface-container-high">
                              <span className="material-symbols-outlined text-[16px] text-primary">
                                description
                              </span>
                              <span>Resume: {app.resumeName || "Resume.pdf"}</span>
                            </div>
                          </div>

                          {/* Cover letter expandable */}
                          {app.coverLetter && (
                            <details className="mt-3 group">
                              <summary className="text-xs font-bold text-primary hover:underline cursor-pointer list-none flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">notes</span>
                                Read Candidate Cover Letter
                              </summary>
                              <div className="mt-2 p-3 bg-surface rounded-xl border border-surface-container text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                                {app.coverLetter}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>

                      {/* Right: Decision Controls & Status */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-surface-container">
                        {/* Current Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-on-surface-variant">Status:</span>
                          {isSelected ? (
                            <span className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                                check_circle
                              </span>
                              Selected
                            </span>
                          ) : isRejected ? (
                            <span className="bg-rose-600/15 text-rose-700 dark:text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                              <span className="material-symbols-outlined text-[16px] text-rose-600">
                                cancel
                              </span>
                              Rejected
                            </span>
                          ) : (
                            <span className="bg-amber-600/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                              <span className="material-symbols-outlined text-[16px] text-amber-600">
                                hourglass_top
                              </span>
                              Under Review
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            disabled={isBusy || isSelected}
                            onClick={() => handleStatusChange(app.id, "Selected")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                              isSelected
                                ? "bg-emerald-600 text-white opacity-80 cursor-default"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            } disabled:opacity-50`}
                            title="Mark applicant as Selected"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            <span>{isSelected ? "Selected" : "Select"}</span>
                          </button>

                          <button
                            disabled={isBusy || isRejected}
                            onClick={() => handleStatusChange(app.id, "Rejected")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                              isRejected
                                ? "bg-rose-600 text-white opacity-80 cursor-default"
                                : "bg-rose-600/10 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-600/20"
                            } disabled:opacity-50`}
                            title="Mark applicant as Rejected"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            <span>{isRejected ? "Rejected" : "Reject"}</span>
                          </button>

                          {(isSelected || isRejected) && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleStatusChange(app.id, "Under Review")}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-1 cursor-pointer"
                              title="Reset back to Under Review"
                            >
                              <span className="material-symbols-outlined text-[14px]">replay</span>
                              <span>Reset</span>
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
        </div>

      </div>
    </LayoutWrapper>
  );
}
