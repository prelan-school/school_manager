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
  PortalUserAccount,
  Role,
  SchemeStrandEntity,
  SchemeSubstrandEntity,
  SchoolECSState,
  SubjectMasteryPoint,
  SubjectMasterySeries,
  SubstrandCoverageReport,
  TeacherCoverageSummary,
  TimetableSlotEntity,
  Weekday,
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

export function updateDynamicField(
  state: SchoolECSState,
  fieldId: string,
  updates: Partial<
    Pick<
      DynamicFieldDefinition,
      | 'label'
      | 'targetEntityType'
      | 'fieldType'
      | 'options'
      | 'required'
      | 'visibleTo'
      | 'editableBy'
      | 'description'
    >
  >
): { state: SchoolECSState; field?: DynamicFieldDefinition; error?: string } {
  const existing = state.dynamicFields.find((f) => f.id === fieldId);
  if (!existing) {
    return { state, error: 'Component field not found.' };
  }
  const nextLabel = (updates.label ?? existing.label).trim();
  if (!nextLabel) {
    return { state, error: 'Field label is required.' };
  }
  const nextTarget = updates.targetEntityType ?? existing.targetEntityType;
  const nextKey = sanitizeFieldKey(nextLabel);
  if (!nextKey) {
    return { state, error: 'Field label must contain alphanumeric characters.' };
  }
  const duplicate = state.dynamicFields.some(
    (f) =>
      f.id !== fieldId &&
      f.targetEntityType === nextTarget &&
      f.key === nextKey
  );
  if (duplicate) {
    return {
      state,
      error: `Another field "${nextKey}" already exists on ${nextTarget}.`,
    };
  }

  const nextField: DynamicFieldDefinition = {
    ...existing,
    ...updates,
    label: nextLabel,
    key: nextKey,
    targetEntityType: nextTarget,
    visibleTo: updates.visibleTo
      ? updates.visibleTo.includes('admin')
        ? updates.visibleTo
        : ['admin', ...updates.visibleTo]
      : existing.visibleTo,
    editableBy: updates.editableBy
      ? updates.editableBy.includes('admin')
        ? updates.editableBy
        : ['admin', ...updates.editableBy]
      : existing.editableBy,
  };

  return {
    state: {
      ...state,
      dynamicFields: state.dynamicFields.map((f) =>
        f.id === fieldId ? nextField : f
      ),
    },
    field: nextField,
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

export function archiveDynamicField(
  state: SchoolECSState,
  fieldId: string
): SchoolECSState {
  return {
    ...state,
    dynamicFields: state.dynamicFields.map((f) =>
      f.id === fieldId ? { ...f, archived: true } : f
    ),
  };
}

export function restoreDynamicField(
  state: SchoolECSState,
  fieldId: string
): SchoolECSState {
  return {
    ...state,
    dynamicFields: state.dynamicFields.map((f) =>
      f.id === fieldId ? { ...f, archived: false } : f
    ),
  };
}

export function updateLearnerProfile(
  state: SchoolECSState,
  learnerId: string,
  updates: {
    name?: string;
    enrollmentStatus?: 'Active' | 'Probation' | 'Alumni';
    parentName?: string;
    guardianPhone?: string;
    internalHealthNote?: string;
    customFields?: Record<string, string | number | boolean>;
  }
): { state: SchoolECSState; error?: string } {
  const existing = state.learners.find((l) => l.id === learnerId);
  if (!existing) {
    return { state, error: 'Learner not found.' };
  }
  const nextName = (updates.name ?? existing.name).trim();
  if (!nextName) {
    return { state, error: 'Learner name is required.' };
  }
  const learnerFields = getFieldsForEntity(state, 'learner', 'admin');
  const nextCustom = {
    ...existing.customFields,
    ...(updates.customFields ?? {}),
  };
  const err = validateCustomFields(learnerFields, nextCustom, 'admin');
  if (err) {
    return { state, error: err };
  }
  return {
    state: {
      ...state,
      learners: state.learners.map((l) =>
        l.id === learnerId
          ? {
              ...l,
              ...updates,
              name: nextName,
              customFields: nextCustom,
            }
          : l
      ),
    },
  };
}

export function getFieldsForEntity(
  state: SchoolECSState,
  entityType: DynamicFieldDefinition['targetEntityType'],
  role: Role,
  includeArchived = false
): DynamicFieldDefinition[] {
  return state.dynamicFields.filter(
    (f) =>
      f.targetEntityType === entityType &&
      (includeArchived || !f.archived) &&
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

export function broadcastClassroomDiary(
  state: SchoolECSState,
  input: {
    classroomId: string;
    teacherId: string;
    date: string;
    homeworkSummary: string;
    teacherNote: string;
    customFields: Record<string, string | number | boolean>;
    actorRole: Role;
  }
): { state: SchoolECSState; entries: DiaryEntryEntity[]; error?: string } {
  const classroomLearners = state.learners.filter(
    (l) => l.classroomId === input.classroomId
  );
  if (classroomLearners.length === 0) {
    return {
      state,
      entries: [],
      error: 'No learners enrolled in the selected classroom.',
    };
  }
  if (!input.homeworkSummary.trim()) {
    return { state, entries: [], error: 'Homework summary is required.' };
  }
  const defs = getFieldsForEntity(state, 'diary_entry', input.actorRole);
  const validationError = validateCustomFields(
    defs,
    input.customFields,
    input.actorRole
  );
  if (validationError) {
    return { state, entries: [], error: validationError };
  }

  const stamp = Date.now();
  const entries: DiaryEntryEntity[] = classroomLearners.map((learner, idx) => ({
    id: `dia_${stamp}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
    learnerId: learner.id,
    classroomId: learner.classroomId,
    teacherId: input.teacherId,
    date: input.date,
    homeworkSummary: input.homeworkSummary.trim(),
    teacherNote: input.teacherNote.trim(),
    parentAcknowledged: false,
    customFields: { ...input.customFields },
  }));

  return {
    state: {
      ...state,
      diaryEntries: [...entries, ...state.diaryEntries],
    },
    entries,
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

export function markClassroomAllPresent(
  state: SchoolECSState,
  input: {
    classroomId: string;
    teacherId: string;
    date: string;
  }
): { state: SchoolECSState; count: number; error?: string } {
  const learners = state.learners.filter(
    (l) => l.classroomId === input.classroomId
  );
  if (learners.length === 0) {
    return {
      state,
      count: 0,
      error: 'No learners enrolled in the selected classroom.',
    };
  }
  let nextState = state;
  for (const learner of learners) {
    const existing = nextState.attendanceRecords.find(
      (r) => r.learnerId === learner.id && r.date === input.date
    );
    const res = upsertAttendanceRecord(nextState, {
      learnerId: learner.id,
      teacherId: input.teacherId,
      date: input.date,
      status: 'present',
      remark: existing?.remark || 'Batch roll call: Present.',
      customFields: existing?.customFields ?? { uniform_compliant: true },
    });
    if (!res.error) {
      nextState = res.state;
    }
  }
  return { state: nextState, count: learners.length };
}

export function detectTimetableConflict(
  slots: TimetableSlotEntity[],
  candidate: {
    classroomId: string;
    teacherId: string;
    day: Weekday;
    period: number;
    room: string;
  },
  ignoreSlotId?: string
): string | null {
  const normalizedRoom = candidate.room.trim().toLowerCase();
  for (const slot of slots) {
    if (ignoreSlotId && slot.id === ignoreSlotId) continue;
    if (slot.day !== candidate.day || slot.period !== candidate.period) {
      continue;
    }
    if (slot.classroomId === candidate.classroomId) {
      return `Classroom already has a scheduled period on ${candidate.day} P${candidate.period}.`;
    }
    if (slot.teacherId === candidate.teacherId) {
      return `Teacher is already double-booked on ${candidate.day} P${candidate.period}.`;
    }
    if (
      normalizedRoom &&
      slot.room.trim().toLowerCase() === normalizedRoom
    ) {
      return `Room "${candidate.room.trim()}" is already booked on ${candidate.day} P${candidate.period}.`;
    }
  }
  return null;
}

export function upsertTimetableSlot(
  state: SchoolECSState,
  input: {
    id?: string;
    classroomId: string;
    subjectId: string;
    teacherId: string;
    day: Weekday;
    period: number;
    timeRange: string;
    room: string;
  }
): { state: SchoolECSState; slot?: TimetableSlotEntity; error?: string } {
  if (!input.classroomId || !input.subjectId || !input.teacherId) {
    return { state, error: 'Classroom, subject, and teacher are required.' };
  }
  const cleanRoom = input.room.trim();
  const cleanTime = input.timeRange.trim();
  if (!cleanRoom || !cleanTime) {
    return { state, error: 'Time range and room code are required.' };
  }
  const period = Math.max(1, Math.min(12, Math.round(Number(input.period) || 1)));
  const conflict = detectTimetableConflict(
    state.timetableSlots,
    {
      classroomId: input.classroomId,
      teacherId: input.teacherId,
      day: input.day,
      period,
      room: cleanRoom,
    },
    input.id
  );
  if (conflict) {
    return { state, error: conflict };
  }

  const slot: TimetableSlotEntity = {
    id:
      input.id ??
      `tt_${input.day.toLowerCase()}_${period}_${Date.now().toString(36)}`,
    classroomId: input.classroomId,
    subjectId: input.subjectId,
    teacherId: input.teacherId,
    day: input.day,
    period,
    timeRange: cleanTime,
    room: cleanRoom,
  };

  const exists = Boolean(
    input.id && state.timetableSlots.some((s) => s.id === input.id)
  );
  return {
    state: {
      ...state,
      timetableSlots: exists
        ? state.timetableSlots.map((s) => (s.id === slot.id ? slot : s))
        : [...state.timetableSlots, slot],
    },
    slot,
  };
}

export function invitePortalUserAccount(
  state: SchoolECSState,
  input: {
    email: string;
    displayName: string;
    role: Role;
    teacherId?: string;
    linkedLearnerIds: string[];
  }
): { state: SchoolECSState; user?: PortalUserAccount; error?: string } {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!email || !email.includes('@')) {
    return { state, error: 'Valid user email is required.' };
  }
  if (!displayName) {
    return { state, error: 'Display name is required.' };
  }
  if (state.users.some((u) => u.email.toLowerCase() === email)) {
    return { state, error: `A user account with ${email} already exists.` };
  }
  const user: PortalUserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email,
    displayName,
    role: input.role,
    teacherId: input.role === 'parent' ? undefined : input.teacherId || undefined,
    linkedLearnerIds: Array.from(new Set(input.linkedLearnerIds)),
  };
  return {
    state: {
      ...state,
      users: [...state.users, user],
    },
    user,
  };
}

export function updatePortalUserAccount(
  state: SchoolECSState,
  userId: string,
  updates: Partial<
    Pick<
      PortalUserAccount,
      'displayName' | 'role' | 'teacherId' | 'linkedLearnerIds'
    >
  >
): { state: SchoolECSState; user?: PortalUserAccount; error?: string } {
  const existing = state.users.find((u) => u.id === userId);
  if (!existing) {
    return { state, error: 'User account not found.' };
  }
  const nextRole = updates.role ?? existing.role;
  const nextName = (updates.displayName ?? existing.displayName).trim();
  if (!nextName) {
    return { state, error: 'Display name is required.' };
  }
  const updated: PortalUserAccount = {
    ...existing,
    ...updates,
    displayName: nextName,
    role: nextRole,
    teacherId:
      nextRole === 'parent'
        ? undefined
        : updates.teacherId !== undefined
          ? updates.teacherId || undefined
          : existing.teacherId,
    linkedLearnerIds: Array.from(
      new Set(updates.linkedLearnerIds ?? existing.linkedLearnerIds)
    ),
  };
  return {
    state: {
      ...state,
      users: state.users.map((u) => (u.id === userId ? updated : u)),
    },
    user: updated,
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

export function computeSubjectMasteryProgression(
  state: SchoolECSState,
  learnerId: string,
  fromDate?: string,
  toDate?: string
): SubjectMasterySeries[] {
  const filtered = state.assessments
    .filter((a) => {
      if (a.learnerId !== learnerId) return false;
      if (fromDate && a.date < fromDate) return false;
      if (toDate && a.date > toDate) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const bySubject = new Map<string, SubjectMasteryPoint[]>();
  for (const entry of filtered) {
    const sub = state.substrands.find((s) => s.id === entry.substrandId);
    const pt: SubjectMasteryPoint = {
      date: entry.date,
      scorePercent: entry.scorePercent,
      mastery: entry.mastery,
      substrandTitle: sub ? `${sub.code}: ${sub.title}` : entry.substrandId,
    };
    const arr = bySubject.get(entry.subjectId) ?? [];
    arr.push(pt);
    bySubject.set(entry.subjectId, arr);
  }

  const series: SubjectMasterySeries[] = [];
  for (const subject of state.subjects) {
    const points = bySubject.get(subject.id);
    if (!points || points.length === 0) continue;
    const latestScore = points[points.length - 1].scorePercent;
    const deltaFromFirst = latestScore - points[0].scorePercent;
    series.push({
      subject,
      points,
      latestScore,
      deltaFromFirst,
    });
  }
  return series;
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildLearnerPrintableReportHtml(
  state: SchoolECSState,
  learnerId: string,
  role: Role,
  timeframe: LearnerTimeframe,
  referenceToday = '2026-11-25'
): string | null {
  const report = buildLearnerLongitudinalReport(
    state,
    learnerId,
    role,
    timeframe,
    referenceToday
  );
  if (!report) return null;

  const { learner, bounds } = report;
  const classroom = state.classrooms.find((c) => c.id === learner.classroomId);
  const progression = computeSubjectMasteryProgression(
    state,
    learnerId,
    bounds.from,
    bounds.to
  );

  const subjectRows = progression
    .map((s) => {
      const deltaSign = s.deltaFromFirst >= 0 ? '+' : '';
      return `<tr>
        <td>${escapeHtml(s.subject.name)}</td>
        <td>${s.points.length}</td>
        <td>${s.latestScore}%</td>
        <td>${deltaSign}${s.deltaFromFirst}%</td>
      </tr>`;
    })
    .join('');

  const assessmentRows = report.assessments
    .map((a) => {
      const subj = state.subjects.find((s) => s.id === a.subjectId);
      const sub = state.substrands.find((s) => s.id === a.substrandId);
      return `<tr>
        <td>${escapeHtml(a.date)}</td>
        <td>${escapeHtml(subj?.name ?? a.subjectId)}</td>
        <td>${escapeHtml(sub ? `${sub.code}: ${sub.title}` : a.substrandId)}</td>
        <td>${escapeHtml(a.mastery)} (${a.scorePercent}%)</td>
        <td>${escapeHtml(a.performanceComment)}</td>
      </tr>`;
    })
    .join('');

  const diaryRows = report.diary
    .map(
      (d) => `<tr>
        <td>${escapeHtml(d.date)}</td>
        <td>${escapeHtml(d.homeworkSummary)}</td>
        <td>${escapeHtml(d.teacherNote || '—')}</td>
        <td>${d.parentAcknowledged ? 'Signed' : 'Pending'}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Learner Report — ${escapeHtml(learner.name)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 32px; line-height: 1.5; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    h2 { margin: 24px 0 8px; font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .meta { color: #475569; font-size: 13px; margin-bottom: 16px; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 16px 0; }
    .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; }
    .kpi-label { font-size: 11px; color: #64748b; }
    .kpi-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(learner.name)} — Longitudinal Learner Report</h1>
  <div class="meta">
    Admission: ${escapeHtml(learner.admissionNo)} · Classroom: ${escapeHtml(classroom?.name ?? learner.classroomId)} · Window: ${escapeHtml(bounds.from)} to ${escapeHtml(bounds.to)} · Portal View: ${escapeHtml(role.toUpperCase())}
  </div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-label">Registered</div><div class="kpi-value">${escapeHtml(learner.registeredAt)}</div></div>
    <div class="kpi"><div class="kpi-label">Average Assessment</div><div class="kpi-value">${report.averageScore !== null ? `${report.averageScore}%` : '—'}</div></div>
    <div class="kpi"><div class="kpi-label">Attendance Rate</div><div class="kpi-value">${report.attendanceRate !== null ? `${report.attendanceRate}%` : '—'}</div></div>
    <div class="kpi"><div class="kpi-label">Diary Awards</div><div class="kpi-value">${report.awardsCount} / ${report.diary.length}</div></div>
  </div>
  <h2>Subject Mastery Progression</h2>
  <table><thead><tr><th>Subject</th><th>Assessments</th><th>Latest Score</th><th>Progression</th></tr></thead><tbody>${subjectRows || '<tr><td colspan="4">No subject assessments in range.</td></tr>'}</tbody></table>
  <h2>Assessment Book</h2>
  <table><thead><tr><th>Date</th><th>Subject</th><th>Substrand</th><th>Mastery</th><th>Comment</th></tr></thead><tbody>${assessmentRows || '<tr><td colspan="5">No assessments in range.</td></tr>'}</tbody></table>
  <h2>School Diary</h2>
  <table><thead><tr><th>Date</th><th>Homework</th><th>Teacher Note</th><th>Parent Sign-off</th></tr></thead><tbody>${diaryRows || '<tr><td colspan="4">No diary entries in range.</td></tr>'}</tbody></table>
</body>
</html>`;
}


