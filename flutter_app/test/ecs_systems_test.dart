import 'package:flutter_test/flutter_test.dart';
import 'package:schola_ecs/core/ecs/ecs_seed_data.dart';
import 'package:schola_ecs/core/ecs/schola_ecs_repository.dart';
import 'package:schola_ecs/core/ecs/school_entity.dart';
import 'package:schola_ecs/features/admin_dashboard/domain/syllabus_coverage_system.dart';
import 'package:schola_ecs/features/learners/domain/learner.dart';
import 'package:schola_ecs/features/learners/domain/learner_longitudinal_system.dart';
import 'package:schola_ecs/features/lesson_plans/domain/lesson_plan.dart';

void main() {
  test('Marking a Lesson Plan taught immediately updates Admin Substrand Coverage', () async {
    final notifier = SchoolEcsNotifier(useFirestore: false);
    final before = SyllabusCoverageSystem.computeSubstrandCoverage(notifier.state)
        .firstWhere((r) => r.substrand.id == 'sub_e1_1');
    expect(before.coveragePercent, 0);

    await notifier.updateLessonPlanStatus('lp_04', LessonStatus.taught, 4);
    final after = SyllabusCoverageSystem.computeSubstrandCoverage(notifier.state)
        .firstWhere((r) => r.substrand.id == 'sub_e1_1');
    expect(after.coveragePercent, 100);
  });

  test('Learner longitudinal report strips staff-only fields for Parents and filters timeframes', () {
    final sinceReg = LearnerLongitudinalSystem.buildReport(
      initialSchoolEcsState,
      'lrn_01',
      PortalRole.parent,
      const LearnerTimeframe(preset: TimeframePreset.sinceRegistration),
    );
    expect(sinceReg, isNotNull);
    expect(sinceReg!.diary.length, 2);
    expect(sinceReg.attendance.first.customFields.containsKey('uniform_compliant'), isFalse);

    final last30 = LearnerLongitudinalSystem.buildReport(
      initialSchoolEcsState,
      'lrn_01',
      PortalRole.parent,
      const LearnerTimeframe(preset: TimeframePreset.last30Days),
    );
    expect(last30!.diary.length, 1);
  });
}
