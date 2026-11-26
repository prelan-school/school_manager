# ScholaECS — Flutter Web & Firebase School Platform

A loosely coupled Entity-Component-System (ECS) school platform with **Admin**, **Teacher**, and **Parent** portals built using Clean Architecture, Riverpod, GoRouter, Firebase Auth (Email/Password + Google Sign-In), and Cloud Firestore (zero SQL anywhere).

## Features & Pages Implemented

1. **Auth & Role Shell (`features/auth`, `app/portal_shell.dart`)**: Email/Password + Google Sign-In via Firebase Auth, role claims routing, plus instant Demo Mode when running locally prior to Firebase configuration.
2. **Loosely Coupled Learner Longitudinal Page (`features/learners`)**: Role-aligned page widgets (`learner_overview`, `learner_timeline`, `learner_assessments`, `learner_diary`, `learner_attendance`, `learner_timetable`, `learner_enrollment`), timeframe filtering (`Since Registration`, `This Term`, `Last 30 Days`, `Custom Range`), and an Admin `Configure Page Widgets` dialog.
3. **School Diary (`features/school_diary`)**: Homework, teacher notes, parent sign-off, dynamic fields (e.g., `awards`, `reading_minutes`) via dialogs.
4. **Schemes of Work DB (`features/schemes`)**: Canonical `SchemeStrand` -> `SchemeSubstrand` tree.
5. **Assessment Books (`features/assessment_books`)**: Pulls `Strand` and `Substrand` directly from Schemes DB by reference ID (zero duplication).
6. **Lesson Plans & Admin Syllabus Coverage (`features/lesson_plans`, `features/admin_dashboard`)**: Marking a Lesson Plan `taught` updates Admin Substrand & Teacher coverage analytics reactively.
7. **Weekly Timetable & Class Register (`features/timetable`, `features/class_register`)**: Clickable period slots opening linked Lesson Plan dialogs; fast roll call with role-scoped staff-only flags.
8. **ECS Component & Widget Studio (`features/schema_studio`)**: Runtime registration of custom entity fields and Learner Page widget visibility/ordering.

## Build for Web & Host on Firebase

1. Ensure Flutter SDK (3.24+) and Firebase CLI are installed locally:
   ```bash
   flutter create --platforms=web .
   dart pub global activate flutterfire_cli
   flutterfire configure
   ```
   Replace `lib/core/firebase/firebase_options_placeholder.dart` usage in `lib/main.dart` with your generated `firebase_options.dart` (`DefaultFirebaseOptions.currentPlatform`).
2. Copy PWA icons into `web/icons/` (`Icon-192.png`, `Icon-512.png`, `Icon-maskable-512.png`).
3. **Default Admin Account (`role: "admin"`)**:
   - The default admin email is preconfigured as `prelanadm@gmail.com` (overridable via `--dart-define=DEFAULT_ADMIN_EMAIL=you@school.edu`, and synced in `firestore.rules`).
   - Sign in with **Google** as `prelanadm@gmail.com` (or register via **Email/Password** and click the verification email link) to automatically create `/users/{uid}` with `role: "admin"`.
   - From **Schema Studio -> Portal Users & Role Assignment**, the Admin can promote other accounts to `teacher` or `admin`.
4. Build the release Web bundle and deploy to Firebase Hosting + Firestore:
   ```bash
   flutter pub get
   flutter build web --release
   firebase deploy --only hosting,firestore
   ```
