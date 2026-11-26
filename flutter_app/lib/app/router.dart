import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/ecs/school_entity.dart';
import '../features/admin_dashboard/presentation/admin_coverage_page.dart';
import '../features/assessment_books/presentation/assessment_books_page.dart';
import '../features/auth/data/firebase_auth_repository.dart';
import '../features/auth/domain/auth_user.dart';
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

class _RouterRefreshNotifier extends ChangeNotifier {
  void trigger() => notifyListeners();
}

/// Pure redirect evaluator so route guard behavior can be unit-tested cleanly.
String? evaluatePortalRedirect({
  required String location,
  required bool firebaseReady,
  required bool authLoading,
  required AuthUser? user,
}) {
  if (authLoading && firebaseReady) return null;

  final isLogin = location == '/login';
  if (firebaseReady && user == null) {
    return isLogin ? null : '/login';
  }
  if (firebaseReady && user != null && isLogin) {
    return '/learners';
  }
  if (user == null) return null;

  final isAdminOnlyRoute =
      location.startsWith('/coverage') || location.startsWith('/schema');
  if (isAdminOnlyRoute && user.role != PortalRole.admin) {
    return '/learners';
  }

  final isStaffOnlyRoute =
      location.startsWith('/schemes') || location.startsWith('/lessons');
  if (isStaffOnlyRoute && user.role == PortalRole.parent) {
    return '/learners';
  }

  if (user.role == PortalRole.parent && location.startsWith('/learners/')) {
    final targetId = location.substring('/learners/'.length).split('?').first;
    if (user.linkedLearnerIds.isNotEmpty &&
        !user.linkedLearnerIds.contains(targetId)) {
      return '/learners/${user.linkedLearnerIds.first}';
    }
  }

  return null;
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _RouterRefreshNotifier();
  ref.onDispose(refreshNotifier.dispose);
  ref.listen(currentUserProvider, (_, __) => refreshNotifier.trigger());
  ref.listen(firebaseReadyProvider, (_, __) => refreshNotifier.trigger());

  return GoRouter(
    initialLocation: '/learners',
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final firebaseReady = ref.read(firebaseReadyProvider);
      final userAsync = ref.read(currentUserProvider);
      return evaluatePortalRedirect(
        location: state.uri.path,
        firebaseReady: firebaseReady,
        authLoading: userAsync.isLoading,
        user: userAsync.valueOrNull,
      );
    },
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
