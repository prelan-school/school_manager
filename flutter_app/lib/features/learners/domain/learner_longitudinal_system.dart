import '../../../core/ecs/ecs_seed_data.dart';
import '../../../core/ecs/school_entity.dart';
import '../../assessment_books/domain/assessment_entry.dart';
import '../../class_register/domain/attendance_record.dart';
import '../../school_diary/domain/diary_entry.dart';
import 'learner.dart';

class LearnerLongitudinalReport {
  const LearnerLongitudinalReport({
    required this.learner,
    required this.fromDate,
    required this.toDate,
    required this.diary,
    required this.assessments,
    required this.attendance,
    required this.averageScore,
    required this.attendanceRate,
    required this.awardsCount,
    required this.timeline,
  });

  final LearnerEntity learner;
  final String fromDate;
  final String toDate;
  final List<DiaryEntryEntity> diary;
  final List<AssessmentEntryEntity> assessments;
  final List<AttendanceRecordEntity> attendance;
  final int? averageScore;
  final int? attendanceRate;
  final int awardsCount;
  final List<LearnerTimelineEvent> timeline;
}

class LearnerLongitudinalSystem {
  const LearnerLongitudinalSystem._();

  static const String currentTermStart = '2026-09-01';
  static const String referenceToday = '2026-11-25';

  static List<PageWidgetDefinition> getWidgetsForRole(
    SchoolEcsState state,
    PortalRole role,
  ) {
    final filtered = state.pageWidgets
        .where((w) => w.pageId == 'learner_profile' && w.enabled && w.allowedRoles.contains(role))
        .toList();
    filtered.sort((a, b) => a.order.compareTo(b.order));
    return filtered;
  }

  static ({String from, String to}) resolveTimeframeBounds(
    LearnerEntity learner,
    LearnerTimeframe timeframe,
  ) {
    switch (timeframe.preset) {
      case TimeframePreset.sinceRegistration:
        return (from: learner.registeredAt, to: referenceToday);
      case TimeframePreset.thisTerm:
        return (
          from: learner.registeredAt.compareTo(currentTermStart) > 0
              ? learner.registeredAt
              : currentTermStart,
          to: referenceToday,
        );
      case TimeframePreset.last30Days:
        return (from: '2026-10-26', to: referenceToday);
      case TimeframePreset.custom:
        return (
          from: timeframe.fromDate ?? learner.registeredAt,
          to: timeframe.toDate ?? referenceToday,
        );
    }
  }

  static LearnerLongitudinalReport? buildReport(
    SchoolEcsState state,
    String learnerId,
    PortalRole role,
    LearnerTimeframe timeframe,
  ) {
    final idx = state.learners.indexWhere((l) => l.id == learnerId);
    if (idx < 0) return null;
    final learner = state.learners[idx];
    final bounds = resolveTimeframeBounds(learner, timeframe);

    bool inWindow(String date) =>
        date.compareTo(bounds.from) >= 0 && date.compareTo(bounds.to) <= 0;

    final diary = state.diaryEntries
        .where((d) => d.learnerId == learnerId && inWindow(d.date))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    final assessments = state.assessments
        .where((a) => a.learnerId == learnerId && inWindow(a.date))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    final registerFields = state.dynamicFields
        .where((f) => f.targetEntityType == EntityType.attendanceRecord && f.isVisibleTo(role))
        .toList();
    final allowedRegisterKeys = registerFields.map((f) => f.key).toSet();

    final attendance = state.attendanceRecords
        .where((r) => r.learnerId == learnerId && inWindow(r.date))
        .map((r) {
          final projected = Map<String, dynamic>.fromEntries(
            r.customFields.entries.where((e) => allowedRegisterKeys.contains(e.key)),
          );
          return AttendanceRecordEntity(
            id: r.id,
            learnerId: r.learnerId,
            classroomId: r.classroomId,
            teacherId: r.teacherId,
            date: r.date,
            status: r.status,
            remark: r.remark,
            customFields: projected,
          );
        })
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));

    final int? averageScore = assessments.isEmpty
        ? null
        : (assessments.fold<int>(0, (sum, a) => sum + a.scorePercent) / assessments.length).round();

    final int? attendanceRate = attendance.isEmpty
        ? null
        : ((attendance.where((r) => r.status == AttendanceStatus.present || r.status == AttendanceStatus.late).length /
                    attendance.length) *
                100)
            .round();

    final awardsCount = diary.where((d) {
      final award = d.customFields['awards'];
      return award != null && award.toString().trim().isNotEmpty;
    }).length;

    final timeline = <LearnerTimelineEvent>[];
    for (final d in diary) {
      final award = d.customFields['awards'];
      timeline.add(
        LearnerTimelineEvent(
          id: 'tl_${d.id}',
          date: d.date,
          category: 'diary',
          title: 'Diary: ${d.homeworkSummary}',
          detail: award != null && award.toString().trim().isNotEmpty
              ? '${d.teacherNote} · Award: $award'
              : d.teacherNote,
          meta: d.parentAcknowledged ? 'Parent signed' : 'Awaiting sign-off',
        ),
      );
    }

    for (final a in assessments) {
      final subj = state.subjects.where((s) => s.id == a.subjectId).firstOrNull;
      final sub = state.substrands.where((s) => s.id == a.substrandId).firstOrNull;
      timeline.add(
        LearnerTimelineEvent(
          id: 'tl_${a.id}',
          date: a.date,
          category: 'assessment',
          title: 'Assessment: ${subj?.name ?? ''} — ${sub?.title ?? ''}',
          detail: a.performanceComment,
          meta: '${a.mastery.label} (${a.scorePercent}%)',
        ),
      );
    }

    for (final r in attendance) {
      final uniformVal = r.customFields['uniform_compliant'];
      final uniformLabel = uniformVal is bool
          ? ' · Uniform: ${uniformVal ? 'Compliant' : 'Needs Follow-up'}'
          : '';
      timeline.add(
        LearnerTimelineEvent(
          id: 'tl_${r.id}',
          date: r.date,
          category: 'attendance',
          title: 'Register: ${r.status.label.toUpperCase()}',
          detail: '${r.remark.isEmpty ? 'Daily morning roll call' : r.remark}$uniformLabel',
          meta: r.status.label,
        ),
      );
    }

    timeline.sort((a, b) => b.date.compareTo(a.date));

    return LearnerLongitudinalReport(
      learner: learner,
      fromDate: bounds.from,
      toDate: bounds.to,
      diary: diary,
      assessments: assessments,
      attendance: attendance,
      averageScore: averageScore,
      attendanceRate: attendanceRate,
      awardsCount: awardsCount,
      timeline: timeline,
    );
  }
}
