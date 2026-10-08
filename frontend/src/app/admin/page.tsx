"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useAuth } from "@/context/AuthContext";
import { Job } from "@/data/mockData";
import { UserProfileData } from "@/lib/firestore";
import {
  fetchAllUsers,
  fetchJobs,
  adminEnrollMember,
  updateUserViaApi,
  deleteUserViaApi,
  adminChangePassword,
} from "@/lib/api";

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();

  const [members, setMembers] = useState<UserProfileData[]>([]);
  const [alumniJobs, setAlumniJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | "student" | "alumni">("all");

  // Notifications / Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Enrollment Modal state (Create)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollRole, setEnrollRole] = useState<"student" | "alumni">("student");
  const [enrollName, setEnrollName] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollPassword, setEnrollPassword] = useState("");
  const [enrollDepartment, setEnrollDepartment] = useState("Computer Engineering");
  const [enrollClassYear, setEnrollClassYear] = useState("2027");
  const [enrollCompany, setEnrollCompany] = useState("");
  const [enrollBio, setEnrollBio] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Edit Modal state (Update)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserProfileData | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"student" | "alumni">("student");
  const [editDepartment, setEditDepartment] = useState("");
  const [editClassYear, setEditClassYear] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Password Modal state (Reset/Update password)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetMember, setPasswordTargetMember] = useState<UserProfileData | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete Confirmation state (Delete)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<UserProfileData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchAllUsers()
      .then(setMembers)
      .catch(() => setFeedback({ type: "error", message: "Failed to load members from database." }))
      .finally(() => setIsLoading(false));
    fetchJobs()
      .then((jobs) => setAlumniJobs(jobs.filter((job) => job.postedBy || job.postedByEmail).slice(0, 5)))
      .catch((err) => console.error("Failed to load alumni job postings:", err));
  }, [authLoading, user]);

  // Derived statistics
  const stats = useMemo(() => {
    const total = members.length;
    const students = members.filter((m) => m.role === "student").length;
    const alumni = members.filter((m) => m.role === "alumni").length;
    const admins = members.filter((m) => m.role === "admin").length;
    return { total, students, alumni, admins };
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        m.displayName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.classYear?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q);

      const matchesRole =
        selectedRoleFilter === "all" || m.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, selectedRoleFilter]);

  // Handle Enrollment Submit (Create)
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollEmail || !enrollPassword || !enrollName) return;

    setIsEnrolling(true);
    setFeedback(null);
    try {
      const newMember = await adminEnrollMember({
        email: enrollEmail.trim().toLowerCase(),
        password: enrollPassword,
        displayName: enrollName.trim(),
        role: enrollRole,
        department: enrollDepartment.trim(),
        classYear: enrollClassYear.trim(),
        company: enrollCompany.trim(),
        bio: enrollBio.trim(),
      });

      setMembers((prev) => [newMember, ...prev]);
      setFeedback({
        type: "success",
        message: `Successfully enrolled ${newMember.displayName} as ${newMember.role === "student" ? "Student" : "Alumnus"}! Initial credentials: ${newMember.email}`,
      });

      // Reset and close
      setIsEnrollModalOpen(false);
      setEnrollName("");
      setEnrollEmail("");
      setEnrollPassword("");
      setEnrollCompany("");
      setEnrollBio("");
    } catch (err: unknown) {
      console.error("Enrollment error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to enroll member. Check if email already exists.",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Open Edit Modal (Update)
  const openEditModal = (member: UserProfileData) => {
    setEditingMember(member);
    setEditName(member.displayName || "");
    setEditRole((member.role as "student" | "alumni") || "student");
    setEditDepartment(member.department || "");
    setEditClassYear(member.classYear || "");
    setEditCompany(member.company || "");
    setEditBio(member.bio || "");
    setEditNewPassword("");
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit (Update)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsUpdating(true);
    setFeedback(null);
    try {
      const updatedFields: Partial<UserProfileData> = {
        displayName: editName.trim(),
        role: editRole,
        department: editDepartment.trim(),
        classYear: editClassYear.trim(),
        company: editCompany.trim(),
        bio: editBio.trim(),
      };

      if (editNewPassword && editNewPassword.trim().length >= 6) {
        await adminChangePassword({
          email: editingMember.email,
          uid: editingMember.uid,
          newPassword: editNewPassword.trim(),
        });
      }

      await updateUserViaApi(editingMember.uid, updatedFields);

      setMembers((prev) =>
        prev.map((m) =>
          m.uid === editingMember.uid ? { ...m, ...updatedFields } : m
        )
      );

      setFeedback({
        type: "success",
        message: `Updated profile details for ${editName} successfully${editNewPassword ? " (including new password)" : ""}.`,
      });
      setIsEditModalOpen(false);
      setEditingMember(null);
      setEditNewPassword("");
    } catch (err: unknown) {
      console.error("Update error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update member profile.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Password Modal
  const openPasswordModal = (member: UserProfileData) => {
    setPasswordTargetMember(member);
    setNewPasswordInput("");
    setIsPasswordModalOpen(true);
  };

  // Handle direct password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetMember || !newPasswordInput) return;
    if (newPasswordInput.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }

    setIsUpdatingPassword(true);
    setFeedback(null);
    try {
      await adminChangePassword({
        email: passwordTargetMember.email,
        uid: passwordTargetMember.uid,
        newPassword: newPasswordInput.trim(),
      });

      setFeedback({
        type: "success",
        message: `Password for ${passwordTargetMember.displayName || passwordTargetMember.email} has been updated.`,
      });
      setIsPasswordModalOpen(false);
      setPasswordTargetMember(null);
    } catch (err: unknown) {
      console.error("Password update error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update password.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Open Delete Confirmation (Delete)
  const openDeleteModal = (member: UserProfileData) => {
    setDeletingMember(member);
    setIsDeleteModalOpen(true);
  };

  // Handle Delete Confirmation (Delete)
  const handleDeleteSubmit = async () => {
    if (!deletingMember) return;

    setIsDeleting(true);
    setFeedback(null);
    try {
      await deleteUserViaApi(deletingMember.uid);
      setMembers((prev) => prev.filter((m) => m.uid !== deletingMember.uid));
      setFeedback({
        type: "success",
        message: `Account for ${deletingMember.displayName || deletingMember.email} has been removed.`,
      });
      setIsDeleteModalOpen(false);
      setDeletingMember(null);
    } catch (err: unknown) {
      console.error("Delete error:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove member account.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
            progress_activity
          </span>
        </div>
      </LayoutWrapper>
    );
  }

  // Access check
  const isAdmin = userProfile?.role === "admin";
  if (!user || !isAdmin) {
    return (
      <LayoutWrapper>
        <div className="max-w-md mx-auto my-16 p-8 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-3">
            lock
          </span>
          <h1 className="font-headline-md text-on-surface font-bold text-xl mb-2">
            Administrator Access Restricted
          </h1>
          <p className="font-body-sm text-on-surface-variant text-xs mb-6 leading-relaxed">
            This dashboard is reserved for portal administrators. Please sign in with an authorized administrator account to manage student and alumni credentials.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="bg-primary text-on-primary font-label-md px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-primary/90 transition-all"
            >
              Go to Sign In
            </Link>
            <Link
              href="/home"
              className="bg-surface-container text-on-surface font-label-md px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-surface-container-high transition-all"
            >
              Portal Home
            </Link>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8">
        <header className="flex flex-col justify-between gap-5 border-b border-[#d9e2e3] pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#54766f]">Administration <span className="px-1.5 text-[#a1b2b0]">/</span> People &amp; access</p>
            <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-[#142f38] sm:text-4xl">
              Member management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#63777d]">
              Manage community access, review enrollment, and monitor alumni hiring activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setEnrollRole("student");
                setIsEnrollModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#173c42] px-4 text-sm font-semibold text-white transition hover:bg-[#21525a]"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Enroll Student
            </button>
            <button
              onClick={() => {
                setEnrollRole("alumni");
                setIsEnrollModalOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#cbd8d9] px-4 text-sm font-semibold text-[#24444b] transition hover:bg-white"
            >
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
              Enroll Alumnus
            </button>
          </div>
        </header>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-3 animate-fade-in ${
              feedback.type === "success"
                ? "bg-secondary-container/20 border-secondary-container/40 text-on-secondary-container"
                : "bg-error/10 border-error/30 text-error"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="material-symbols-outlined text-[18px]">
                {feedback.type === "success" ? "check_circle" : "error"}
              </span>
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <section aria-label="Member totals" className="grid grid-cols-2 divide-x divide-[#d6e0e1] border-y border-[#d6e0e1] py-5 md:grid-cols-4">
          {[
            { label: "All accounts", value: stats.total, icon: "groups" },
            { label: "Students", value: stats.students, icon: "school" },
            { label: "Alumni", value: stats.alumni, icon: "history_edu" },
            { label: "Administrators", value: stats.admins, icon: "admin_panel_settings" },
          ].map((metric) => (
            <div key={metric.label} className="px-4 py-2 first:pl-0 md:px-6">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#73868a]"><span className="material-symbols-outlined text-[15px]">{metric.icon}</span>{metric.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-[#173c42]">{metric.value}</p>
            </div>
          ))}
        </section>

        <section aria-labelledby="alumni-jobs-heading">
          <div className="mb-3 flex items-end justify-between gap-4 border-b border-[#d9e2e3] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6c8584]">Community hiring</p>
              <h2 id="alumni-jobs-heading" className="mt-1 text-lg font-semibold text-[#172f38]">Jobs posted by alumni</h2>
            </div>
            <Link href="/jobs" className="text-xs font-semibold text-[#24635d] hover:underline">Open job board</Link>
          </div>
          {alumniJobs.length ? (
            <div className="divide-y divide-[#e0e8e8] border-b border-[#d9e2e3]">
              {alumniJobs.map((job) => (
                <article key={job.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-4">
                  <h3 className="truncate text-sm font-semibold text-[#18343c]">{job.title}</h3>
                  <p className="truncate text-xs text-[#687d82]">{job.company} <span className="px-1">·</span> {job.location}</p>
                  <p className="truncate text-xs text-[#839296]">{job.postedByName || job.postedByEmail || "Alumni member"}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="border-b border-[#d9e2e3] py-6 text-sm text-[#718287]">No alumni job postings are available yet.</p>
          )}
        </section>

        {/* Filter and Search Bar */}
        <div className="flex flex-col items-stretch justify-between gap-4 border-y border-[#d9e2e3] py-3 md:flex-row md:items-center">
          {/* Role Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedRoleFilter("all")}
              className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all cursor-pointer ${
                selectedRoleFilter === "all"
                    ? "bg-[#e4eeeb] text-[#1d514d]"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("student")}
              className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all cursor-pointer ${
                selectedRoleFilter === "student"
                    ? "bg-[#e4eeeb] text-[#1d514d]"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Students ({stats.students})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("alumni")}
              className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all cursor-pointer ${
                selectedRoleFilter === "alumni"
                    ? "bg-[#e4eeeb] text-[#1d514d]"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Alumni ({stats.alumni})
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name, email, department, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[#cbd8d9] bg-white py-2 pl-9 pr-4 text-sm text-[#18343c] outline-none focus:border-[#458a7c] focus:ring-2 focus:ring-[#458a7c]/20"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-hidden border-y border-[#d9e2e3]">
          {isLoading ? (
            <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
                progress_activity
              </span>
              <span className="text-xs">Loading member accounts...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center p-6">
              <span className="material-symbols-outlined text-[48px] text-outline opacity-40 mb-2">
                group_off
              </span>
              <p className="font-headline-md text-on-surface font-bold text-sm">No Members Found</p>
              <p className="font-body-sm text-xs mt-1 max-w-xs">
                {searchQuery
                  ? "No accounts matched your search terms."
                  : "No students or alumni enrolled yet. Use the buttons above to sign up new members."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#d9e2e3] bg-white text-[10px] font-bold uppercase tracking-[0.1em] text-[#718287]">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Batch / Class</th>
                    <th className="py-3 px-4">Company / Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e8e8] bg-white text-xs">
                  {filteredMembers.map((member) => {
                    const isMemberAdmin = member.role === "admin";
                    const initial = member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || "U";
                    return (
                      <tr key={member.uid} className="transition-colors hover:bg-[#f5f8f7]">
                        {/* Member Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-primary/20">
                              {member.photoURL ? (
                                <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{initial}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-on-surface truncate">{member.displayName || "Unnamed Member"}</p>
                              <p className="text-[11px] text-on-surface-variant truncate">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              member.role === "admin"
                                ? "bg-on-surface/10 text-on-surface"
                                : member.role === "alumni"
                                ? "bg-secondary-container/20 text-secondary"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {member.role === "admin" ? "shield" : member.role === "alumni" ? "history_edu" : "school"}
                            </span>
                            {member.role || "student"}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          {member.department || "—"}
                        </td>

                        {/* Class Year */}
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          {member.classYear || "—"}
                        </td>

                        {/* Company / Career */}
                        <td className="py-3.5 px-4">
                          {member.company ? (
                            <span className="font-semibold text-on-surface">{member.company}</span>
                          ) : member.role === "student" ? (
                            <span className="text-[11px] text-primary font-medium">Undergraduate</span>
                          ) : (
                            <span className="text-on-surface-variant">—</span>
                          )}
                        </td>

                        {/* Actions (CRUD: Edit, Password, Delete) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openPasswordModal(member)}
                              title="Update / Reset Password"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">key</span>
                            </button>

                            <button
                              onClick={() => openEditModal(member)}
                              title="Edit Member Data"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>

                            {!isMemberAdmin && (
                              <button
                                onClick={() => openDeleteModal(member)}
                                title="Remove Account"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Enroll New Member (Create) */}
        {isEnrollModalOpen && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl border border-surface-container max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
                <div>
                  <h2 className="font-headline-md text-on-surface font-bold text-lg">
                    Enroll New {enrollRole === "student" ? "Student" : "Alumnus"}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Generates a verified account in Firebase Auth and Cloud Firestore
                  </p>
                </div>
                <button
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container cursor-pointer text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleEnrollSubmit} className="flex flex-col gap-4">
                {/* Role Toggle */}
                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-bold">
                    Member Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEnrollRole("student")}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        enrollRole === "student"
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">school</span>
                      Current Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnrollRole("alumni")}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        enrollRole === "alumni"
                          ? "bg-secondary text-on-secondary border-secondary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-surface-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">history_edu</span>
                      Alumnus / Graduate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@vsitr.edu"
                      value={enrollEmail}
                      onChange={(e) => setEnrollEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Initial Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Min 6 characters"
                      value={enrollPassword}
                      onChange={(e) => setEnrollPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Engineering"
                      value={enrollDepartment}
                      onChange={(e) => setEnrollDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Class Year / Batch
                    </label>
                    <input
                      type="text"
                      placeholder={enrollRole === "student" ? "e.g. 2027" : "e.g. Class of '23"}
                      value={enrollClassYear}
                      onChange={(e) => setEnrollClassYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {enrollRole === "alumni" && (
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Current Company / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Infosys, Amazon"
                      value={enrollCompany}
                      onChange={(e) => setEnrollCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Bio / Student Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief background or notes on this member..."
                    value={enrollBio}
                    onChange={(e) => setEnrollBio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="px-4 py-2 rounded-lg font-label-md text-on-surface hover:bg-surface-container cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEnrolling}
                    className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 font-bold cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isEnrolling ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                        <span>Create Member Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Member Data (Update) */}
        {isEditModalOpen && editingMember && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl border border-surface-container max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
                <div>
                  <h2 className="font-headline-md text-on-surface font-bold text-lg">
                    Edit Member Profile
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Update student or alumni records, department, or promote graduation status
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container cursor-pointer text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Account Role (Promotion)
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as "student" | "alumni")}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="student">Student</option>
                      <option value="alumni">Alumnus (Graduated)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Batch / Class Year
                    </label>
                    <input
                      type="text"
                      value={editClassYear}
                      onChange={(e) => setEditClassYear(e.target.value)}
                      placeholder="e.g. 2027 or Class of '24"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      placeholder="e.g. Information Technology"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="e.g. Microsoft"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                    Bio / Future Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Bio or future career aspirations..."
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary resize-none"
                  ></textarea>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex flex-col gap-1.5">
                  <label className="font-label-md text-on-surface block text-xs font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">lock_reset</span>
                    Update Member Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters) or leave blank to keep current"
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-secondary font-mono"
                  />
                  <p className="text-[11px] text-on-surface-variant">Leave empty if you do not want to change this member&apos;s password.</p>
                </div>

                <div className="flex gap-3 justify-end mt-2 pt-3 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-lg font-label-md text-on-surface hover:bg-surface-container cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 font-bold cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isUpdating ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation (Delete) */}
        {isDeleteModalOpen && deletingMember && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-6 shadow-xl border border-surface-container text-center">
              <span className="material-symbols-outlined text-[48px] text-error mb-2">
                warning
              </span>
              <h2 className="font-headline-md text-on-surface font-bold text-base mb-1">
                Remove Member Account?
              </h2>
              <p className="text-xs text-on-surface-variant mb-5 leading-relaxed">
                Are you sure you want to delete the account for{" "}
                <span className="font-bold text-on-surface">{deletingMember.displayName || deletingMember.email}</span>?
                This action will delete their profile from the database.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteSubmit}
                  className="px-5 py-2 rounded-lg font-label-md bg-error text-on-error hover:bg-error/90 cursor-pointer text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Update / Reset Password */}
        {isPasswordModalOpen && passwordTargetMember && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-surface-container">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">key</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-on-surface font-bold text-base">
                      Password Management
                    </h2>
                    <p className="text-xs text-on-surface-variant truncate max-w-[240px]">
                      {passwordTargetMember.displayName || passwordTargetMember.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container cursor-pointer text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Set a new password through the authenticated admin API. */}
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3">
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Set New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password (min 6 characters)"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-secondary font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPasswordInput}
                    className="w-full py-2.5 rounded-xl font-label-md bg-secondary text-on-secondary hover:bg-secondary/90 font-bold cursor-pointer text-xs disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                        <span>Save &amp; Update Password</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
