import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ECS_STATE } from './initialData';
import {
  archiveDynamicField,
  broadcastClassroomDiary,
  buildLearnerLongitudinalReport,
  buildLearnerPrintableReportHtml,
  computeSubjectMasteryProgression,
  computeSubstrandCoverage,
  computeTeacherCoverageSummaries,
  createAssessmentEntry,
  createDiaryEntry,
  createLessonPlan,
  getFieldsForEntity,
  getPageWidgetsForRole,
  invitePortalUserAccount,
  markClassroomAllPresent,
  registerDynamicField,
  registerSchemeStrand,
  registerSchemeSubstrand,
  removeDynamicField,
  restoreDynamicField,
  togglePageWidgetEnabled,
  togglePageWidgetRole,
  updateDynamicField,
  updateLearnerProfile,
  updateLessonStatus,
  updatePortalUserAccount,
  upsertTimetableSlot,
} from './engine';

test('dynamic field added to diary_entry is immediately queryable and persists in new entries', () => {
  const resField = registerDynamicField(INITIAL_ECS_STATE, {
    label: 'Leadership Points',
    targetEntityType: 'diary_entry',
    fieldType: 'number',
    required: true,
    visibleTo: ['admin', 'teacher', 'parent'],
    editableBy: ['admin', 'teacher'],
    description: 'Points awarded for peer leadership.',
  });
  assert.ok(resField.field);
  assert.equal(resField.field.key, 'leadership_points');

  const parentFields = getFieldsForEntity(resField.state, 'diary_entry', 'parent');
  assert.ok(parentFields.some((f) => f.key === 'leadership_points'));

  const invalidDiary = createDiaryEntry(resField.state, {
    learnerId: 'lrn_zuri',
    teacherId: 'tch_amara',
    date: '2026-11-25',
    homeworkSummary: 'Read chapter 4',
    teacherNote: 'Great focus',
    customFields: {},
    actorRole: 'teacher',
  });
  assert.ok(invalidDiary.error);

  const validDiary = createDiaryEntry(resField.state, {
    learnerId: 'lrn_zuri',
    teacherId: 'tch_amara',
    date: '2026-11-25',
    homeworkSummary: 'Read chapter 4',
    teacherNote: 'Great focus',
    customFields: { leadership_points: 5, awards: 'Peer Mentor' },
    actorRole: 'teacher',
  });
  assert.ok(validDiary.entry);
  assert.equal(validDiary.entry.customFields.leadership_points, 5);
});

test('scheme strand -> substrand registers once and pulls directly into assessments and lesson coverage', () => {
  const s1 = registerSchemeStrand(INITIAL_ECS_STATE, {
    subjectId: 'sub_math5',
    code: 'STR-M3',
    title: 'Data Handling & Probability',
    term: 'Term 2',
    createdByTeacherId: 'tch_amara',
  });
  assert.ok(s1.strand);

  const s2 = registerSchemeSubstrand(s1.state, {
    strandId: s1.strand.id,
    code: '3.1',
    title: 'Bar Graphs & Line Plots',
    learningOutcome: 'Construct scaled bar graphs from survey data.',
    targetLessons: 4,
  });
  assert.ok(s2.substrand);

  const asm = createAssessmentEntry(s2.state, {
    learnerId: 'lrn_zuri',
    substrandId: s2.substrand.id,
    teacherId: 'tch_amara',
    date: '2026-11-25',
    mastery: 'Exceeding',
    scorePercent: 95,
    performanceComment: 'Scaled axes accurately without prompts.',
    customFields: {},
    actorRole: 'teacher',
  });
  assert.ok(asm.entry);
  assert.equal(asm.entry.strandId, s1.strand.id);
  assert.equal(asm.entry.subjectId, 'sub_math5');

  const lp = createLessonPlan(asm.state, {
    teacherId: 'tch_amara',
    classroomId: 'cls_5a',
    substrandId: s2.substrand.id,
    title: 'Class Survey Bar Charts',
    scheduledDate: '2026-11-25',
    lessonsDelivered: 2,
    status: 'taught',
    reflectionNote: 'All learners plotted class heights.',
  });
  assert.ok(lp.plan);

  const coverage = computeSubstrandCoverage(lp.state).find(
    (c) => c.substrand.id === s2.substrand!.id
  );
  assert.ok(coverage);
  assert.equal(coverage.deliveredLessons, 2);
  assert.equal(coverage.coveragePercent, 50);

  const updated = updateLessonStatus(lp.state, lp.plan.id, 'taught', 4);
  const coverageAfter = computeSubstrandCoverage(updated).find(
    (c) => c.substrand.id === s2.substrand!.id
  );
  assert.equal(coverageAfter?.coveragePercent, 100);

  const teacherSummary = computeTeacherCoverageSummaries(updated).find(
    (t) => t.teacher.id === 'tch_amara'
  );
  assert.ok(teacherSummary && teacherSummary.taughtPlans >= 3);
});

test('role projection hides internal teacher/admin fields from parent portal', () => {
  const teacherFields = getFieldsForEntity(
    INITIAL_ECS_STATE,
    'attendance_record',
    'teacher'
  );
  const parentFields = getFieldsForEntity(
    INITIAL_ECS_STATE,
    'attendance_record',
    'parent'
  );
  assert.ok(teacherFields.some((f) => f.key === 'uniform_compliant'));
  assert.ok(!parentFields.some((f) => f.key === 'uniform_compliant'));
});

test('loosely coupled page widgets align per role and respond to live schema composition', () => {
  const adminWidgets = getPageWidgetsForRole(
    INITIAL_ECS_STATE,
    'learner_profile',
    'admin'
  );
  const parentWidgets = getPageWidgetsForRole(
    INITIAL_ECS_STATE,
    'learner_profile',
    'parent'
  );
  assert.ok(adminWidgets.some((w) => w.id === 'learner_enrollment'));
  assert.ok(!parentWidgets.some((w) => w.id === 'learner_enrollment'));

  const toggled = togglePageWidgetEnabled(INITIAL_ECS_STATE, 'learner_timetable');
  const afterDisable = getPageWidgetsForRole(toggled, 'learner_profile', 'teacher');
  assert.ok(!afterDisable.some((w) => w.id === 'learner_timetable'));

  const granted = togglePageWidgetRole(INITIAL_ECS_STATE, 'learner_enrollment', 'parent');
  const parentAfterGrant = getPageWidgetsForRole(granted, 'learner_profile', 'parent');
  assert.ok(parentAfterGrant.some((w) => w.id === 'learner_enrollment'));
});

test('longitudinal learner report filters from registration date vs last 30 days and strips staff uniform flags for parents', () => {
  const sinceReg = buildLearnerLongitudinalReport(
    INITIAL_ECS_STATE,
    'lrn_zuri',
    'admin',
    { preset: 'since_registration' }
  );
  const last30 = buildLearnerLongitudinalReport(
    INITIAL_ECS_STATE,
    'lrn_zuri',
    'parent',
    { preset: 'last_30_days' }
  );
  assert.ok(sinceReg && last30);
  assert.ok(sinceReg.assessments.length > last30.assessments.length);
  assert.ok(sinceReg.timeline.some((e) => e.category === 'registration'));
  assert.ok(!last30.timeline.some((e) => e.category === 'registration'));
  assert.ok(
    sinceReg.timeline.some(
      (e) => e.category === 'attendance' && e.detail.includes('Uniform:')
    )
  );
  assert.ok(
    !last30.timeline.some(
      (e) => e.category === 'attendance' && e.detail.includes('Uniform:')
    )
  );
});

test('admin can perform full CRUD on component fields across learner and module entities', () => {
  const created = registerDynamicField(INITIAL_ECS_STATE, {
    label: 'Transport Bus Route',
    targetEntityType: 'learner',
    fieldType: 'text',
    required: false,
    visibleTo: ['admin', 'teacher', 'parent'],
    editableBy: ['admin'],
    description: 'Assigned afternoon school bus route.',
  });
  assert.ok(created.field);

  const updated = updateDynamicField(created.state, created.field.id, {
    label: 'School Bus Route',
    fieldType: 'select',
    options: ['Route A', 'Route B'],
    required: true,
    visibleTo: ['admin', 'parent'],
  });
  assert.ok(updated.field);
  assert.equal(updated.field.key, 'school_bus_route');
  assert.equal(updated.field.fieldType, 'select');
  assert.deepEqual(updated.field.options, ['Route A', 'Route B']);

  const savedLearner = updateLearnerProfile(updated.state, 'lrn_zuri', {
    customFields: { school_bus_route: 'Route A' },
  });
  assert.equal(savedLearner.error, undefined);
  assert.equal(
    savedLearner.state.learners.find((l) => l.id === 'lrn_zuri')?.customFields
      .school_bus_route,
    'Route A'
  );

  const afterDelete = removeDynamicField(savedLearner.state, updated.field.id);
  assert.ok(!afterDelete.dynamicFields.some((f) => f.id === updated.field!.id));
});

test('archiving a component schema hides it from active inputs while preserving historical readout labels', () => {
  const archived = archiveDynamicField(INITIAL_ECS_STATE, 'df_diary_awards');
  const activeDiaryFields = getFieldsForEntity(archived, 'diary_entry', 'teacher', false);
  const readoutDiaryFields = getFieldsForEntity(archived, 'diary_entry', 'teacher', true);

  assert.ok(!activeDiaryFields.some((f) => f.id === 'df_diary_awards'));
  assert.ok(readoutDiaryFields.some((f) => f.id === 'df_diary_awards'));

  const restored = restoreDynamicField(archived, 'df_diary_awards');
  const afterRestore = getFieldsForEntity(restored, 'diary_entry', 'teacher', false);
  assert.ok(afterRestore.some((f) => f.id === 'df_diary_awards'));
});

test('batch diary broadcast and mark-all-present register apply across classroom learners', () => {
  const cls5aLearners = INITIAL_ECS_STATE.learners.filter(
    (l) => l.classroomId === 'cls_5a'
  );
  const broadcast = broadcastClassroomDiary(INITIAL_ECS_STATE, {
    classroomId: 'cls_5a',
    teacherId: 'tch_amara',
    date: '2026-11-26',
    homeworkSummary: 'Review ratios worksheet',
    teacherNote: 'Quiz tomorrow',
    customFields: { awards: 'Teamwork Week' },
    actorRole: 'teacher',
  });
  assert.equal(broadcast.error, undefined);
  assert.equal(broadcast.entries.length, cls5aLearners.length);

  const register = markClassroomAllPresent(broadcast.state, {
    classroomId: 'cls_5a',
    teacherId: 'tch_amara',
    date: '2026-11-26',
  });
  assert.equal(register.error, undefined);
  assert.equal(register.count, cls5aLearners.length);
  for (const lrn of cls5aLearners) {
    const rec = register.state.attendanceRecords.find(
      (r) => r.learnerId === lrn.id && r.date === '2026-11-26'
    );
    assert.equal(rec?.status, 'present');
  }
});

test('timetable slot validation blocks classroom, teacher, and room conflicts on the same day/period', () => {
  // Classroom cls_5a already has Mon P1
  const clsConflict = upsertTimetableSlot(INITIAL_ECS_STATE, {
    classroomId: 'cls_5a',
    subjectId: 'sub_eng5',
    teacherId: 'tch_david',
    day: 'Mon',
    period: 1,
    timeRange: '08:00 - 08:45',
    room: 'B2-99',
  });
  assert.ok(clsConflict.error?.includes('Classroom'));

  // Teacher tch_amara already teaches Mon P1
  const teacherConflict = upsertTimetableSlot(INITIAL_ECS_STATE, {
    classroomId: 'cls_6b',
    subjectId: 'sub_math5',
    teacherId: 'tch_amara',
    day: 'Mon',
    period: 1,
    timeRange: '08:00 - 08:45',
    room: 'B2-08',
  });
  assert.ok(teacherConflict.error?.includes('Teacher'));

  // Room B2-04 already booked Mon P1
  const roomConflict = upsertTimetableSlot(INITIAL_ECS_STATE, {
    classroomId: 'cls_6b',
    subjectId: 'sub_eng5',
    teacherId: 'tch_david',
    day: 'Mon',
    period: 1,
    timeRange: '08:00 - 08:45',
    room: 'b2-04',
  });
  assert.ok(roomConflict.error?.includes('Room'));

  // Non-conflicting slot succeeds
  const valid = upsertTimetableSlot(INITIAL_ECS_STATE, {
    classroomId: 'cls_6b',
    subjectId: 'sub_eng5',
    teacherId: 'tch_david',
    day: 'Mon',
    period: 1,
    timeRange: '08:00 - 08:45',
    room: 'B2-08',
  });
  assert.equal(valid.error, undefined);
  assert.ok(valid.slot);
});

test('admin can invite staff/guardians and manage multi-child linkedLearnerIds', () => {
  const invited = invitePortalUserAccount(INITIAL_ECS_STATE, {
    email: 'kwame.mensah@family.org',
    displayName: 'Kwame Mensah',
    role: 'parent',
    linkedLearnerIds: ['lrn_liam', 'lrn_nadia'],
  });
  assert.equal(invited.error, undefined);
  assert.ok(invited.user);
  assert.deepEqual(invited.user.linkedLearnerIds, ['lrn_liam', 'lrn_nadia']);

  const promoted = updatePortalUserAccount(invited.state, invited.user.id, {
    role: 'teacher',
    teacherId: 'tch_david',
    linkedLearnerIds: ['lrn_liam'],
  });
  assert.equal(promoted.error, undefined);
  assert.equal(promoted.user?.role, 'teacher');
  assert.equal(promoted.user?.teacherId, 'tch_david');
  assert.deepEqual(promoted.user?.linkedLearnerIds, ['lrn_liam']);
});

test('subject mastery progression and printable HTML report escape special characters safely', () => {
  const progression = computeSubjectMasteryProgression(
    INITIAL_ECS_STATE,
    'lrn_zuri'
  );
  const mathSeries = progression.find((s) => s.subject.id === 'sub_math5');
  assert.ok(mathSeries);
  assert.equal(mathSeries.points.length, 2);
  assert.equal(mathSeries.latestScore, 92);
  assert.equal(mathSeries.deltaFromFirst, 18);

  const injected = updateLearnerProfile(INITIAL_ECS_STATE, 'lrn_zuri', {
    name: 'Zuri <script>alert(1)</script>',
  });
  const html = buildLearnerPrintableReportHtml(
    injected.state,
    'lrn_zuri',
    'parent',
    { preset: 'since_registration' }
  );
  assert.ok(html);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

