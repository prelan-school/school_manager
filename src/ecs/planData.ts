export interface PlanChapter {
  id: string;
  number: string;
  title: string;
  summary: string;
  highlights: { heading: string; body: string }[];
  diagram?: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export const FLUTTER_ECS_CHAPTERS: PlanChapter[] = [
  {
    id: 'ecs-philosophy',
    number: '01',
    title: 'ECS Core Paradigm & Loose Coupling on Firestore',
    summary:
      'Instead of rigid schemas or duplicated nested records, every school record is modeled as a lightweight Firestore Entity document composed with typed Core Components and runtime-extensible Dynamic Component maps.',
    diagram: `┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHOLA-ECS FIREBASE ARCHITECTURE LAYER                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ENTITIES (Firestore Document ID + Type + Lightweight EntityRef IDs)        │
│    learner_014 · strand_m1 · substrand_1_1 · diary_902 · assess_411         │
├─────────────────────────────────────────────────────────────────────────────┤
│  CORE COMPONENTS (Typed Dart Models Mapped From Firestore Docs)             │
│    IdentityComp · SchemeNodeComp · LessonDeliveryComp · AttendanceComp      │
├─────────────────────────────────────────────────────────────────────────────┤
│  DYNAMIC COMPONENT REGISTRY (/component_schemas Collection)                 │
│    diary_entry   + { awards: Text, reading_minutes: Number }                │
│    assessment    + { intervention_plan: Select }                            │
│    attendance    + { uniform_compliant: Bool [Teacher/Admin only] }         │
├─────────────────────────────────────────────────────────────────────────────┤
│  SYSTEMS (Pure Riverpod Evaluators Watching Firestore Snapshots)            │
│    CurriculumLinkSystem  -> Joins Schemes into Assessment & Lesson Plans    │
│    SyllabusCoverageSystem-> Aggregates Taught Plans vs Substrand Targets    │
│    PortalProjectionSystem-> Filters Entities & Fields by Role RBAC          │
└─────────────────────────────────────────────────────────────────────────────┘`,
    highlights: [
      {
        heading: 'Entities Are Pure Document Anchors',
        body: 'Each Firestore document carries an immutable doc ID, entityType, timestamps, and foreign EntityRef IDs (e.g., strandId, substrandId). No curriculum text or student biodata is duplicated into downstream collections.',
      },
      {
        heading: 'Dynamic Component Registry (Runtime Extensibility)',
        body: 'Admins register ComponentFieldDefinitions (e.g., "awards" on diary_entry) in /component_schemas. Flutter builds form inputs declaratively at runtime and stores values inside each document\'s native customFields Map.',
      },
      {
        heading: 'Zero-Duplication Relational Pulling',
        body: 'Assessment Books and Lesson Plans store only strandId and substrandId document IDs pointing into /scheme_strands and /scheme_substrands. Updating a Substrand outcome updates every linked view instantly.',
      },
    ],
  },
  {
    id: 'flutter-client',
    number: '02',
    title: 'Flutter Multi-Portal & Firebase Offline-First Stack',
    summary:
      'A single Flutter codebase compiles for Android, iOS, Web (Admin), and Desktop, partitioned by role-aware GoRouter shells and powered end-to-end by Firebase Auth, Cloud Firestore real-time streams, and Firestore built-in offline persistence.',
    diagram: `lib/
├── core/
│   ├── ecs/               # SchoolEntity, ComponentSchema, DynamicFieldFactory
│   ├── firebase/          # FirebaseAuth, Firestore persistence settings, Rules err map
│   └── rbac/              # PortalGuard, FieldVisibilityPolicy
├── portals/
│   ├── admin_shell/       # Coverage Analytics, Schema Studio, Master Timetable
│   ├── teacher_shell/     # Fast Roll-Call, Diary Batching, Lesson Marking
│   └── parent_shell/      # Child Timeline, Diary Sign-Off, Assessment Feed
└── modules/
    ├── school_diary/      ├── schemes_db/        ├── assessment_books/
    ├── lesson_plans/      ├── timetable/         └── class_register/`,
    highlights: [
      {
        heading: 'Riverpod 2.x Reactive Firestore Queries',
        body: 'Each System is a pure Riverpod provider watching Firestore collection snapshots(). Marking a Lesson Plan as "Taught" triggers Firestore local cache immediately and updates Admin dashboards in <16ms.',
      },
      {
        heading: 'Built-In Firestore Offline Persistence (Zero Local DB Boilerplate)',
        body: 'With FirebaseFirestore.instance.settings = const Settings(persistenceEnabled: true), teachers in low-connectivity classrooms record Class Register, Diary, and Lesson updates locally—Firestore automatically queues and reconciles writes on reconnect.',
      },
      {
        heading: 'Declarative DynamicFormBuilder Widget',
        body: 'A single Flutter widget maps ComponentFieldDefinition types (text, number, boolean, select, date) to Material/Cupertino inputs, enforcing role editability and required validation consistently.',
      },
    ],
  },
  {
    id: 'six-modules',
    number: '03',
    title: 'Module Coupling & Firestore Collection Matrix',
    summary:
      'Each of the six core school modules owns a top-level Firestore collection while composing shared Entities via lightweight document IDs—turning Admin oversight into a natural real-time query.',
    table: {
      headers: ['Module', 'Firestore Collection & Core Fields', 'Pulls Document IDs From', 'Admin / Parent Projection'],
      rows: [
        [
          '1. School Diary',
          '/diary_entries — Homework, Teacher Note, Sign-off + customFields Map',
          'learners, classrooms, teachers',
          'Admin: Engagement audit · Parent: Child feed + Acknowledge button',
        ],
        [
          '2. Schemes DB',
          '/scheme_strands & /scheme_substrands — Outcomes, Target Lessons',
          'subjects, terms',
          'Admin: Curriculum governance · Parent: Optional syllabus summary',
        ],
        [
          '3. Assessment Books',
          '/assessment_entries — Mastery, Score %, Comment + customFields Map',
          'scheme_strands, scheme_substrands, learners',
          'Admin: Mastery distribution · Parent: Child progress & comments',
        ],
        [
          '4. Lesson Plans',
          '/lesson_plans — Title, Date, Delivered Count, Status (planned/in_progress/taught)',
          'scheme_substrands, timetable_slots',
          'Admin: Real-time syllabus coverage % per teacher & substrand',
        ],
        [
          '5. Timetable',
          '/timetable_slots — Weekday, Period, Time Range, Room Code',
          'classrooms, subjects, teachers',
          'Admin: Conflict & load check · Parent: Child weekly schedule',
        ],
        [
          '6. Class Register',
          '/attendance_records — Date, Status, Remark + customFields Map',
          'learners, classrooms',
          'Admin: Chronic absence alerts · Parent: Instant attendance status',
        ],
      ],
    },
    highlights: [
      {
        heading: 'How Admin Tracks What Teachers Have Taught',
        body: 'Every LessonPlan links a TimetableSlot to a SchemeSubstrand. When a teacher flips status to "Taught" and logs lessonsDelivered, SyllabusCoverageSystem rolls up deliveredLessons / targetLessons per Substrand, Strand, Subject, and Teacher automatically.',
      },
      {
        heading: 'Zero Re-Entry in Assessment Books',
        body: 'Teachers never type strand or substrand names inside Assessment Books. Selecting a Subject queries /scheme_strands and /scheme_substrands directly, freeing 100% of teacher effort for learner commentary.',
      },
    ],
  },
  {
    id: 'rbac-security',
    number: '04',
    title: 'Firebase Auth, Three-Portal RBAC & Field Visibility',
    summary:
      'Firebase Authentication (Email/Password + Google Sign-In) establishes identity, while Firestore Security Rules and Dynamic Component visibleTo/editableBy policies isolate Parent, Teacher, and Admin data.',
    table: {
      headers: ['Capability / Collection', 'Admin Portal', 'Teacher Side', 'Parent Portal'],
      rows: [
        ['/component_schemas', 'Create / Edit / Archive', 'Read-only (or Subject Lead)', 'Hidden'],
        ['/diary_entries (Homework, Awards)', 'Full school read/write', 'Create & edit own class', 'Read own child + Sign-off'],
        ['/scheme_strands & substrands', 'Approve & audit all', 'Register & curate assigned', 'View syllabus outline'],
        ['/assessment_entries', 'All learners & analytics', 'Log mastery & comments', 'View own child reports'],
        ['/lesson_plans & Coverage', 'Live teacher coverage audit', 'Plan & mark Taught', 'Aggregated class progress'],
        ['/attendance_records', 'School-wide attendance', 'Daily roll call + internal flags', 'Child attendance & alerts'],
      ],
    },
    highlights: [
      {
        heading: 'Zero-Trust Firestore Security Rules',
        body: 'Server-side firestore.rules verify request.auth != null, email_verified == true, and lookup user roles in /users/{uid} or /admins/{uid}. Parents can only query records where learnerId is in their verified guardian mapping.',
      },
      {
        heading: 'Email/Password + Google Auth Flow',
        body: 'AuthRepository supports both GoogleAuthProvider (popup/native) and Email/Password credentials. Upon sign-in, RoleClaimsProvider watches /users/{uid} and routes the user into AdminShell, TeacherShell, or ParentShell.',
      },
    ],
  },
  {
    id: 'clean-architecture',
    number: '05',
    title: 'Flutter Clean Architecture & Project Structure',
    summary:
      'Organize the Flutter codebase using a Feature-First Clean Architecture pattern with three strict concentric layers (Presentation, Domain, Data) plus a shared Firebase & ECS Kernel.',
    diagram: `lib/
├── main.dart                          # Firebase.initializeApp() + persistenceEnabled
├── core/
│   ├── ecs/
│   │   ├── school_entity.dart         # Generic Entity<T> + customFields map
│   │   ├── component_schema.dart      # DynamicFieldSchema & validation rules
│   │   └── dynamic_field_factory.dart # Runtime Flutter widget builder
│   ├── auth/
│   │   ├── firebase_auth_repo.dart    # Email/Password + Google Sign-In
│   │   └── role_claims_provider.dart  # Resolves Role from /users/{uid}
│   └── firestore/
│       └── firestore_error_mapper.dart# Structured permission/offline handling
├── features/
│   ├── schemes/                       # Canonical Strand -> Substrand entities
│   │   ├── domain/                    # SchemeStrand, SchemeSubstrand, UseCases
│   │   ├── data/                      # FirestoreSchemesRepository
│   │   └── presentation/              # SchemesTreeScreen, StrandEditorDialog
│   ├── lesson_plans/                  # Links TimetableSlot + SchemeSubstrand
│   │   ├── domain/                    # LessonPlan, CoverageCalculator
│   │   ├── data/                      # FirestoreLessonPlanRepository
│   │   └── presentation/              # LessonPlannerScreen, MarkTaughtSheet
│   ├── assessment_books/              # Pulls Strands/Substrands by EntityRef
│   ├── school_diary/                  # Homework + Dynamic Fields (Awards, etc.)
│   ├── timetable/                     # Weekly periods linked to Lesson Plans
│   ├── class_register/                # Daily attendance + role-filtered flags
│   └── admin_dashboard/               # Cross-entity SyllabusCoverageSystem UI
└── portals/
    ├── admin_shell.dart               # GoRouter shell: all 6 modules + Schema Studio
    ├── teacher_shell.dart             # GoRouter shell: daily workflow + Schemes
    └── parent_shell.dart              # GoRouter shell: child-scoped read + Diary sign`,
    highlights: [
      {
        heading: 'Domain Layer (Pure Dart, Zero Firebase Imports)',
        body: 'Holds immutable entities (SchoolEntity, SchemeSubstrand, LessonPlan), pure ECS systems (SyllabusCoverageSystem), and abstract Repository interfaces. Easily unit-tested with dart test.',
      },
      {
        heading: 'Data Layer (100% Cloud Firestore Streams)',
        body: 'Implements Domain repository contracts using Cloud Firestore snapshots() and WriteBatch atomic commits, mapping Firestore document Maps cleanly into Domain entities and customFields.',
      },
      {
        heading: 'Presentation Layer (Portals & Declarative Widgets)',
        body: 'Thin Flutter widgets consuming Riverpod AsyncValue providers. Dynamic fields (like Diary Awards) render via DynamicFieldFactory without hardcoding module screens.',
      },
    ],
  },
  {
    id: 'repository-and-state',
    number: '06',
    title: 'Loosely Coupled Repository Layer & Reactive State Strategy',
    summary:
      'Repositories expose role-projected Firestore streams rather than static fetches. Riverpod derives Admin Coverage state from the same live LessonPlan and Schemes streams that Teachers mutate.',
    diagram: `  [Teacher UI: Mark Lesson "Taught"]
                 │
                 ▼  (optimistic Firestore local cache write + cloud sync)
    FirestoreLessonPlanRepository.markLessonStatus(planId, LessonStatus.taught)
                 │
                 ▼  Firestore snapshots() emits updated document
    ┌───────────────────────────────────────────────────────────┐
    │  Riverpod StreamProvider: lessonPlansStreamProvider       │
    │  Riverpod StreamProvider: schemeSubstrandsStreamProvider  │
    │  Riverpod StreamProvider: dynamicSchemasStreamProvider    │
    └────────────┬────────────────────────────────┬─────────────┘
                 │ ref.watch(...)                 │ ref.watch(...)
                 ▼                                ▼
    [Teacher Lesson List UI]       [Derived Provider: adminCoverageProvider]
                                                  │
                                                  ▼
                                   [Admin Tracking Dashboard]
                                   (Auto-recomputes % coverage in <16ms)`,
    highlights: [
      {
        heading: 'Role-Scoped Repository Queries (Teacher / Admin / Parent)',
        body: 'Every repository accepts a PortalScope (AdminAllScope, TeacherScope(teacherId), or ParentScope(learnerIds)). Firestore queries apply matching .where() predicates enforced server-side by firestore.rules.',
      },
      {
        heading: 'Automatic Lesson Plan -> Admin Dashboard Reflection',
        body: 'Because adminCoverageProvider is a pure Riverpod Provider that ref.watch()-es both schemeSubstrandsStreamProvider and lessonPlansStreamProvider, any Teacher status change in Firestore immediately triggers deterministic recomputation in the Admin dashboard.',
      },
      {
        heading: 'No Manual Refresh or Polling',
        body: 'Firestore gRPC listeners push document deltas directly to active Admin, Teacher, and Parent sessions—including Parent Diary acknowledgment badges and Class Register alerts.',
      },
    ],
  },
  {
    id: 'firebase-migration',
    number: '07',
    title: 'Part-by-Part Migration Plan to 100% Firebase',
    summary:
      'Step-by-step cutover strategy to eliminate all local or relational database layers completely and run 100% on Firebase Authentication, Cloud Firestore, Firestore Offline Persistence, Security Rules, and Cloud Functions.',
    table: {
      headers: ['Migration Stage', 'Part Being Migrated', 'Firebase Target Implementation', 'Cutover & Verification Gate'],
      rows: [
        [
          'Part 1 · Identity & RBAC',
          'Local session/role switchers & static user records',
          'Firebase Auth (Email/Password + Google) + /users/{uid} & /admins/{uid}',
          'Enable Email/Password + Google in Firebase Console; verify GoRouter redirects by role.',
        ],
        [
          'Part 2 · ECS Schema Studio',
          'In-memory dynamicFields array',
          '/component_schemas/{schemaId} + StreamProvider + Admin-only write rules',
          'Add "awards" in Schema Studio; verify Teacher & Parent forms reflect it live.',
        ],
        [
          'Part 3 · Canonical Schemes DB',
          'Seeded strands/substrands & any local persistence packages',
          '/subjects, /scheme_strands, /scheme_substrands + Firestore offline cache',
          'Remove all local relational packages; verify offline read/write via Firestore persistenceEnabled.',
        ],
        [
          'Part 4 · Teacher Daily Loop',
          'School Diary, Timetable & Class Register',
          '/diary_entries, /timetable_slots, /attendance_records with native customFields Maps',
          'Verify Parent Portal strips Teacher-only flags (uniform_compliant) via rules & projections.',
        ],
        [
          'Part 5 · Assessments & Lesson Plans',
          'In-memory Assessment & Lesson Plan mutations',
          '/assessment_entries & /lesson_plans pulling strandId/substrandId via WriteBatch',
          'Confirm zero text duplication and verify exists() parent checks in firestore.rules.',
        ],
        [
          'Part 6 · Admin Coverage & Alerts',
          'Client-only rollups & notification stubs',
          'Riverpod derived streams + Firestore count()/sum() + Cloud Functions FCM triggers',
          'Flip Teacher Lesson Plan to Taught; verify <1s Admin Coverage update & zero relational deps.',
        ],
      ],
    },
    highlights: [
      {
        heading: 'Zero Relational Dependencies in pubspec.yaml',
        body: 'Use only firebase_core, firebase_auth, cloud_firestore, google_sign_in, firebase_messaging, and flutter_riverpod. Remove any local relational drivers, ORM code generators, or sync outbox tables.',
      },
      {
        heading: 'Firestore Composite Indexes & Security Testing',
        body: 'Deploy firestore.indexes.json for compound queries (e.g., classroomId + date on diary_entries and attendance_records) and validate all Eight Pillars in the Firebase Local Emulator Suite before production rollout.',
      },
    ],
  },
];

export const DART_ECS_SNIPPET = `// 1. DOMAIN LAYER: lib/core/ecs/ecs_models.dart
enum UserRole { admin, teacher, parent }
enum LessonStatus { planned, inProgress, taught }

sealed class PortalScope {
  const PortalScope();
}
class AdminAllScope extends PortalScope { const AdminAllScope(); }
class TeacherScope extends PortalScope { final String teacherId; const TeacherScope(this.teacherId); }
class ParentScope extends PortalScope { final List<String> learnerIds; const ParentScope(this.learnerIds); }

class SchoolEntity<T> {
  final String id;
  final String entityType;
  final T core;
  final Map<String, dynamic> customFields; // Native Firestore Map: {'awards': 'Star Reader'}
  const SchoolEntity({
    required this.id,
    required this.entityType,
    required this.core,
    this.customFields = const {},
  });
}

// 2. DATA LAYER: lib/features/lesson_plans/data/firestore_lesson_plan_repository.dart
abstract class LessonPlanRepository {
  Stream<List<SchoolEntity<LessonPlanCore>>> watchPlans(PortalScope scope);
  Future<void> markLessonStatus(String planId, LessonStatus status, int delivered);
}

class FirestoreLessonPlanRepository implements LessonPlanRepository {
  final FirebaseFirestore _db;
  FirestoreLessonPlanRepository(this._db);

  @override
  Stream<List<SchoolEntity<LessonPlanCore>>> watchPlans(PortalScope scope) {
    Query<Map<String, dynamic>> query = _db.collection('lesson_plans');
    switch (scope) {
      case AdminAllScope():
        break; // Admin observes all teachers & classes
      case TeacherScope(:final teacherId):
        query = query.where('teacherId', isEqualTo: teacherId);
      case ParentScope():
        query = query.where('visibleToParents', isEqualTo: true);
    }
    return query.snapshots().map((snap) =>
        snap.docs.map((d) => LessonPlanMapper.fromFirestore(d.id, d.data())).toList());
  }

  @override
  Future<void> markLessonStatus(String planId, LessonStatus status, int delivered) {
    return _db.collection('lesson_plans').doc(planId).update({
      'status': status.name,
      'lessonsDelivered': delivered,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}

// 3. STATE MANAGEMENT (RIVERPOD): Teacher update auto-reflects in Admin Dashboard
final lessonPlansStreamProvider =
    StreamProvider.family<List<SchoolEntity<LessonPlanCore>>, PortalScope>((ref, scope) {
  return ref.watch(lessonPlanRepoProvider).watchPlans(scope);
});

final adminCoverageProvider = Provider<AsyncValue<List<SubstrandCoverage>>>((ref) {
  final substrandsAsync = ref.watch(schemeSubstrandsStreamProvider);
  final plansAsync = ref.watch(lessonPlansStreamProvider(const AdminAllScope()));

  return switch ((substrandsAsync, plansAsync)) {
    (AsyncData(:final value: final subs), AsyncData(:final value: final plans)) =>
      AsyncData(SyllabusCoverageSystem.compute(subs, plans)),
    (AsyncError(:final error, :final stackTrace), _) => AsyncError(error, stackTrace),
    (_, AsyncError(:final error, :final stackTrace)) => AsyncError(error, stackTrace),
    _ => const AsyncLoading(),
  };
});`;

export const FIRESTORE_COLLECTIONS_AND_RULES = `// 100% Firebase Cloud Firestore Rules & Document Blueprint (Zero SQL)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global default-deny safety net
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null && request.auth.token.email_verified == true;
    }
    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    function isTeacher() {
      return isSignedIn() && userDoc().role == 'teacher';
    }
    function isParentOf(learnerId) {
      return isSignedIn() && userDoc().role == 'parent' && learnerId in userDoc().learnerIds;
    }

    // Runtime Dynamic Component Registry
    match /component_schemas/{schemaId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }

    // Canonical Schemes Database (Strands & Substrands defined once)
    match /scheme_strands/{strandId} {
      allow read: if isSignedIn();
      allow create, update: if isAdmin() || isTeacher();
      allow delete: if isAdmin();
    }
    match /scheme_substrands/{substrandId} {
      allow read: if isSignedIn();
      allow create, update: if (isAdmin() || isTeacher())
        && exists(/databases/$(database)/documents/scheme_strands/$(request.resource.data.strandId));
      allow delete: if isAdmin();
    }

    // School Diary (with dynamic customFields Map e.g. awards)
    match /diary_entries/{entryId} {
      allow get, list: if isAdmin() || isTeacher() || isParentOf(resource.data.learnerId);
      allow create: if isAdmin() || isTeacher();
      allow update: if isAdmin() || isTeacher()
        || (isParentOf(resource.data.learnerId)
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['parentAcknowledged']));
    }

    // Assessment Books (pulls strandId + substrandId from Schemes DB)
    match /assessment_entries/{assessmentId} {
      allow get, list: if isAdmin() || isTeacher() || isParentOf(resource.data.learnerId);
      allow create, update: if (isAdmin() || isTeacher())
        && exists(/databases/$(database)/documents/scheme_substrands/$(request.resource.data.substrandId));
    }

    // Lesson Plans (drives Admin Syllabus Coverage tracking)
    match /lesson_plans/{planId} {
      allow read: if isAdmin() || isTeacher();
      allow create, update: if (isAdmin() || isTeacher())
        && exists(/databases/$(database)/documents/scheme_substrands/$(request.resource.data.substrandId));
    }

    // Class Register
    match /attendance_records/{recordId} {
      allow get, list: if isAdmin() || isTeacher() || isParentOf(resource.data.learnerId);
      allow create, update: if isAdmin() || isTeacher();
    }
  }
}`;

export function buildFullPlanMarkdown(): string {
  const sections = FLUTTER_ECS_CHAPTERS.map((ch) => {
    const parts: string[] = [
      `## ${ch.number}. ${ch.title}`,
      '',
      ch.summary,
      '',
    ];
    if (ch.diagram) {
      parts.push('```text', ch.diagram, '```', '');
    }
    if (ch.table) {
      parts.push(
        `| ${ch.table.headers.join(' | ')} |`,
        `| ${ch.table.headers.map(() => '---').join(' | ')} |`,
        ...ch.table.rows.map((r) => `| ${r.join(' | ')} |`),
        ''
      );
    }
    for (const h of ch.highlights) {
      parts.push(`### ${h.heading}`, h.body, '');
    }
    return parts.join('\n');
  });

  return [
    '# ScholaECS — 100% Firebase & Flutter Loosely Coupled Architecture Plan',
    '',
    'A complete Entity-Component-System (ECS) architectural blueprint and part-by-part Firebase migration roadmap spanning **Admin**, **Teacher**, and **Parent** portals across **School Diary**, **Assessment Books**, **Timetable**, **Schemes**, **Lesson Plans & Syllabus Coverage**, and **Class Register**.',
    '',
    ...sections,
    '## 08. Core Dart & Riverpod Firebase Blueprint',
    '',
    '```dart',
    DART_ECS_SNIPPET,
    '```',
    '',
    '## 09. Cloud Firestore Security Rules & Document Architecture',
    '',
    '```javascript',
    FIRESTORE_COLLECTIONS_AND_RULES,
    '```',
  ].join('\n');
}
