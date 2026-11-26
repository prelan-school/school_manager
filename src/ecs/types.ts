export type Role = 'admin' | 'teacher' | 'parent';

export type EntityType =
  | 'classroom'
  | 'teacher'
  | 'learner'
  | 'subject'
  | 'scheme_strand'
  | 'scheme_substrand'
  | 'diary_entry'
  | 'assessment_entry'
  | 'lesson_plan'
  | 'timetable_slot'
  | 'attendance_record';

export type DynamicFieldType = 'text' | 'number' | 'boolean' | 'select' | 'date';

export interface DynamicFieldDefinition {
  id: string;
  key: string;
  label: string;
  targetEntityType: Extract<
    EntityType,
    | 'learner'
    | 'diary_entry'
    | 'scheme_strand'
    | 'scheme_substrand'
    | 'assessment_entry'
    | 'lesson_plan'
    | 'timetable_slot'
    | 'attendance_record'
  >;
  fieldType: DynamicFieldType;
  options?: string[];
  required: boolean;
  visibleTo: Role[];
  editableBy: Role[];
  description: string;
  archived?: boolean;
}

export interface PortalUserAccount {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  teacherId?: string;
  linkedLearnerIds: string[];
}

export interface ClassroomEntity {
  id: string;
  name: string;
  gradeLevel: string;
  roomCode: string;
}

export interface TeacherEntity {
  id: string;
  name: string;
  email: string;
  subjectIds: string[];
  classroomIds: string[];
}

export interface LearnerEntity {
  id: string;
  name: string;
  admissionNo: string;
  classroomId: string;
  registeredAt: string;
  enrollmentStatus: 'Active' | 'Probation' | 'Alumni';
  parentName: string;
  parentEmail: string;
  guardianPhone: string;
  internalHealthNote: string;
  customFields: Record<string, string | number | boolean>;
}

export type PageWidgetId =
  | 'learner_overview'
  | 'learner_timeline'
  | 'learner_diary'
  | 'learner_assessments'
  | 'learner_attendance'
  | 'learner_timetable'
  | 'learner_enrollment';

export interface PageWidgetDefinition {
  id: PageWidgetId;
  pageId: 'learner_profile';
  title: string;
  description: string;
  allowedRoles: Role[];
  enabled: boolean;
  order: number;
}

export type TimeframePreset = 'since_registration' | 'this_term' | 'last_30_days' | 'custom';

export interface LearnerTimeframe {
  preset: TimeframePreset;
  fromDate?: string;
  toDate?: string;
}

export interface LearnerTimelineEvent {
  id: string;
  date: string;
  category: 'registration' | 'diary' | 'assessment' | 'attendance';
  title: string;
  detail: string;
  meta: string;
}

export interface SubjectEntity {
  id: string;
  code: string;
  name: string;
  gradeLevel: string;
}

export interface SchemeStrandEntity {
  id: string;
  subjectId: string;
  code: string;
  title: string;
  term: string;
  createdByTeacherId: string;
}

export interface SchemeSubstrandEntity {
  id: string;
  strandId: string;
  subjectId: string;
  code: string;
  title: string;
  learningOutcome: string;
  targetLessons: number;
  customFields: Record<string, string | number | boolean>;
}

export interface DiaryEntryEntity {
  id: string;
  learnerId: string;
  classroomId: string;
  teacherId: string;
  date: string;
  homeworkSummary: string;
  teacherNote: string;
  parentAcknowledged: boolean;
  customFields: Record<string, string | number | boolean>;
}

export type MasteryLevel = 'Exceeding' | 'Meeting' | 'Approaching' | 'Developing';

export interface AssessmentEntryEntity {
  id: string;
  learnerId: string;
  subjectId: string;
  strandId: string;
  substrandId: string;
  teacherId: string;
  date: string;
  mastery: MasteryLevel;
  scorePercent: number;
  performanceComment: string;
  customFields: Record<string, string | number | boolean>;
}

export type LessonStatus = 'planned' | 'in_progress' | 'taught';

export interface LessonPlanEntity {
  id: string;
  teacherId: string;
  classroomId: string;
  subjectId: string;
  strandId: string;
  substrandId: string;
  timetableSlotId?: string;
  title: string;
  scheduledDate: string;
  lessonsDelivered: number;
  status: LessonStatus;
  reflectionNote: string;
  customFields: Record<string, string | number | boolean>;
}

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export interface TimetableSlotEntity {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  day: Weekday;
  period: number;
  timeRange: string;
  room: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface AttendanceRecordEntity {
  id: string;
  learnerId: string;
  classroomId: string;
  teacherId: string;
  date: string;
  status: AttendanceStatus;
  remark: string;
  customFields: Record<string, string | number | boolean>;
}

export interface SchoolECSState {
  users: PortalUserAccount[];
  dynamicFields: DynamicFieldDefinition[];
  pageWidgets: PageWidgetDefinition[];
  classrooms: ClassroomEntity[];
  teachers: TeacherEntity[];
  learners: LearnerEntity[];
  subjects: SubjectEntity[];
  strands: SchemeStrandEntity[];
  substrands: SchemeSubstrandEntity[];
  diaryEntries: DiaryEntryEntity[];
  assessments: AssessmentEntryEntity[];
  lessonPlans: LessonPlanEntity[];
  timetableSlots: TimetableSlotEntity[];
  attendanceRecords: AttendanceRecordEntity[];
}

export interface SubjectMasteryPoint {
  date: string;
  scorePercent: number;
  mastery: MasteryLevel;
  substrandTitle: string;
}

export interface SubjectMasterySeries {
  subject: SubjectEntity;
  points: SubjectMasteryPoint[];
  latestScore: number;
  deltaFromFirst: number;
}

export interface SubstrandCoverageReport {
  substrand: SchemeSubstrandEntity;
  strand: SchemeStrandEntity;
  subject: SubjectEntity;
  targetLessons: number;
  deliveredLessons: number;
  taughtPlanCount: number;
  plannedCount: number;
  coveragePercent: number;
  teachersInvolved: string[];
}

export interface TeacherCoverageSummary {
  teacher: TeacherEntity;
  totalPlans: number;
  taughtPlans: number;
  inProgressPlans: number;
  plannedOnly: number;
  totalLessonsDelivered: number;
  diaryEntriesLogged: number;
  assessmentsLogged: number;
  coverageRatePercent: number;
}
