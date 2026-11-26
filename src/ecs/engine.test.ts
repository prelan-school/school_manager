import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_ECS_STATE } from './initialData';
import {
  buildLearnerLongitudinalReport,
  computeSubstrandCoverage,
  computeTeacherCoverageSummaries,
  createAssessmentEntry,
  createDiaryEntry,
  createLessonPlan,
  getFieldsForEntity,
  getPageWidgetsForRole,
  registerDynamicField,
  registerSchemeStrand,
  registerSchemeSubstrand,
  togglePageWidgetEnabled,
  togglePageWidgetRole,
  updateLessonStatus,
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
