"use client";

import React, { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Job, Application } from "@/data/mockData";
import {
  fetchJobs,
  createJobViaApi,
  submitJobApplicationViaApi,
  fetchApplicationsForApplicant,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

async function loadApplicantApplications(
  setApplications: Dispatch<SetStateAction<Application[]>>,
  setIsRefreshing: Dispatch<SetStateAction<boolean>>
) {
  setIsRefreshing(true);
  try {
    setApplications(await fetchApplicationsForApplicant());
  } catch (error) {
    console.error("Failed to load user applications:", error);
  } finally {
    setIsRefreshing(false);
  }
}

export default function JobsPage() {
  const { userProfile, user } = useAuth();
  const isAlumni = userProfile?.role === "alumni";
  const isStudent = userProfile?.role === "student";

  const [activeTab, setActiveTab] = useState<"browse" | "applied">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string>("All");
  
  // Dynamic lists in state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);

  useEffect(() => {
    fetchJobs().then(setJobs).catch((err) => console.error("Failed to load jobs:", err));
  }, []);

  useEffect(() => {
    if (user && isStudent) {
      void loadApplicantApplications(setApplications, setIsRefreshingApps);
    }
  }, [user, isStudent]);

  // Apply modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Job Creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState("Full-time");
  const [newLevel, setNewLevel] = useState("Entry Level");

  // Dynamic filter list
  const jobTypes = ["All", "Full-time", "Internship", "Part-time"];

  // Filter jobs based on search & filter
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedJobType === "All" || job.type === selectedJobType;

      return matchesSearch && matchesType;
    });
  }, [jobs, searchQuery, selectedJobType]);

  const openApplyModal = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeApplyModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
    setCoverLetter("");
    setResumeName("");
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeName(e.target.files[0].name);
    }
  };

  const submitApplication = async () => {
    if (!selectedJob || !user || !isStudent) return;
    setIsSubmitting(true);

    const appPayload: Omit<Application, "id"> = {
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      company: selectedJob.company,
      posterId: selectedJob.postedBy || "",
      posterEmail: selectedJob.postedByEmail || "",
      applicantId: user.uid,
      applicantName: userProfile.displayName || userProfile.email?.split("@")[0] || "Applicant",
      applicantEmail: userProfile.email || user.email || "",
      applicantRole: "student",
      resumeName: resumeName || "Resume.pdf",
      coverLetter: coverLetter.trim() || undefined,
      appliedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Under Review",
    };

    try {
      const createdApp = await submitJobApplicationViaApi(appPayload);
      setApplications((prev) => [createdApp, ...prev.filter((a) => a.id !== createdApp.id)]);
      closeApplyModal();
      setActiveTab("applied");
    } catch (err) {
      console.error("Failed to submit application:", err);
      alert(err instanceof Error ? err.message : "Unable to submit your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAlumni) {
      alert("Permission restricted: Only verified alumni members can post job opportunities.");
      return;
    }
    if (!newTitle || !newCompany) return;

    const jobData: Omit<Job, "id"> = {
      title: newTitle,
      company: newCompany,
      location: newLocation || "Remote",
      type: newType,
      level: newLevel,
      referral: false,
      featured: false,
      postedDate: "Just now",
      deadline: "Ends in 30 days",
      logoColorClass: "bg-tertiary-fixed text-on-tertiary-fixed",
      logoText: newCompany.substring(0, 2).toUpperCase(),
      postedBy: userProfile?.uid || "",
      postedByName: userProfile?.displayName || "Alumni Member",
      postedByEmail: userProfile?.email || "",
    };

    try {
      const savedJob = await createJobViaApi(jobData);
      setJobs((previous) => [savedJob, ...previous]);
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewCompany("");
      setNewLocation("");
      setNewType("Full-time");
      setNewLevel("Entry Level");
    } catch (err) {
      console.error("Failed to create job:", err);
      alert(err instanceof Error ? err.message : "Unable to post this job. Please try again.");
    }
  };

  return (
    <LayoutWrapper>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-8">
        <header className="flex flex-col gap-5 border-b border-[#d9e2e3] pb-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#54766f]">Community <span className="px-1.5 text-[#a1b2b0]">/</span> Careers</p>
                <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#142f38] sm:text-4xl">Career opportunities</h1>
                <p className="mt-2 text-sm text-[#63777d]">{isAlumni ? "Share an opening or review candidates from your workspace." : "Explore roles shared by alumni across the network."}</p>
              </div>
              {isAlumni && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex min-h-11 items-center gap-2 self-start rounded-md bg-[#173c42] px-4 text-sm font-semibold text-white transition hover:bg-[#21525a] sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Post a Job
                </button>
              )}
            </div>
            
            {/* Tab switch wrapper */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex gap-5 border-b border-[#d9e2e3] sm:border-0">
                <button
                  onClick={() => setActiveTab("browse")}
                  className={`min-h-10 border-b-2 px-1 text-sm font-semibold transition-colors ${activeTab === "browse" ? "border-[#24635d] text-[#205b55]" : "border-transparent text-[#788a8e] hover:text-[#24444b]"}`}
                >
                  Browse Jobs
                </button>
                {isStudent && (
                  <button
                    onClick={() => setActiveTab("applied")}
                    className={`min-h-10 border-b-2 px-1 text-sm font-semibold transition-colors ${activeTab === "applied" ? "border-[#24635d] text-[#205b55]" : "border-transparent text-[#788a8e] hover:text-[#24444b]"}`}
                  >
                    My Applications {applications.length > 0 && `(${applications.length})`}
                  </button>
                )}
              </div>

              {isAlumni && (
                <Link
                  href="/alumni"
                  className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[#24635d] hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span>Review Candidate Applicants</span>
                </Link>
              )}
            </div>

            {/* Search & Filters */}
            {activeTab === "browse" && (
              <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto]">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72868a] text-[20px]">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-h-11 w-full rounded-md border border-[#cbd8d9] bg-white pl-10 pr-4 text-sm text-[#18343c] outline-none placeholder:text-[#879599] focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20"
                    placeholder="Search roles, companies..."
                    type="text"
                  />
                </div>

                {/* Job type dropdown */}
                <div className="relative">
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="min-h-11 appearance-none rounded-md border border-[#cbd8d9] bg-white pl-9 pr-9 text-sm text-[#29474e] outline-none focus:border-[#458a7c]"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === "All" ? "All Types" : type}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-[18px] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    work_outline
                  </span>
                  <span className="material-symbols-outlined text-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
            )}
        </header>

        {/* Tab content: Browse Jobs */}
        {activeTab === "browse" && (
          <section aria-label="Job results" className="divide-y divide-[#dfe7e7] border-b border-[#d9e2e3]">
            {filteredJobs.map((job) => {
              return (
                <div
                  key={job.id}
                  className={`grid gap-4 py-5 transition-colors hover:bg-white/60 md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${job.featured ? "border-l-2 border-[#a45d37] pl-4" : ""}`}
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#e0eeea] font-semibold text-[#245e58]">
                      {job.logoUrl ? (
                        <img className="w-full h-full object-cover" src={job.logoUrl} alt={job.company} />
                      ) : (
                        <span>{job.logoText}</span>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-semibold text-[#17343b]">
                        {job.title}
                      </h3>{job.featured && <span className="text-[10px] font-bold uppercase tracking-wide text-[#a45d37]">Featured</span>}</div>
                      <p className="mt-1 text-sm text-[#718287]">{job.company} <span className="px-1">·</span> {job.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pl-16 md:pl-0">
                    <span className="text-xs font-semibold text-[#355a60]">
                      {job.type}
                    </span>
                    <span className="text-xs text-[#718287]">
                      {job.level}
                    </span>
                    {job.referral && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#a45d37]">
                        <span className="material-symbols-outlined text-[14px]">people</span>
                        Alumni Referral
                      </span>
                    )}
                    <span className="ml-auto text-xs text-[#849398]">{job.deadline}</span>
                    {isStudent ? (
                      <button
                        onClick={() => openApplyModal(job)}
                        className="min-h-9 rounded-md bg-[#205b55] px-4 text-xs font-semibold text-white transition hover:bg-[#174b46]"
                      >
                        Apply
                      </button>
                    ) : !user ? (
                      <Link href="/" className="text-xs font-semibold text-[#24635d] hover:underline">Sign in to apply</Link>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {filteredJobs.length === 0 && <p className="py-12 text-center text-sm text-[#718287]">No jobs match those filters. Try a different search.</p>}
          </section>
        )}

        {/* Tab content: My Applications */}
        {activeTab === "applied" && (
          <div className="px-4 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div>
                <h2 className="text-base font-bold text-on-surface">Application Tracking</h2>
                <p className="text-xs text-on-surface-variant">Live review decisions from alumni job posters</p>
              </div>
              <button
                onClick={() => void loadApplicantApplications(setApplications, setIsRefreshingApps)}
                disabled={isRefreshingApps}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all cursor-pointer shadow-sm disabled:opacity-50"
                title="Check latest status"
              >
                <span className={`material-symbols-outlined text-[16px] text-primary ${isRefreshingApps ? "animate-spin" : ""}`}>
                  sync
                </span>
                <span>{isRefreshingApps ? "Checking..." : "Check Status"}</span>
              </button>
            </div>

            {applications.map((app) => {
              const isSelected = app.status === "Selected";
              const isRejected = app.status === "Rejected";

              return (
                <div
                  key={app.id}
                  className={`rounded-2xl p-6 flex flex-col gap-4 shadow-sm border transition-all ${
                    isSelected
                      ? "bg-emerald-500/5 border-emerald-500/30 shadow-emerald-500/5"
                      : isRejected
                      ? "bg-rose-500/5 border-rose-500/20"
                      : "bg-surface-container-lowest border-surface-container"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                          {app.jobTitle}
                        </h3>
                        {isSelected && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Offer
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-on-surface-variant mt-1">
                        {app.company} • Applied on {app.appliedDate}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isSelected ? (
                        <span className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-label-md flex items-center gap-1.5 text-xs font-bold">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                          Selected
                        </span>
                      ) : isRejected ? (
                        <span className="bg-rose-600/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-label-md flex items-center gap-1.5 text-xs font-bold">
                          <span className="material-symbols-outlined text-[16px] text-rose-600">cancel</span>
                          Rejected
                        </span>
                      ) : (
                        <span className="bg-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-label-md flex items-center gap-1.5 text-xs font-bold">
                          <span className="material-symbols-outlined text-[16px] text-amber-600">hourglass_top</span>
                          In Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Banner Message */}
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium ${
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20"
                        : isRejected
                        ? "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
                        : "bg-surface-container text-on-surface-variant border border-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] shrink-0">
                      {isSelected ? "celebration" : isRejected ? "info" : "pending_actions"}
                    </span>
                    <div>
                      {isSelected && (
                        <span>
                          <strong>Congratulations!</strong> You have been selected by the alumnus who posted this job opportunity. Check your email ({app.applicantEmail}) for follow-up details.
                        </span>
                      )}
                      {isRejected && (
                        <span>
                          The alumnus has reviewed your application and decided not to move forward at this time. Keep exploring other job listings and alumni referrals!
                        </span>
                      )}
                      {!isSelected && !isRejected && (
                        <span>
                          Your application is currently <strong>Under Review</strong> by the alumnus who posted this job. You will see updates here as soon as a decision is made.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-2 border-t border-surface-container">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                      Resume: <strong>{app.resumeName || "Uploaded Resume"}</strong>
                    </span>
                    {app.coverLetter && (
                      <details className="w-full text-xs cursor-pointer group">
                        <summary className="text-primary font-bold hover:underline list-none flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">comment</span>
                          View Cover Letter Submitted
                        </summary>
                        <p className="mt-2 p-3 bg-surface rounded-lg text-on-surface whitespace-pre-wrap border border-surface-container">
                          {app.coverLetter}
                        </p>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}

            {applications.length === 0 && (
              <div className="text-center py-16 bg-surface-container-lowest rounded-2xl shadow-sm border border-dashed border-outline-variant/30 mt-4 flex flex-col items-center justify-center p-6">
                <span className="material-symbols-outlined text-[48px] text-outline opacity-40">assignment_turned_in</span>
                <p className="font-headline-md text-on-surface mt-2 font-bold">No Applications Yet</p>
                <p className="font-body-sm text-on-surface-variant mt-1 max-w-sm">
                  You haven&apos;t submitted any job applications yet. Browse the open job listings above to apply!
                </p>
                <button
                  onClick={() => setActiveTab("browse")}
                  className="mt-4 bg-primary text-on-primary px-5 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Browse Available Jobs
                </button>
              </div>
            )}
          </div>
        )}

        {/* Apply Modal */}
        {isModalOpen && selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity opacity-100"
              onClick={closeApplyModal}
            ></div>
            
            {/* Content Drawer */}
            <div className="relative w-full sm:w-[500px] bg-surface rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col z-10 max-h-[90vh] overflow-hidden animate-slide-up">
              <div className="p-4 flex items-center justify-between border-b border-surface-variant shrink-0">
                <h2 className="font-headline-md text-headline-md text-on-surface">Submit Application</h2>
                <button
                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant rounded-full hover:bg-surface-container transition-colors"
                  onClick={closeApplyModal}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-6">
                <div className="bg-surface-container rounded-lg p-4">
                  <p className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-bold">
                    Applying For
                  </p>
                  <p className="font-body-lg text-on-surface font-semibold mt-1">
                    {selectedJob.title}
                  </p>
                  <p className="font-body-sm text-on-surface-variant">{selectedJob.company}</p>
                </div>

                {/* File Upload UI */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface font-bold">Resume / CV *</label>
                  <label className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-lowest hover:bg-surface-container transition-colors cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="sr-only"
                      onChange={handleResumeUpload}
                    />
                    <span className="material-symbols-outlined text-primary text-[32px] mb-2 group-hover:-translate-y-1 transition-transform">
                      upload_file
                    </span>
                    <p className="font-body-md text-on-surface font-semibold">
                      {resumeName ? resumeName : "Tap to upload resume"}
                    </p>
                    <p className="font-body-sm text-on-surface-variant mt-1 text-[12px]">
                      PDF, DOCX up to 5MB
                    </p>
                  </label>
                </div>

                {/* Cover letter UI */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface font-bold">Cover Letter (Optional)</label>
                  <textarea
                    className="w-full h-32 bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-shadow"
                    placeholder="Introduce yourself and explain why you'd be a great fit..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Action Submit */}
              <div className="p-4 border-t border-surface-variant shrink-0 bg-surface sm:rounded-b-2xl">
                <button
                  disabled={isSubmitting || !resumeName}
                  onClick={submitApplication}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">
                        progress_activity
                      </span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Job Modal - Only accessible to alumni */}
        {isCreateModalOpen && isAlumni && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
              onClick={() => setIsCreateModalOpen(false)}
            ></div>
            <div className="relative w-full sm:w-[500px] bg-surface rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col z-10 max-h-[90vh] overflow-hidden animate-slide-up">
              <div className="p-4 flex items-center justify-between border-b border-surface-variant shrink-0">
                <h2 className="font-headline-md text-headline-md text-on-surface">Post a New Job</h2>
                <button
                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant rounded-full hover:bg-surface-container transition-colors"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto">
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-on-surface text-[12px] font-bold">Job Title *</label>
                    <input
                      required
                      className="bg-surface-container-lowest border border-surface-variant/40 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Software Engineer Intern"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-on-surface text-[12px] font-bold">Company *</label>
                    <input
                      required
                      className="bg-surface-container-lowest border border-surface-variant/40 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Google"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-md text-on-surface text-[12px] font-bold">Location</label>
                    <input
                      className="bg-surface-container-lowest border border-surface-variant/40 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Ahmedabad, Gujarat (Hybrid)"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-on-surface text-[12px] font-bold">Job Type</label>
                      <select
                        className="bg-surface-container-lowest border border-surface-variant/40 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-md text-on-surface text-[12px] font-bold">Experience Level</label>
                      <select
                        className="bg-surface-container-lowest border border-surface-variant/40 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value)}
                      >
                        <option value="Entry Level">Entry Level</option>
                        <option value="Mid-Senior">Mid-Senior</option>
                        <option value="Senior">Senior</option>
                        <option value="Director">Director</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-surface-variant bg-surface shrink-0 sm:rounded-b-2xl">
                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md shadow-sm hover:bg-primary/90 transition-all font-bold cursor-pointer text-center"
                  >
                    Create Job Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
