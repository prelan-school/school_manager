import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/admin_dashboard/domain/syllabus_coverage_system.dart';
import '../../features/auth/data/firebase_auth_repository.dart';
import 'ecs_seed_data.dart';
import 'schola_ecs_repository.dart';

final schoolEcsProvider =
    StateNotifierProvider<SchoolEcsNotifier, SchoolEcsState>((ref) {
  final firebaseReady = ref.watch(firebaseReadyProvider);
  final currentUser = ref.watch(currentUserProvider).valueOrNull;
  return SchoolEcsNotifier(
    useFirestore: firebaseReady,
    firestore: firebaseReady ? FirebaseFirestore.instance : null,
    currentUser: currentUser,
  );
});

/// Selected child ID for multi-child guardians in the Parent Portal.
final selectedParentLearnerIdProvider = StateProvider<String?>((ref) => null);

final substrandCoverageProvider =
    Provider<List<SubstrandCoverageReport>>((ref) {
  final ecsState = ref.watch(schoolEcsProvider);
  return SyllabusCoverageSystem.computeSubstrandCoverage(ecsState);
});

final teacherCoverageProvider = Provider<List<TeacherCoverageSummary>>((ref) {
  final ecsState = ref.watch(schoolEcsProvider);
  return SyllabusCoverageSystem.computeTeacherSummaries(ecsState);
});
