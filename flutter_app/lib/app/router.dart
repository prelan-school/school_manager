import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/admin_dashboard/presentation/admin_coverage_page.dart';
import '../features/assessment_books/presentation/assessment_books_page.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/class_register/presentation/class_register_page.dart';
import '../features/learners/presentation/learner_profile_page.dart';
import '../features/learners/presentation/learners_directory_page.dart';
import '../features/lesson_plans/presentation/lesson_plans_page.dart';
import '../features/schema_studio/presentation/schema_studio_page.dart';
import '../features/schemes/presentation/schemes_page.dart';
import '../features/school_diary/presentation/school_diary_page.dart';
import '../features/timetable/presentation/timetable_page.dart';
import 'portal_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/learners',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => PortalShell(
          currentPath: state.uri.path,
          child: child,
        ),
        routes: [
          GoRoute(
            path: '/learners',
            builder: (context, state) => const LearnersDirectoryPage(),
          ),
          GoRoute(
            path: '/learners/:learnerId',
            builder: (context, state) => LearnerProfilePage(
              learnerId: state.pathParameters['learnerId'] ?? 'lrn_01',
            ),
          ),
          GoRoute(
            path: '/diary',
            builder: (context, state) => const SchoolDiaryPage(),
          ),
          GoRoute(
            path: '/schemes',
            builder: (context, state) => const SchemesPage(),
          ),
          GoRoute(
            path: '/assessments',
            builder: (context, state) => const AssessmentBooksPage(),
          ),
          GoRoute(
            path: '/lessons',
            builder: (context, state) => const LessonPlansPage(),
          ),
          GoRoute(
            path: '/timetable',
            builder: (context, state) => const TimetablePage(),
          ),
          GoRoute(
            path: '/register',
            builder: (context, state) => const ClassRegisterPage(),
          ),
          GoRoute(
            path: '/coverage',
            builder: (context, state) => const AdminCoveragePage(),
          ),
          GoRoute(
            path: '/schema',
            builder: (context, state) => const SchemaStudioPage(),
          ),
        ],
      ),
    ],
  );
});
