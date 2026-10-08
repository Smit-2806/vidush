"use client";

import React, { useState } from "react";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { uploadPhotoViaApi } from "@/lib/api";

function compressImage(file: File, maxDimension = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const dataUrl = readerEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, updateUserProfilePhoto, updateUserProfileDetails, logout } = useAuth();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editClassYear, setEditClassYear] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || userProfile?.email || "";
  const userPhoto = userProfile?.photoURL || user?.photoURL || "";
  const userInitial = displayName.charAt(0).toUpperCase();
  const userRole =
    userProfile?.role === "admin"
      ? "Portal Administrator"
      : userProfile?.role === "alumni"
      ? "Alumni Partner"
      : "Student Member";
  const classYear = userProfile?.role === "admin" ? "Administrative Staff" : (userProfile?.classYear || "Member");
  const department = userProfile?.department || (userProfile?.role === "admin" ? "Administration" : "Computer Science");
  const company = userProfile?.company || (userProfile?.role === "admin" ? "VSITR Portal Admin" : "");
  const bio = userProfile?.bio || (userProfile?.role === "admin" ? "System Administrator with full access to user management and portal controls." : "Member of the VSITR Alumni Community.");

  const openPhotoModal = () => {
    setPhotoUrlInput(userPhoto);
    setPhotoPreview(userPhoto || null);
    setUploadStatus(null);
    setIsPhotoModalOpen(true);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = photoUrlInput.trim();
    if (!url) return;
    setIsSaving(true);
    setUploadStatus("Saving photo...");
    try {
      await updateUserProfilePhoto(url);
      setUploadStatus("Photo updated!");
      setTimeout(() => {
        setIsPhotoModalOpen(false);
        setUploadStatus(null);
      }, 500);
    } catch (err: any) {
      alert("Failed to update profile photo: " + (err?.message || "Unknown error"));
      setUploadStatus(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (e.g. JPG, PNG, WebP).");
      return;
    }

    setIsSaving(true);
    setUploadStatus("Processing image...");

    try {
      // 1. Client-side downscaling and compression to avatar dimensions
      const compressedDataUrl = await compressImage(file, 400, 0.85);
      setPhotoPreview(compressedDataUrl);
      setUploadStatus("Uploading image...");

      // 2. Upload to backend for persistent hosted URL
      let finalUrl = compressedDataUrl;
      try {
        const hostedUrl = await uploadPhotoViaApi(compressedDataUrl);
        if (hostedUrl) finalUrl = hostedUrl;
      } catch (uploadErr) {
        console.warn("Backend upload notice, using compressed image:", uploadErr);
      }

      // 3. Persist to Firestore and Auth
      setUploadStatus("Saving to profile...");
      await updateUserProfilePhoto(finalUrl);

      setUploadStatus("Photo updated successfully!");
      setTimeout(() => {
        setIsPhotoModalOpen(false);
        setPhotoPreview(null);
        setUploadStatus(null);
      }, 600);
    } catch (err: any) {
      console.error("Failed to update photo:", err);
      alert("Failed to update photo: " + (err?.message || "Unknown error"));
      setUploadStatus(null);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = () => {
    setEditName(displayName);
    setEditDept(department);
    setEditClassYear(classYear);
    setEditCompany(company);
    setEditBio(bio);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfileDetails({
        displayName: editName.trim(),
        department: editDept.trim(),
        classYear: editClassYear.trim(),
        company: editCompany.trim(),
        bio: editBio.trim(),
      });
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex flex-col w-full px-4 gap-6 mt-4 pb-16 max-w-2xl mx-auto">
        <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-10 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          {/* Accent Header */}
          <div className="absolute top-0 inset-x-0 h-2 bg-primary"></div>

          {/* Profile Photo with Edit Badge */}
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 shadow-md bg-surface-container flex items-center justify-center text-primary text-4xl font-bold">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <button
              onClick={openPhotoModal}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-all cursor-pointer active:scale-95"
              title="Change profile photo"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>
          </div>

          <button
            onClick={openPhotoModal}
            className="text-xs text-primary font-semibold hover:underline mb-2 cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            {userPhoto ? "Change Photo" : "Upload Photo"}
          </button>

          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
            {displayName}
          </h1>
          <p className="font-body-md text-primary font-medium mt-0.5">
            {displayEmail}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant opacity-75 mt-1">
            {classYear} • {department}
          </p>

          <div className="w-full h-[1px] bg-surface-container-high my-6"></div>

          <div className="w-full flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-label-md text-on-surface font-bold uppercase text-[11px] tracking-wider">
                Profile Summary
              </h3>
              <button
                onClick={openEditModal}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                Edit Details
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">
              {bio}
            </p>

            <div className="flex flex-col gap-2 mt-2 bg-surface-container-low p-4 rounded-xl">
              <div className="flex justify-between items-center text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Account Email:</span>
                <span className="text-on-surface font-semibold text-xs">
                  {displayEmail}
                </span>
              </div>
              {company && (
                <div className="flex justify-between items-center text-body-sm font-body-sm mt-1">
                  <span className="text-on-surface-variant">Company / Organization:</span>
                  <span className="text-on-surface font-semibold text-xs">
                    {company}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-body-sm font-body-sm mt-1">
                <span className="text-on-surface-variant">Account Status:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                    userProfile?.role === "admin"
                      ? "bg-purple-600/15 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                      : userProfile?.role === "alumni"
                      ? "bg-amber-600/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                      : "bg-primary-fixed/20 text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {userProfile?.role === "admin"
                      ? "shield_person"
                      : userProfile?.role === "alumni"
                      ? "history_edu"
                      : "school"}
                  </span>
                  {userRole}
                </span>
              </div>
              <div className="flex justify-between items-center text-body-sm font-body-sm mt-1">
                <span className="text-on-surface-variant">Account Verified:</span>
                <span className="text-tertiary font-bold bg-tertiary-container/10 px-2.5 py-0.5 rounded text-[11px] flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px] font-fill">verified</span>
                  {user?.emailVerified || userProfile?.role === "admin" ? "Verified" : "Active"}
                </span>
              </div>
            </div>

            {userProfile?.role === "admin" && (
              <Link
                href="/admin"
                className="w-full bg-primary/10 text-primary hover:bg-primary/20 py-3 rounded-xl mt-2 transition-all font-bold text-xs flex items-center justify-center gap-2 border border-primary/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                Go to Admin Dashboard
              </Link>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full bg-error text-on-error hover:bg-error/90 py-4 rounded-xl mt-4 shadow-sm transition-all font-bold active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </div>

      {/* Photo Update Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-surface-container">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h2 className="font-headline-md text-on-surface font-bold">Update Profile Photo</h2>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="flex flex-col gap-4">
              {/* Photo Preview */}
              {photoPreview && (
                <div className="flex flex-col items-center justify-center p-3 bg-surface-container-low rounded-xl border border-surface-container">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow-sm bg-surface-container">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-2 font-medium">Selected Photo Preview</span>
                </div>
              )}

              {/* Status Message */}
              {uploadStatus && (
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 text-primary rounded-xl text-xs font-semibold">
                  {isSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{uploadStatus}</span>
                </div>
              )}

              <div>
                <label className="font-label-md text-on-surface block mb-1.5 text-xs font-semibold">
                  Upload image file from device
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isSaving}
                  onChange={handleFileUpload}
                  className="w-full text-xs text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-[1px] bg-surface-container"></div>
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">or paste URL</span>
                <div className="flex-1 h-[1px] bg-surface-container"></div>
              </div>

              <div>
                <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                  Image Web URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrlInput}
                  disabled={isSaving}
                  onChange={(e) => {
                    setPhotoUrlInput(e.target.value);
                    if (e.target.value.trim().startsWith("http")) {
                      setPhotoPreview(e.target.value.trim());
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface hover:bg-surface-container cursor-pointer text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !photoUrlInput.trim()}
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 font-bold cursor-pointer text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? "Saving..." : "Save Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-surface-container max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
              <h2 className="font-headline-md text-on-surface font-bold">Edit Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
              <div>
                <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                  Department / Major
                </label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                  Class Year
                </label>
                <input
                  type="text"
                  value={editClassYear}
                  onChange={(e) => setEditClassYear(e.target.value)}
                  placeholder="e.g. Class of '25"
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
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
                  placeholder="e.g. Google, TCS, Student"
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label-md text-on-surface block mb-1 text-xs font-semibold">
                  Profile Bio Summary
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Share a short summary about yourself..."
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low border border-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-on-surface hover:bg-surface-container cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary/90 font-bold cursor-pointer text-xs disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
