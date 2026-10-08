# Role & Feature Mind Map

## 1. Core idea of the project
This portal is designed for a student-alumni network. It is not a single-user app; it is a three-role community platform built around these identities:

- Student
- Alumni
- Admin

The main role definitions are declared in the Firestore user profile model and enforced in the frontend and backend logic:

- [vidush/frontend/src/lib/firestore.ts](frontend/src/lib/firestore.ts)
- [vidush/backend/src/controllers/authController.js](backend/src/controllers/authController.js)
- [vidush/backend/src/controllers/jobController.js](backend/src/controllers/jobController.js)
- [vidush/backend/src/controllers/eventController.js](backend/src/controllers/eventController.js)

---

## 2. Number of roles designed
The system is designed for 3 primary roles:

| Role | Meaning | Default landing page |
| --- | --- | --- |
| student | regular student user | /home |
| alumni | verified community member / mentor / recruiter | /home |
| admin | portal manager; controls users, events, access | /admin |

There is also a role-like concept of “alumni dashboard access” where admin is treated as an alumni-level overlay in some pages. In practice, the code does allow admin to perform alumni actions too in specific screens.

---

## 3. Role model in code
The role is stored as a string field called `role` in the user profile:

- `student`
- `alumni`
- `admin`

The type is defined here:

- [vidush/frontend/src/lib/firestore.ts](frontend/src/lib/firestore.ts)

The login redirect logic is here:

- [vidush/frontend/src/app/page.tsx](frontend/src/app/page.tsx)

If the logged user is admin, they are redirected to `/admin`. Otherwise they go to `/home`.

---

## 4. How the app decides who is who
The app syncs user profile data from Firebase Firestore after login and then checks `userProfile.role` throughout the app.

Examples:

- Admin dashboard visibility: [vidush/frontend/src/components/LayoutWrapper.tsx](frontend/src/components/LayoutWrapper.tsx)
- Home page role labels: [vidush/frontend/src/app/home/page.tsx](frontend/src/app/home/page.tsx)
- Job posting permission check: [vidush/frontend/src/app/jobs/page.tsx](frontend/src/app/jobs/page.tsx)
- Event creation permission check: [vidush/frontend/src/app/events/page.tsx](frontend/src/app/events/page.tsx)
- Alumni dashboard access: [vidush/frontend/src/app/alumni/page.tsx](alumni/page.tsx)

So the core decision is literally:

- If `role === "admin"` → admin features unlock
- If `role === "alumni"` → alumni features unlock
- Otherwise → student experience is shown

---

## 5. Role-by-role breakdown

### A. Student
What a student can do:
- Sign in and land on Home
- Browse alumni directory
- Browse jobs and apply for opportunities
- View events
- View own profile
- Use the portal as a regular member of the student community

Student-specific restrictions:
- Cannot post jobs
- Cannot host events
- Cannot access admin dashboard
- Cannot review applicant lists unless explicitly assigned another role

Relevant pages:
- [vidush/frontend/src/app/home/page.tsx](frontend/src/app/home/page.tsx)
- [vidush/frontend/src/app/jobs/page.tsx](frontend/src/app/jobs/page.tsx)
- [vidush/frontend/src/app/events/page.tsx](frontend/src/app/events/page.tsx)
- [vidush/frontend/src/app/profile/page.tsx](frontend/src/app/profile/page.tsx)

### B. Alumni
What an alumni user can do:
- Access the alumni dashboard
- Review applicants for jobs they posted
- Change candidate status: Under Review / Selected / Rejected
- Post job opportunities
- View community posts, alumni directories, events, and student opportunities
- Mentor and assist students through the directory and job network

Key enforcement:
- Backend job creation only allows `alumni` or `admin` roles: [vidush/backend/src/controllers/jobController.js](backend/src/controllers/jobController.js)
- Alumni dashboard access is granted when `role === "alumni" || role === "admin"`: [vidush/frontend/src/app/alumni/page.tsx](frontend/src/app/alumni/page.tsx)
- Alumni also appear in the alumni directory and can be marked as mentors: [vidush/backend/src/controllers/alumniController.js](backend/src/controllers/alumniController.js)

Relevant pages:
- [vidush/frontend/src/app/alumni/page.tsx](frontend/src/app/alumni/page.tsx)
- [vidush/frontend/src/app/jobs/page.tsx](frontend/src/app/jobs/page.tsx)
- [vidush/frontend/src/app/directory/page.tsx](frontend/src/app/directory/page.tsx)
- [vidush/frontend/src/app/home/page.tsx](frontend/src/app/home/page.tsx)

### C. Admin
What an admin can do:
- Access the full admin dashboard
- View all users and their profiles
- Enroll new students and alumni with credentials
- Edit user profiles and reset passwords
- Delete users
- View full user statistics
- Host new events
- See all jobs and applicants as needed
- Equivalent to privileged control over the entire portal

Admin enforcement examples:
- [vidush/frontend/src/app/admin/page.tsx](frontend/src/app/admin/page.tsx)
- [vidush/backend/src/controllers/eventController.js](backend/src/controllers/eventController.js)
- [vidush/backend/src/controllers/jobController.js](backend/src/controllers/jobController.js)

Important behavior:
- Admin is treated as a super-user for many actions.
- The app lets admin see all member data and manage the portal.
- On some pages, admin is allowed to act like alumni or a super-privileged user.

---

## 6. Which roles can do what by page

### /page.tsx (Login landing page)
- Everyone can log in
- After login, admin goes to `/admin`
- All others go to `/home`

### /home
- All roles can use it
- The page adapts UI based on `role`
- Alumni see applicant and job posting actions
- Admin sees host-event quick actions
- Students see general job and event exploration

### /jobs
- All users can browse jobs
- Students can apply
- Alumni can post jobs
- Admin can also act as a privileged manager/oversight user
- backend validation blocks non-alumni/non-admin posting attempts

### /events
- Everyone can view events
- Admin can create/host events
- backend validation blocks non-admin event creation

### /alumni
- Access is limited to alumni and admins
- Alumni can review applicants and manage candidate statuses
- Admin can oversee all posted jobs and candidate flows

### /admin
- Access limited to admin
- Full user management, password reset, enrollment, audit and portal control

### /profile
- All users can view and edit their own profile data
- The profile screen displays different role metadata for student/alumni/admin

### /directory
- Access is general
- It is mainly the alumni directory / mentor network page

---

## 7. Backend permission rules
The backend is enforcing the important security checks.

### Jobs
- Only `alumni` and `admin` can create jobs
- See: [vidush/backend/src/controllers/jobController.js](backend/src/controllers/jobController.js)

### Events
- Only `admin` can create events
- See: [vidush/backend/src/controllers/eventController.js](backend/src/controllers/eventController.js)

### Authentication
- All users are created with a `role` field defaulting to `student`
- See: [vidush/backend/src/controllers/authController.js](backend/src/controllers/authController.js)

### Alumni directory
- It aggregates users whose role is `alumni` and combines them with alumni records
- See: [vidush/backend/src/controllers/alumniController.js](backend/src/controllers/alumniController.js)

---

## 8. Real user flow
A typical flow is:

1. User logs in from the startup page
2. The frontend reads the profile from Firestore
3. The app checks `userProfile.role`
4. The app redirects or enables role-specific UI
5. API requests check the role again in backend controllers before writing sensitive data
6. Admin, alumni, and students each see different page actions and restrictions

This means the app uses both frontend gating and backend enforcement.

---

## 9. Final conclusion
This system is designed around three major user roles:

- Student: community consumer and applicant
- Alumni: mentor + recruiter + job poster + applicant reviewer
- Admin: portal manager and full control user

The project is not an unlimited multi-role system; it is intentionally a university alumni network with a clean permission hierarchy:

- Admin > Alumni > Student

And the app clearly uses that hierarchy to decide what each user can do from each screen.

---

## 10. Best one-line summary
This portal is built as a three-role alumni ecosystem where students browse and apply, alumni recruit and mentor, and admins manage the entire community.
