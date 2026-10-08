"use client";

import React, { useState, useMemo, useEffect } from "react";
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

export default function JobsPage() {
  const { userProfile, user } = useAuth();
  const isAlumni = userProfile?.role === "alumni";

  const [activeTab, setActiveTab] = useState<"browse" | "applied">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string>("All");
  
  // Dynamic lists in state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);

  useEffect(() => {
    async function loadJobs() {
      try {
        const loadedJobs = await fetchJobs();
        setJobs(loadedJobs);
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  const loadUserApps = async () => {
    const uid = userProfile?.uid || user?.uid || "";
    const email = userProfile?.email || user?.email || "";
    if (uid || email) {
      setIsRefreshingApps(true);
      try {
        const userApps = await fetchApplicationsForApplicant(uid, email);
        setApplications(userApps);
      } catch (e) {
        console.error("Failed to load user applications:", e);
      } finally {
        setIsRefreshingApps(false);
      }
    }
  };

  useEffect(() => {
    loadUserApps();
  }, [userProfile?.uid, user?.uid, userProfile?.email, user?.email, activeTab]);

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
    if (!selectedJob) return;
    setIsSubmitting(true);

    const appPayload: Omit<Application, "id"> = {
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      company: selectedJob.company,
      posterId: selectedJob.postedBy || "",
      posterEmail: selectedJob.postedByEmail || "",
      applicantId: userProfile?.uid || "guest",
      applicantName: userProfile?.displayName || userProfile?.email?.split("@")[0] || "Applicant",
      applicantEmail: userProfile?.email || "",
      applicantRole: userProfile?.role || "student",
      resumeName: resumeName || "Resume.pdf",
      coverLetter: coverLetter.trim() || undefined,
      appliedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Under Review",
    };

    try {
      const createdApp = await submitJobApplicationViaApi(appPayload);
      setApplications((prev) => [createdApp, ...prev.filter((a) => a.id !== createdApp.id)]);
    } catch (err) {
      console.error("Failed to submit application:", err);
      const fallbackApp: Application = {
        id: `app-${Date.now()}`,
        ...appPayload,
      };
      setApplications((prev) => [fallbackApp, ...prev]);
    } finally {
      setIsSubmitting(false);
      closeApplyModal();
      setActiveTab("applied");
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
      setJobs([savedJob, ...jobs]);
    } catch (err) {
      // Fallback local addition if network fails
      const fallbackJob: Job = { id: `job-${Date.now()}`, ...jobData };
      setJobs([fallbackJob, ...jobs]);
    }

    setIsCreateModalOpen(false);
    
    // Reset inputs
    setNewTitle("");
    setNewCompany("");
    setNewLocation("");
    setNewType("Full-time");
    setNewLevel("Entry Level");
  };

  return (
    <LayoutWrapper>
      <div className="flex flex-col w-full relative pb-10">
        
        {/* Header / Filters */}
        <div className="px-4 py-4 sticky top-[64px] z-40 bg-surface/95 backdrop-blur-md pb-2 border-b border-surface-container">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  Career Hub
                </h1>
                <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
                  {isAlumni
                    ? "As an alumnus, you have exclusive access to post jobs and referral opportunities."
                    : "Explore and apply for career opportunities posted by verified alumni."}
                </p>
              </div>
              {isAlumni && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="self-start sm:self-auto bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Post a Job
                </button>
              )}
            </div>
            
            {/* Tab switch wrapper */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex bg-surface-container rounded-full p-1 relative shadow-sm max-w-md flex-1">
                <div
                  className="absolute inset-y-1 left-1 bg-surface rounded-full shadow-sm transition-transform duration-300 ease-in-out"
                  style={{
                    width: "calc(50% - 4px)",
                    transform: activeTab === "browse" ? "translateX(0)" : "translateX(100%)",
                  }}
                ></div>
                <button
                  onClick={() => setActiveTab("browse")}
                  className={`flex-1 relative z-10 py-2 text-center font-label-md text-label-md transition-colors font-bold cursor-pointer ${
                    activeTab === "browse" ? "text-on-surface" : "text-on-surface-variant"
                  }`}
                >
                  Browse Jobs
                </button>
                <button
                  onClick={() => setActiveTab("applied")}
                  className={`flex-1 relative z-10 py-2 text-center font-label-md text-label-md transition-colors font-bold cursor-pointer ${
                    activeTab === "applied" ? "text-on-surface" : "text-on-surface-variant"
                  }`}
                >
                  My Applications {applications.length > 0 && `(${applications.length})`}
                </button>
              </div>

              {isAlumni && (
                <Link
                  href="/alumni"
                  className="bg-primary/10 hover:bg-primary text-primary hover:text-on-primary transition-all px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-primary/20 shrink-0 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span>Review Candidate Applicants</span>
                </Link>
              )}
            </div>

            {/* Search & Filters */}
            {activeTab === "browse" && (
              <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide snap-x" style={{ scrollbarWidth: "none" }}>
                <div className="flex-none snap-start relative group w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/70 font-body-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all"
                    placeholder="Search roles, companies..."
                    type="text"
                  />
                </div>

                {/* Job type dropdown */}
                <div className="relative snap-start flex-none">
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="appearance-none bg-surface-container-highest text-on-surface font-label-sm pl-8 pr-8 py-2 rounded-lg hover:bg-surface-container-high transition-colors outline-none cursor-pointer"
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
          </div>
        </div>

        {/* Tab content: Browse Jobs */}
        {activeTab === "browse" && (
          <div className="px-4 py-4 flex flex-col gap-4 relative z-0">
            {filteredJobs.map((job) => {
              return (
                <div
                  key={job.id}
                  className={`rounded-2xl p-6 flex flex-col gap-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 ${
                    job.featured
                      ? "bg-surface-container border-l-4 border-secondary shadow-[0_4px_12px_rgba(214,158,46,0.08)]"
                      : "bg-surface-container-lowest"
                  }`}
                >
                  {job.featured && (
                    <div className="absolute top-0 right-0 p-2.5 bg-secondary text-on-secondary rounded-bl-xl font-label-sm shadow-sm z-10 flex items-center gap-1 text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px] font-fill">star</span>
                      Featured
                    </div>
                  )}

                  <div className="flex items-start gap-4 z-10 pr-16">
                    <div className={`w-12 h-12 rounded-lg ${job.logoColorClass} flex items-center justify-center shadow-sm shrink-0 overflow-hidden font-bold`}>
                      {job.logoUrl ? (
                        <img className="w-full h-full object-cover" src={job.logoUrl} alt={job.company} />
                      ) : (
                        <span>{job.logoText}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <p className="font-body-sm text-on-surface-variant mt-0.5">
                        {job.company} • {job.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 z-10">
                    <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded font-label-sm text-[11px]">
                      {job.type}
                    </span>
                    <span className="bg-surface-container-highest text-on-surface px-2 py-0.5 rounded font-label-sm text-[11px]">
                      {job.level}
                    </span>
                    {job.referral && (
                      <span className="bg-secondary-container/20 text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-[11px] flex items-center gap-0.5 font-bold">
                        <span className="material-symbols-outlined text-[12px] font-fill">people</span>
                        Alumni Referral
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 z-10 pt-2 border-t border-surface-container-low">
                    <span className="font-body-sm text-error flex items-center gap-1 text-[12px] font-medium">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {job.deadline}
                    </span>
                    <button
                      onClick={() => openApplyModal(job)}
                      className="bg-primary text-on-primary hover:bg-primary/95 px-5 py-2 rounded-lg font-label-md shadow-sm transition-all active:scale-95 font-bold cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredJobs.length === 0 && (
              <div className="text-center py-12 bg-surface-container-lowest rounded-2xl shadow-sm border border-dashed border-outline-variant/30 mt-4">
                <span className="material-symbols-outlined text-[48px] text-outline opacity-40">work_off</span>
                <p className="font-headline-md text-on-surface mt-2">No Jobs Found</p>
                <p className="font-body-sm text-on-surface-variant mt-1">
                  Try tweaking your search inputs or filters.
                </p>
              </div>
            )}
          </div>
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
                onClick={loadUserApps}
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

        {/* Floating Action Button (FAB) for posting a job - Alumni only */}
        {isAlumni && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="fixed bottom-20 right-4 w-14 h-14 bg-tertiary hover:bg-tertiary/90 text-on-tertiary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group cursor-pointer"
            aria-label="Post a Job"
          >
            <span className="material-symbols-outlined text-[28px] group-hover:rotate-90 transition-transform duration-300">
              add
            </span>
          </button>
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
