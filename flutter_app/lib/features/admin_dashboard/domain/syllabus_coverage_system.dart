import '../../../core/ecs/ecs_seed_data.dart';
import '../../../core/ecs/school_entity.dart';
import '../../lesson_plans/domain/lesson_plan.dart';
import '../../schemes/domain/scheme_nodes.dart';

class SubstrandCoverageReport {
  const SubstrandCoverageReport({
    required this.substrand,
    required this.strand,
    required this.subject,
    required this.deliveredLessons,
    required this.targetLessons,
    required this.coveragePercent,
  });

  final SchemeSubstrandEntity substrand;
  final SchemeStrandEntity? strand;
  final SubjectEntity? subject;
  final int deliveredLessons;
  final int targetLessons;
  final int coveragePercent;
}

class TeacherCoverageSummary {
  const TeacherCoverageSummary({
    required this.teacher,
    required this.taughtPlans,
    required this.inProgressPlans,
    required this.totalPlans,
    required this.totalLessonsDelivered,
    required this.assessmentsLogged,
    required this.diaryEntriesLogged,
  });

  final TeacherEntity teacher;
  final int taughtPlans;
  final int inProgressPlans;
  final int totalPlans;
  final int totalLessonsDelivered;
  final int assessmentsLogged;
  final int diaryEntriesLogged;
}

class SyllabusCoverageSystem {
  const SyllabusCoverageSystem._();

  static List<SubstrandCoverageReport> computeSubstrandCoverage(SchoolEcsState state) {
    return state.substrands.map((sub) {
      final strand = state.strands.where((s) => s.id == sub.strandId).firstOrNull;
      final subject = state.subjects.where((s) => s.id == sub.subjectId).firstOrNull;
      final linkedPlans = state.lessonPlans.where((lp) => lp.substrandId == sub.id);
      final delivered = linkedPlans.fold<int>(
        0,
        (sum, lp) => lp.status == LessonStatus.planned ? sum : sum + lp.lessonsDelivered,
      );
      final pct = sub.targetLessons <= 0
          ? 0
          : ((delivered / sub.targetLessons) * 100).round().clamp(0, 100);
      return SubstrandCoverageReport(
        substrand: sub,
        strand: strand,
        subject: subject,
        deliveredLessons: delivered,
        targetLessons: sub.targetLessons,
        coveragePercent: pct,
      );
    }).toList();
  }

  static List<TeacherCoverageSummary> computeTeacherSummaries(SchoolEcsState state) {
    return state.teachers.map((teacher) {
      final plans = state.lessonPlans.where((lp) => lp.teacherId == teacher.id).toList();
      final taughtPlans = plans.where((lp) => lp.status == LessonStatus.taught).length;
      final inProgress = plans.where((lp) => lp.status == LessonStatus.inProgress).length;
      final delivered = plans.fold<int>(
        0,
        (sum, lp) => lp.status == LessonStatus.planned ? sum : sum + lp.lessonsDelivered,
      );
      final assessments = state.assessments.where((a) => a.teacherId == teacher.id).length;
      final diary = state.diaryEntries.where((d) => d.teacherId == teacher.id).length;

      return TeacherCoverageSummary(
        teacher: teacher,
        taughtPlans: taughtPlans,
        inProgressPlans: inProgress,
        totalPlans: plans.length,
        totalLessonsDelivered: delivered,
        assessmentsLogged: assessments,
        diaryEntriesLogged: diary,
      );
    }).toList();
  }
}
