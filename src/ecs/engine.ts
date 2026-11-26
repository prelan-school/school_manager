import type {
  AssessmentEntryEntity,
  AttendanceRecordEntity,
  AttendanceStatus,
  DiaryEntryEntity,
  DynamicFieldDefinition,
  EntityType,
  LearnerTimeframe,
  LearnerTimelineEvent,
  LessonPlanEntity,
  LessonStatus,
  MasteryLevel,
  PageWidgetDefinition,
  PageWidgetId,
  Role,
  SchemeStrandEntity,
  SchemeSubstrandEntity,
  SchoolECSState,
  SubstrandCoverageReport,
  TeacherCoverageSummary,
} from './types';

export function sanitizeFieldKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function registerDynamicField(
  state: SchoolECSState,
  input: Omit<DynamicFieldDefinition, 'id' | 'key'> & { key?: string }
): { state: SchoolECSState; field?: DynamicFieldDefinition; error?: string } {
  const cleanLabel = input.label.trim();
  if (!cleanLabel) {
    return { state, error: 'Field label is required.' };
  }
  const key = sanitizeFieldKey(input.key || cleanLabel);
  if (!key) {
    return { state, error: 'Field key must contain alphanumeric characters.' };
  }
  const exists = state.dynamicFields.some(
    (f) => f.targetEntityType === input.targetEntityType && f.key === key
  );
  if (exists) {
    return {
      state,
      error: `Field "${key}" is already registered on ${input.targetEntityType}.`,
    };
  }
  const field: DynamicFieldDefinition = {
    ...input,
    id: `df_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    key,
    label: cleanLabel,
  };
  return {
    state: {
      ...state,
      dynamicFields: [...state.dynamicFields, field],
    },
    field,
  };
}

export function removeDynamicField(
  state: SchoolECSState,
  fieldId: string
): SchoolECSState {
  return {
    ...state,
    dynamicFields: state.dynamicFields.filter((f) => f.id !== fieldId),
  };
}

export function getFieldsForEntity(
  state: SchoolECSState,
  entityType: DynamicFieldDefinition['targetEntityType'],
  role: Role
): DynamicFieldDefinition[] {
  return state.dynamicFields.filter(
    (f) =>
      f.targetEntityType === entityType &&
      (role === 'admin' || f.visibleTo.includes(role))
  );
}

export function registerSchemeStrand(
  state: SchoolECSState,
  input: {
    subjectId: string;
    code: string;
    title: string;
    term: string;
    createdByTeacherId: string;
  }
): { state: SchoolECSState; strand?: SchemeStrandEntity; error?: string } {
  if (!input.title.trim() || !input.code.trim()) {
    return { state, error: 'Strand code and title are required.' };
  }
  const strand: SchemeStrandEntity = {
    id: `str_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    subjectId: input.subjectId,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    term: input.term.trim() || 'Term 1',
    createdByTeacherId: input.createdByTeacherId,
  };
  return {
    state: {
      ...state,
      strands: [...state.strands, strand],
    },
    strand,
  };
}

export function registerSchemeSubstrand(
  state: SchoolECSState,
  input: {
    strandId: string;
    code: string;
    title: string;
    learningOutcome: string;
    targetLessons: number;
    customFields?: Record<string, string | number | boolean>;
  }
): { state: SchoolECSState; substrand?: SchemeSubstrandEntity; error?: string } {
  const parentStrand = state.strands.find((s) => s.id === input.strandId);
  if (!parentStrand) {
    return { state, error: 'Selected parent strand does not exist.' };
  }
  if (!input.title.trim() || !input.code.trim()) {
    return { state, error: 'Substrand code and title are required.' };
  }
  const substrand: SchemeSubstrandEntity = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    strandId: parentStrand.id,
    subjectId: parentStrand.subjectId,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    learningOutcome: input.learningOutcome.trim(),
    targetLessons: Math.max(1, Number(input.targetLessons) || 1),
    customFields: input.customFields ?? {},
  };
  return {
    state: {
      ...state,
      substrands: [...state.substrands, substrand],
    },
    substrand,
  };
}

export function validateCustomFields(
  fields: DynamicFieldDefinition[],
  values: Record<string, string | number | boolean>,
  role: Role
): string | null {
  for (const def of fields) {
    const canEdit = role === 'admin' || def.editableBy.includes(role);
    if (!canEdit || !def.required) continue;
    const val = values[def.key];
    if (val === undefined || val === null || String(val).trim() === '') {
      return `"${def.label}" is required.`;
    }
  }
  return null;
}

export function createDiaryEntry(
  state: SchoolECSState,
  input: {
    learnerId: string;
    teacherId: string;
    date: string;
    homeworkSummary: string;
    teacherNote: string;
    customFields: Record<string, string | number | boolean>;
    actorRole: Role;
  }
): { state: SchoolECSState; entry?: DiaryEntryEntity; error?: string } {
  const learner = state.learners.find((l) => l.id === input.learnerId);
  if (!learner) {
    return { state, error: 'Selected learner not found.' };
  }
  if (!input.homeworkSummary.trim()) {
    return { state, error: 'Homework summary is required.' };
  }
  const defs = getFieldsForEntity(state, 'diary_entry', input.actorRole);
  const validationError = validateCustomFields(defs, input.customFields, input.actorRole);
  if (validationError) {
    return { state, error: validationError };
  }

  const entry: DiaryEntryEntity = {
    id: `dia_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    learnerId: learner.id,
    classroomId: learner.classroomId,
    teacherId: input.teacherId,
    date: input.date,
    homeworkSummary: input.homeworkSummary.trim(),
    teacherNote: input.teacherNote.trim(),
    parentAcknowledged: false,
    customFields: { ...input.customFields },
  };
  return {
    state: {
      ...state,
      diaryEntries: [entry, ...state.diaryEntries],
    },
    entry,
  };
}

export function toggleDiaryAcknowledgment(
  state: SchoolECSState,
  entryId: string
): SchoolECSState {
  return {
    ...state,
    diaryEntries: state.diaryEntries.map((d) =>
      d.id === entryId ? { ...d, parentAcknowledged: !d.parentAcknowledged } : d
    ),
  };
}

export function createAssessmentEntry(
  state: SchoolECSState,
  input: {
    learnerId: string;
    substrandId: string;
    teacherId: string;
    date: string;
    mastery: MasteryLevel;
    scorePercent: number;
    performanceComment: string;
    customFields: Record<string, string | number | boolean>;
    actorRole: Role;
  }
): { state: SchoolECSState; entry?: AssessmentEntryEntity; error?: string } {
  const learner = state.learners.find((l) => l.id === input.learnerId);
  if (!learner) {
    return { state, error: 'Selected learner not found.' };
  }
  const substrand = state.substrands.find((s) => s.id === input.substrandId);
  if (!substrand) {
    return { state, error: 'Selected substrand not found in Schemes DB.' };
  }
  if (!input.performanceComment.trim()) {
    return { state, error: 'Performance comment is required.' };
  }
  const defs = getFieldsForEntity(state, 'assessment_entry', input.actorRole);
  const validationError = validateCustomFields(defs, input.customFields, input.actorRole);
  if (validationError) {
    return { state, error: validationError };
  }

  const entry: AssessmentEntryEntity = {
    id: `asm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    learnerId: learner.id,
    subjectId: substrand.subjectId,
    strandId: substrand.strandId,
    substrandId: substrand.id,
    teacherId: input.teacherId,
    date: input.date,
    mastery: input.mastery,
    scorePercent: Math.min(100, Math.max(0, Number(input.scorePercent) || 0)),
    performanceComment: input.performanceComment.trim(),
    customFields: { ...input.customFields },
  };
  return {
    state: {
      ...state,
      assessments: [entry, ...state.assessments],
    },
    entry,
  };
}

export function createLessonPlan(
  state: SchoolECSState,
  input: {
    teacherId: string;
    classroomId: string;
    substrandId: string;
    timetableSlotId?: string;
    title: string;
    scheduledDate: string;
    lessonsDelivered: number;
    status: LessonStatus;
    reflectionNote: string;
    customFields?: Record<string, string | number | boolean>;
  }
): { state: SchoolECSState; plan?: LessonPlanEntity; error?: string } {
  const substrand = state.substrands.find((s) => s.id === input.substrandId);
  if (!substrand) {
    return { state, error: 'Substrand must exist in the Schemes database.' };
  }
  if (!input.title.trim()) {
    return { state, error: 'Lesson title is required.' };
  }
  const plan: LessonPlanEntity = {
    id: `lsn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    teacherId: input.teacherId,
    classroomId: input.classroomId,
    subjectId: substrand.subjectId,
    strandId: substrand.strandId,
    substrandId: substrand.id,
    timetableSlotId: input.timetableSlotId,
    title: input.title.trim(),
    scheduledDate: input.scheduledDate,
    lessonsDelivered: Math.max(
      0,
      input.status === 'planned' ? 0 : Number(input.lessonsDelivered) || 1
    ),
    status: input.status,
    reflectionNote: input.reflectionNote.trim(),
    customFields: input.customFields ?? {},
  };
  return {
    state: {
      ...state,
      lessonPlans: [plan, ...state.lessonPlans],
    },
    plan,
  };
}

export function updateLessonStatus(
  state: SchoolECSState,
  lessonPlanId: string,
  status: LessonStatus,
  lessonsDelivered?: number
): SchoolECSState {
  return {
    ...state,
    lessonPlans: state.lessonPlans.map((lp) => {
      if (lp.id !== lessonPlanId) return lp;
      const delivered =
        status === 'planned'
          ? 0
          : lessonsDelivered !== undefined
            ? lessonsDelivered
            : Math.max(1, lp.lessonsDelivered);
      return {
        ...lp,
        status,
        lessonsDelivered: delivered,
      };
    }),
  };
}

export function upsertAttendanceRecord(
  state: SchoolECSState,
  input: {
    learnerId: string;
    teacherId: string;
    date: string;
    status: AttendanceStatus;
    remark: string;
    customFields?: Record<string, string | number | boolean>;
  }
): { state: SchoolECSState; record?: AttendanceRecordEntity; error?: string } {
  const learner = state.learners.find((l) => l.id === input.learnerId);
  if (!learner) {
    return { state, error: 'Learner not found.' };
  }
  const existing = state.attendanceRecords.find(
    (r) => r.learnerId === learner.id && r.date === input.date
  );
  if (existing) {
    const updated: AttendanceRecordEntity = {
      ...existing,
      status: input.status,
      remark: input.remark.trim(),
      teacherId: input.teacherId,
      customFields: {
        ...existing.customFields,
        ...(input.customFields ?? {}),
      },
    };
    return {
      state: {
        ...state,
        attendanceRecords: state.attendanceRecords.map((r) =>
          r.id === existing.id ? updated : r
        ),
      },
      record: updated,
    };
  }

  const record: AttendanceRecordEntity = {
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    learnerId: learner.id,
    classroomId: learner.classroomId,
    teacherId: input.teacherId,
    date: input.date,
    status: input.status,
    remark: input.remark.trim(),
    customFields: input.customFields ?? {},
  };
  return {
    state: {
      ...state,
      attendanceRecords: [record, ...state.attendanceRecords],
    },
    record,
  };
}

export function computeSubstrandCoverage(
  state: SchoolECSState
): SubstrandCoverageReport[] {
  return state.substrands.map((substrand) => {
    const strand = state.strands.find((s) => s.id === substrand.strandId)!;
    const subject = state.subjects.find((s) => s.id === substrand.subjectId)!;
    const plans = state.lessonPlans.filter((lp) => lp.substrandId === substrand.id);
    const taughtPlans = plans.filter((lp) => lp.status === 'taught');
    const deliveredLessons = plans.reduce(
      (sum, lp) => sum + (lp.status === 'planned' ? 0 : lp.lessonsDelivered),
      0
    );
    const coveragePercent = Math.min(
      100,
      Math.round((deliveredLessons / Math.max(1, substrand.targetLessons)) * 100)
    );
    const teacherIds = Array.from(new Set(plans.map((p) => p.teacherId)));
    const teachersInvolved = teacherIds
      .map((id) => state.teachers.find((t) => t.id === id)?.name)
      .filter((n): n is string => Boolean(n));

    return {
      substrand,
      strand,
      subject,
      targetLessons: substrand.targetLessons,
      deliveredLessons,
      taughtPlanCount: taughtPlans.length,
      plannedCount: plans.length,
      coveragePercent,
      teachersInvolved,
    };
  });
}

export function computeTeacherCoverageSummaries(
  state: SchoolECSState
): TeacherCoverageSummary[] {
  return state.teachers.map((teacher) => {
    const plans = state.lessonPlans.filter((lp) => lp.teacherId === teacher.id);
    const taughtPlans = plans.filter((lp) => lp.status === 'taught').length;
    const inProgressPlans = plans.filter((lp) => lp.status === 'in_progress').length;
    const plannedOnly = plans.filter((lp) => lp.status === 'planned').length;
    const totalLessonsDelivered = plans.reduce(
      (sum, lp) => sum + (lp.status === 'planned' ? 0 : lp.lessonsDelivered),
      0
    );
    const diaryEntriesLogged = state.diaryEntries.filter(
      (d) => d.teacherId === teacher.id
    ).length;
    const assessmentsLogged = state.assessments.filter(
      (a) => a.teacherId === teacher.id
    ).length;
    const coverageRatePercent =
      plans.length === 0 ? 0 : Math.round((taughtPlans / plans.length) * 100);

    return {
      teacher,
      totalPlans: plans.length,
      taughtPlans,
      inProgressPlans,
      plannedOnly,
      totalLessonsDelivered,
      diaryEntriesLogged,
      assessmentsLogged,
      coverageRatePercent,
    };
  });
}

export function getEntityGraphSnapshot(
  state: SchoolECSState,
  entityType: EntityType
): unknown[] {
  switch (entityType) {
    case 'classroom':
      return state.classrooms;
    case 'teacher':
      return state.teachers;
    case 'learner':
      return state.learners;
    case 'subject':
      return state.subjects;
    case 'scheme_strand':
      return state.strands;
    case 'scheme_substrand':
      return state.substrands;
    case 'diary_entry':
      return state.diaryEntries;
    case 'assessment_entry':
      return state.assessments;
    case 'lesson_plan':
      return state.lessonPlans;
    case 'timetable_slot':
      return state.timetableSlots;
    case 'attendance_record':
      return state.attendanceRecords;
  }
}

export function getPageWidgetsForRole(
  state: SchoolECSState,
  pageId: PageWidgetDefinition['pageId'],
  role: Role
): PageWidgetDefinition[] {
  return [...state.pageWidgets]
    .filter(
      (w) =>
        w.pageId === pageId &&
        w.enabled &&
        (role === 'admin' || w.allowedRoles.includes(role))
    )
    .sort((a, b) => a.order - b.order);
}

export function togglePageWidgetEnabled(
  state: SchoolECSState,
  widgetId: PageWidgetId
): SchoolECSState {
  return {
    ...state,
    pageWidgets: state.pageWidgets.map((w) =>
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ),
  };
}

export function togglePageWidgetRole(
  state: SchoolECSState,
  widgetId: PageWidgetId,
  role: Exclude<Role, 'admin'>
): SchoolECSState {
  return {
    ...state,
    pageWidgets: state.pageWidgets.map((w) => {
      if (w.id !== widgetId) return w;
      const hasRole = w.allowedRoles.includes(role);
      const nextRoles = hasRole
        ? w.allowedRoles.filter((r) => r !== role)
        : [...w.allowedRoles, role];
      return { ...w, allowedRoles: nextRoles };
    }),
  };
}

export function movePageWidget(
  state: SchoolECSState,
  widgetId: PageWidgetId,
  direction: 'up' | 'down'
): SchoolECSState {
  const sorted = [...state.pageWidgets].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((w) => w.id === widgetId);
  if (idx === -1) return state;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return state;

  const current = sorted[idx];
  const neighbor = sorted[swapIdx];
  return {
    ...state,
    pageWidgets: state.pageWidgets.map((w) => {
      if (w.id === current.id) return { ...w, order: neighbor.order };
      if (w.id === neighbor.id) return { ...w, order: current.order };
      return w;
    }),
  };
}

export function resolveTimeframeBounds(
  registeredAt: string,
  timeframe: LearnerTimeframe,
  referenceToday = '2026-11-25'
): { from: string; to: string } {
  switch (timeframe.preset) {
    case 'since_registration':
      return { from: registeredAt, to: referenceToday };
    case 'this_term':
      return { from: '2026-09-01', to: referenceToday };
    case 'last_30_days':
      return { from: '2026-10-26', to: referenceToday };
    case 'custom':
      return {
        from: timeframe.fromDate || registeredAt,
        to: timeframe.toDate || referenceToday,
      };
  }
}

export function buildLearnerLongitudinalReport(
  state: SchoolECSState,
  learnerId: string,
  role: Role,
  timeframe: LearnerTimeframe,
  referenceToday = '2026-11-25'
) {
  const learner = state.learners.find((l) => l.id === learnerId);
  if (!learner) return null;

  const bounds = resolveTimeframeBounds(
    learner.registeredAt,
    timeframe,
    referenceToday
  );
  const inRange = (d: string) => d >= bounds.from && d <= bounds.to;

  const diary = state.diaryEntries
    .filter((d) => d.learnerId === learnerId && inRange(d.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const assessments = state.assessments
    .filter((a) => a.learnerId === learnerId && inRange(a.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const attendance = state.attendanceRecords
    .filter((r) => r.learnerId === learnerId && inRange(r.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const averageScore =
    assessments.length === 0
      ? null
      : Math.round(
          assessments.reduce((s, a) => s + a.scorePercent, 0) / assessments.length
        );

  const presentOrLate = attendance.filter(
    (r) => r.status === 'present' || r.status === 'late'
  ).length;
  const attendanceRate =
    attendance.length === 0
      ? null
      : Math.round((presentOrLate / attendance.length) * 100);

  const awardsCount = diary.filter(
    (d) =>
      typeof d.customFields.awards === 'string' &&
      d.customFields.awards.trim().length > 0
  ).length;

  const timeline: LearnerTimelineEvent[] = [];

  if (inRange(learner.registeredAt)) {
    timeline.push({
      id: `reg_${learner.id}`,
      date: learner.registeredAt,
      category: 'registration',
      title: `Enrolled (${learner.admissionNo})`,
      detail: `Registered in ${
        state.classrooms.find((c) => c.id === learner.classroomId)?.name ??
        learner.classroomId
      }`,
      meta: `Status: ${learner.enrollmentStatus}`,
    });
  }

  for (const d of diary) {
    const award = d.customFields.awards
      ? ` · Award: ${String(d.customFields.awards)}`
      : '';
    timeline.push({
      id: d.id,
      date: d.date,
      category: 'diary',
      title: `Diary: ${d.homeworkSummary}`,
      detail: `${d.teacherNote || 'Daily log'}${award}`,
      meta: d.parentAcknowledged ? 'Parent signed' : 'Pending sign-off',
    });
  }

  for (const a of assessments) {
    const sub = state.substrands.find((s) => s.id === a.substrandId);
    const subj = state.subjects.find((s) => s.id === a.subjectId);
    timeline.push({
      id: a.id,
      date: a.date,
      category: 'assessment',
      title: `Assessment: ${subj?.name ?? ''} — ${sub?.title ?? a.substrandId}`,
      detail: a.performanceComment,
      meta: `${a.mastery} (${a.scorePercent}%)`,
    });
  }

  for (const r of attendance) {
    const staffNote =
      role !== 'parent' && r.customFields.uniform_compliant !== undefined
        ? ` · Uniform: ${r.customFields.uniform_compliant ? 'Compliant' : 'Follow-up'}`
        : '';
    timeline.push({
      id: r.id,
      date: r.date,
      category: 'attendance',
      title: `Register: ${r.status.toUpperCase()}`,
      detail: `${r.remark || 'Daily roll call'}${staffNote}`,
      meta: r.status,
    });
  }

  timeline.sort((a, b) => b.date.localeCompare(a.date));

  return {
    learner,
    bounds,
    diary,
    assessments,
    attendance,
    averageScore,
    attendanceRate,
    awardsCount,
    timeline,
  };
}

