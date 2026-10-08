export interface User {
  name: string;
  classYear: string;
  role: string;
  avatarUrl: string;
}

export interface EventItem {
  id: string;
  title: string;
  month: string;
  day: string;
  date?: string;
  location: string;
  description?: string;
  status?: "live" | "completed";
  isVirtual: boolean;
  imageUrl: string;
  createdAt?: any;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  status: "registered";
  createdAt?: any;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;          // e.g., Full-time, Internship
  level: string;         // e.g., Mid-Senior, Entry Level
  referral: boolean;     // True if Alumni Referral is available
  featured: boolean;
  postedDate: string;    // e.g., "3 days ago"
  deadline: string;      // e.g., "Ends Nov 15"
  logoColorClass: string; // Tailwind background color class for logo placeholder
  logoText: string;      // Text to show if no image
  logoUrl?: string;
  alumniCount?: number;  // Number of alumni working there
  postedBy?: string;     // UID of the alumni who created the job
  postedByName?: string; // Display name of the alumnus
  postedByEmail?: string;// Contact email of the alumnus
  createdAt?: any;
}

export interface Alumni {
  id: string;
  name: string;
  classYear: string;
  department: string;
  company: string;
  role: string;
  skills: string[];
  avatarUrl: string;
  isVerified: boolean;
  isMentor: boolean;
  email?: string;
  createdAt?: any;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  posterId?: string;       // UID of the alumni who posted the job
  posterEmail?: string;    // Email of the alumni
  applicantId: string;     // UID of applicant
  applicantName: string;   // Name of applicant
  applicantEmail: string;  // Email of applicant
  applicantRole?: string;  // "student" | "alumni"
  resumeName: string;      // Filename of uploaded resume
  coverLetter?: string;    // Cover letter message
  appliedDate: string;     // Formatted application date
  status: "Under Review" | "Selected" | "Rejected";
  updatedAt?: any;
  createdAt?: any;
}

// Clean initial empty datasets (no static demo data)
export const mockUser: User = {
  name: "Alumni Member",
  classYear: "",
  role: "Member",
  avatarUrl: "",
};

export const mockEvents: EventItem[] = [];
export const mockJobs: Job[] = [];
export const mockAlumni: Alumni[] = [];
export const mockApplications: Application[] = [];
