import 'package:flutter_test/flutter_test.dart';
import 'package:schola_ecs/app/router.dart';
import 'package:schola_ecs/core/ecs/ecs_seed_data.dart';
import 'package:schola_ecs/core/ecs/schola_ecs_repository.dart';
import 'package:schola_ecs/core/ecs/school_entity.dart';
import 'package:schola_ecs/features/admin_dashboard/domain/syllabus_coverage_system.dart';
import 'package:schola_ecs/features/auth/data/firebase_auth_repository.dart';
import 'package:schola_ecs/features/auth/domain/auth_user.dart';
import 'package:schola_ecs/features/class_register/domain/attendance_record.dart';
import 'package:schola_ecs/features/learners/domain/learner.dart';
import 'package:schola_ecs/features/learners/domain/learner_longitudinal_system.dart';
import 'package:schola_ecs/features/lesson_plans/domain/lesson_plan.dart';
import 'package:schola_ecs/features/timetable/domain/timetable_slot.dart';

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

  test('Admin can create, update, delete dynamic fields and update learner custom fields', () async {
    final notifier = SchoolEcsNotifier(useFirestore: false);
    const created = DynamicFieldDefinition(
      id: 'fld_test_style',
      targetEntityType: EntityType.learner,
      key: 'learning_style',
      label: 'Learning Style',
      fieldType: DynamicFieldType.select,
      options: ['Visual', 'Kinesthetic'],
      visibleTo: [PortalRole.admin, PortalRole.teacher],
      editableBy: [PortalRole.admin],
      description: 'Preferred learning mode',
    );
    await notifier.registerDynamicField(created);
    expect(notifier.state.dynamicFields.any((f) => f.id == 'fld_test_style'), isTrue);

    await notifier.updateDynamicField(
      const DynamicFieldDefinition(
        id: 'fld_test_style',
        targetEntityType: EntityType.learner,
        key: 'learning_style_v2',
        label: 'Learning Style V2',
        fieldType: DynamicFieldType.select,
        options: ['Visual', 'Kinesthetic', 'Auditory'],
        required: true,
        visibleTo: [PortalRole.admin, PortalRole.teacher, PortalRole.parent],
        editableBy: [PortalRole.admin, PortalRole.teacher],
        description: 'Updated learning mode',
      ),
    );
    final updated = notifier.state.dynamicFields.firstWhere((f) => f.id == 'fld_test_style');
    expect(updated.required, isTrue);
    expect(updated.visibleTo.contains(PortalRole.parent), isTrue);

    await notifier.updateLearnerProfile(
      learnerId: 'lrn_01',
      name: 'Zuri Mwangi',
      enrollmentStatus: 'Active',
      parentName: 'Grace Mwangi',
      guardianPhone: '+254 712 401 218',
      internalHealthNote: 'Updated note',
      customFields: const {'learning_style_v2': 'Auditory'},
    );
    final learner = notifier.state.learners.firstWhere((l) => l.id == 'lrn_01');
    expect(learner.customFields['learning_style_v2'], 'Auditory');

    await notifier.archiveDynamicField('fld_test_style');
    final archived = notifier.state.dynamicFields.firstWhere((f) => f.id == 'fld_test_style');
    expect(archived.archived, isTrue);

    await notifier.restoreDynamicField('fld_test_style');
    final restored = notifier.state.dynamicFields.firstWhere((f) => f.id == 'fld_test_style');
    expect(restored.archived, isFalse);
  });

  test('Verified default admin email resolves to admin while unverified/other emails default to parent', () {
    expect(isDefaultAdminEmail('prelanadm@gmail.com'), isTrue);
    expect(isDefaultAdminEmail(' PRELANADM@GMAIL.COM '), isTrue);
    expect(isDefaultAdminEmail('teacher@scholaecs.edu'), isFalse);

    expect(
      resolveBootstrapRole(email: 'prelanadm@gmail.com', emailVerified: true),
      PortalRole.admin,
    );
    expect(
      resolveBootstrapRole(email: 'prelanadm@gmail.com', emailVerified: false),
      PortalRole.parent,
    );
    expect(
      resolveBootstrapRole(email: 'someone@example.com', emailVerified: true),
      PortalRole.parent,
    );
    expect(
      resolveBootstrapRole(
        email: 'teacher@example.com',
        emailVerified: true,
        existingRole: PortalRole.teacher,
      ),
      PortalRole.teacher,
    );
  });

  test('Batch classroom diary broadcast and Mark All Present update all learners in classroom', () async {
    final notifier = SchoolEcsNotifier(useFirestore: false);
    final class5ALearners =
        notifier.state.learners.where((l) => l.classroomId == 'cls_5a').length;

    final diaryCount = await notifier.broadcastClassroomDiary(
      classroomId: 'cls_5a',
      teacherId: 'tch_amara',
      date: '2026-11-25',
      homeworkSummary: 'Complete fractions worksheet #4',
      teacherNote: 'Show working steps.',
      customFields: const {},
    );
    expect(diaryCount, class5ALearners);

    final regCount = await notifier.markClassroomAllPresent(
      classroomId: 'cls_5a',
      teacherId: 'tch_amara',
      date: '2026-11-26',
    );
    expect(regCount, class5ALearners);
    expect(
      notifier.state.attendanceRecords
          .where((r) => r.classroomId == 'cls_5a' && r.date == '2026-11-26')
          .every((r) => r.status == AttendanceStatus.present),
      isTrue,
    );
  });

  test('TimetableConflictValidator detects classroom, teacher, and room conflicts', () async {
    final notifier = SchoolEcsNotifier(useFirestore: false);
    final first = notifier.state.timetableSlots.first;

    final classConflict = await notifier.upsertTimetableSlot(
      TimetableSlotEntity(
        id: 'tt_bad_class',
        classroomId: first.classroomId,
        subjectId: 'sub_eng',
        teacherId: 'tch_david',
        day: first.day,
        period: first.period,
        timeRange: first.timeRange,
        room: 'ALT-99',
      ),
    );
    expect(classConflict, isNotNull);

    final teacherConflict = await notifier.upsertTimetableSlot(
      TimetableSlotEntity(
        id: 'tt_bad_teacher',
        classroomId: 'cls_6b',
        subjectId: first.subjectId,
        teacherId: first.teacherId,
        day: first.day,
        period: first.period,
        timeRange: first.timeRange,
        room: 'ALT-98',
      ),
    );
    expect(teacherConflict, isNotNull);

    final roomConflict = await notifier.upsertTimetableSlot(
      TimetableSlotEntity(
        id: 'tt_bad_room',
        classroomId: 'cls_6b',
        subjectId: 'sub_eng',
        teacherId: 'tch_david',
        day: first.day,
        period: first.period,
        timeRange: first.timeRange,
        room: first.room,
      ),
    );
    expect(roomConflict, isNotNull);

    final validResult = await notifier.upsertTimetableSlot(
      const TimetableSlotEntity(
        id: 'tt_valid_new',
        classroomId: 'cls_5a',
        subjectId: 'sub_sci',
        teacherId: 'tch_david',
        day: 'Fri',
        period: 4,
        timeRange: '11:30 - 12:15',
        room: 'LAB-1',
      ),
    );
    expect(validResult, isNull);
  });

  test('GoRouter evaluatePortalRedirect enforces auth, role guards, and multi-child parent scope', () {
    const teacher = AuthUser(
      uid: 'u_t1',
      email: 't@school.edu',
      displayName: 'Teacher',
      role: PortalRole.teacher,
    );
    const parent = AuthUser(
      uid: 'u_p1',
      email: 'p@school.edu',
      displayName: 'Parent',
      role: PortalRole.parent,
      linkedLearnerIds: ['lrn_01', 'lrn_02'],
    );
    const admin = AuthUser(
      uid: 'u_a1',
      email: 'a@school.edu',
      displayName: 'Admin',
      role: PortalRole.admin,
    );

    expect(
      evaluatePortalRedirect(
        location: '/learners',
        firebaseReady: true,
        authLoading: false,
        user: null,
      ),
      '/login',
    );
    expect(
      evaluatePortalRedirect(
        location: '/schema',
        firebaseReady: true,
        authLoading: false,
        user: teacher,
      ),
      '/learners',
    );
    expect(
      evaluatePortalRedirect(
        location: '/schemes',
        firebaseReady: true,
        authLoading: false,
        user: parent,
      ),
      '/learners',
    );
    expect(
      evaluatePortalRedirect(
        location: '/learners/lrn_99',
        firebaseReady: true,
        authLoading: false,
        user: parent,
      ),
      '/learners/lrn_01',
    );
    expect(
      evaluatePortalRedirect(
        location: '/learners/lrn_02',
        firebaseReady: true,
        authLoading: false,
        user: parent,
      ),
      isNull,
    );
    expect(
      evaluatePortalRedirect(
        location: '/schema',
        firebaseReady: true,
        authLoading: false,
        user: admin,
      ),
      isNull,
    );
  });

  test('Subject mastery progression and markdown report export summarize longitudinal data', () {
    final progression = LearnerLongitudinalSystem.computeSubjectProgression(
      initialSchoolEcsState,
      'lrn_01',
      '2026-01-10',
      '2026-11-25',
    );
    expect(progression, isNotEmpty);

    final report = LearnerLongitudinalSystem.buildReport(
      initialSchoolEcsState,
      'lrn_01',
      PortalRole.parent,
      const LearnerTimeframe(preset: TimeframePreset.sinceRegistration),
    )!;
    final md = LearnerReportFormatter.toMarkdown(initialSchoolEcsState, report);
    expect(md.contains('# ScholaECS Longitudinal Progress Report'), isTrue);
    expect(md.contains(report.learner.name), isTrue);
  });
}
