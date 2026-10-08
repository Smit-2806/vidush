"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useAuth } from "@/context/AuthContext";
import { UserProfileData } from "@/lib/firestore";
import {
  fetchAllUsers,
  adminEnrollMember,
  updateUserViaApi,
  deleteUserViaApi,
  adminChangePassword,
} from "@/lib/api";

export default function AdminDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();

  const [members, setMembers] = useState<UserProfileData[]>([]);
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
  const [showStoredPassword, setShowStoredPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete Confirmation state (Delete)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<UserProfileData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all members
  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllUsers();
      setMembers(data);
    } catch (err: any) {
      console.error("Failed to load members:", err);
      setFeedback({ type: "error", message: "Failed to load members from database." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadMembers();
    }
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
    } catch (err: any) {
      console.error("Enrollment error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to enroll member. Check if email already exists.",
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
          currentPassword: editingMember.currentPassword,
        });
        updatedFields.currentPassword = editNewPassword.trim();
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
    } catch (err: any) {
      console.error("Update error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to update member profile.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Password Modal
  const openPasswordModal = (member: UserProfileData) => {
    setPasswordTargetMember(member);
    setNewPasswordInput("");
    setShowStoredPassword(false);
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
        currentPassword: passwordTargetMember.currentPassword,
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.uid === passwordTargetMember.uid
            ? { ...m, currentPassword: newPasswordInput.trim() }
            : m
        )
      );

      setFeedback({
        type: "success",
        message: `Password for ${passwordTargetMember.displayName || passwordTargetMember.email} has been updated to "${newPasswordInput.trim()}".`,
      });
      setIsPasswordModalOpen(false);
      setPasswordTargetMember(null);
    } catch (err: any) {
      console.error("Password update error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to update password.",
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
    } catch (err: any) {
      console.error("Delete error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to remove member account.",
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
      <div className="w-full px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Administrator Console
              </span>
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold mt-1.5">
              Member Enrollment &amp; Management
            </h1>
            <p className="font-body-sm text-on-surface-variant text-xs mt-1">
              Enroll new students and alumni, manage portal accounts, and perform real-time updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEnrollRole("student");
                setIsEnrollModalOpen(true);
              }}
              className="bg-primary text-on-primary hover:bg-primary/95 px-5 py-2.5 rounded-xl font-label-md font-bold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Enroll Student
            </button>
            <button
              onClick={() => {
                setEnrollRole("alumni");
                setIsEnrollModalOpen(true);
              }}
              className="bg-secondary text-on-secondary hover:bg-secondary/95 px-5 py-2.5 rounded-xl font-label-md font-bold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
              Enroll Alumnus
            </button>
          </div>
        </div>

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex flex-col justify-between">
            <span className="font-label-sm text-on-surface-variant text-xs font-semibold">Total Accounts</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-3xl font-bold text-on-surface">{stats.total}</span>
              <span className="text-[11px] text-on-surface-variant">registered</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex flex-col justify-between">
            <span className="font-label-sm text-primary text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">school</span> Enrolled Students
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-3xl font-bold text-primary">{stats.students}</span>
              <span className="text-[11px] text-on-surface-variant">active</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex flex-col justify-between">
            <span className="font-label-sm text-secondary text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">history_edu</span> Alumni Members
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-3xl font-bold text-secondary">{stats.alumni}</span>
              <span className="text-[11px] text-on-surface-variant">graduates</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-sm flex flex-col justify-between">
            <span className="font-label-sm text-on-surface-variant text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span> Administrators
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-3xl font-bold text-on-surface">{stats.admins}</span>
              <span className="text-[11px] text-on-surface-variant">staff</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-sm">
          {/* Role Tabs */}
          <div className="flex p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setSelectedRoleFilter("all")}
              className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all cursor-pointer ${
                selectedRoleFilter === "all"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("student")}
              className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all cursor-pointer ${
                selectedRoleFilter === "student"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Students ({stats.students})
            </button>
            <button
              onClick={() => setSelectedRoleFilter("alumni")}
              className={`px-4 py-2 rounded-lg font-label-md text-xs font-bold transition-all cursor-pointer ${
                selectedRoleFilter === "alumni"
                  ? "bg-surface text-secondary shadow-sm"
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
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-xs outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container shadow-sm overflow-hidden">
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/60 border-b border-surface-container text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Batch / Class</th>
                    <th className="py-3 px-4">Company / Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-xs">
                  {filteredMembers.map((member) => {
                    const isMemberAdmin = member.role === "admin";
                    const initial = member.displayName?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || "U";
                    return (
                      <tr key={member.uid} className="hover:bg-surface-container-low/30 transition-colors">
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
                {/* Current/Stored Password display if known */}
                {passwordTargetMember.currentPassword && (
                  <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block">Current Stored Password</span>
                      <span className="font-mono text-xs font-bold text-on-surface tracking-wider">
                        {showStoredPassword ? passwordTargetMember.currentPassword : "••••••••••••"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowStoredPassword(!showStoredPassword)}
                      className="text-on-surface-variant hover:text-on-surface text-xs flex items-center gap-1 cursor-pointer bg-surface-container px-2 py-1 rounded-md"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showStoredPassword ? "visibility_off" : "visibility"}
                      </span>
                      <span>{showStoredPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                )}

                {/* Form to set new password directly */}
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3">
                  <div>
                    <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                      Set New Password *
                    </label>
                    <input
                      type="text"
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
