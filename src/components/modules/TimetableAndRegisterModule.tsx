import { useState, type FormEvent } from 'react';
import { CheckCheck, Plus } from 'lucide-react';
import {
  getFieldsForEntity,
  markClassroomAllPresent,
  updateLessonStatus,
  upsertAttendanceRecord,
  upsertTimetableSlot,
} from '../../ecs/engine';
import type {
  AttendanceStatus,
  LessonStatus,
  Role,
  SchoolECSState,
  TimetableSlotEntity,
  Weekday,
} from '../../ecs/types';
import { AppDialog } from '../AppDialog';

interface TimetableModuleProps {
  state: SchoolECSState;
  role: Role;
  onStateChange: (next: SchoolECSState) => void;
}

const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function TimetableModule({
  state,
  role,
  onStateChange,
}: TimetableModuleProps) {
  const [selectedClassroomId, setSelectedClassroomId] = useState(
    state.classrooms[0]?.id ?? ''
  );
  const [activeSlot, setActiveSlot] = useState<TimetableSlotEntity | null>(null);
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [slotClassroomId, setSlotClassroomId] = useState(
    state.classrooms[0]?.id ?? ''
  );
  const [slotSubjectId, setSlotSubjectId] = useState(
    state.subjects[0]?.id ?? ''
  );
  const [slotTeacherId, setSlotTeacherId] = useState(
    state.teachers[0]?.id ?? ''
  );
  const [slotDay, setSlotDay] = useState<Weekday>('Mon');
  const [slotPeriod, setSlotPeriod] = useState(3);
  const [slotTimeRange, setSlotTimeRange] = useState('09:40 - 10:25');
  const [slotRoom, setSlotRoom] = useState('B2-04');
  const [slotError, setSlotError] = useState<string | null>(null);

  const slots = state.timetableSlots.filter(
    (s) => s.classroomId === selectedClassroomId
  );

  const activeSlotSubject = activeSlot
    ? state.subjects.find((s) => s.id === activeSlot.subjectId)
    : null;
  const activeSlotTeacher = activeSlot
    ? state.teachers.find((t) => t.id === activeSlot.teacherId)
    : null;
  const activeSlotPlan = activeSlot
    ? state.lessonPlans.find((lp) => lp.timetableSlotId === activeSlot.id)
    : null;
  const activeSlotSubstrand = activeSlotPlan
    ? state.substrands.find((sub) => sub.id === activeSlotPlan.substrandId)
    : null;

  const canEdit = role === 'admin' || role === 'teacher';

  const handleCreateSlot = (e: FormEvent) => {
    e.preventDefault();
    const res = upsertTimetableSlot(state, {
      classroomId: slotClassroomId,
      subjectId: slotSubjectId,
      teacherId: slotTeacherId,
      day: slotDay,
      period: slotPeriod,
      timeRange: slotTimeRange,
      room: slotRoom,
    });
    if (res.error) {
      setSlotError(res.error);
      return;
    }
    setSlotError(null);
    setShowAddSlotDialog(false);
    setSelectedClassroomId(slotClassroomId);
    onStateChange(res.state);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Weekly Timetable
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Click any period slot to inspect or update its linked Lesson Plan. Overlapping classrooms, teachers, or rooms are blocked automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter timetable by classroom"
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
          >
            {state.classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                setSlotClassroomId(selectedClassroomId);
                setSlotError(null);
                setShowAddSlotDialog(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Timetable Slot
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {DAYS.map((day) => {
          const daySlots = slots
            .filter((s) => s.day === day)
            .sort((a, b) => a.period - b.period);

          return (
            <section
              key={day}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h3 className="border-b border-slate-100 pb-2 font-display text-sm font-bold text-slate-900">
                {day}
              </h3>

              {daySlots.length === 0 ? (
                <p className="mt-4 text-xs text-slate-400">
                  No periods scheduled
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {daySlots.map((slot) => {
                    const subj = state.subjects.find(
                      (s) => s.id === slot.subjectId
                    );
                    const teacher = state.teachers.find(
                      (t) => t.id === slot.teacherId
                    );
                    const linkedPlan = state.lessonPlans.find(
                      (lp) => lp.timetableSlotId === slot.id
                    );

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setActiveSlot(slot)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-left transition-colors hover:border-blue-700 hover:bg-white"
                      >
                        <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                          P{slot.period} · {slot.timeRange}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {subj?.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {teacher?.name} · {slot.room}
                        </p>
                        {linkedPlan && (
                          <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] font-medium text-blue-700">
                            {linkedPlan.title} ({linkedPlan.status})
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Period & Linked Lesson Plan Dialog */}
      <AppDialog
        open={Boolean(activeSlot)}
        title={
          activeSlot
            ? `${activeSlot.day} Period ${activeSlot.period} · ${activeSlotSubject?.name}`
            : ''
        }
        subtitle={
          activeSlot
            ? `${activeSlot.timeRange} · Room ${activeSlot.room} · ${activeSlotTeacher?.name}`
            : ''
        }
        onClose={() => setActiveSlot(null)}
      >
        {activeSlotPlan ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">
                Linked Schemes Substrand: {activeSlotSubstrand?.code}{' '}
                {activeSlotSubstrand?.title}
              </p>
              <h4 className="mt-1 font-display text-base font-bold text-slate-900">
                {activeSlotPlan.title}
              </h4>
              {activeSlotPlan.reflectionNote && (
                <p className="mt-1.5 text-xs text-slate-600">
                  {activeSlotPlan.reflectionNote}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
              <span className="font-medium text-slate-700">
                Current Status:{' '}
                <strong className="capitalize text-slate-900">
                  {activeSlotPlan.status.replace('_', ' ')}
                </strong>
              </span>
              <span className="font-mono text-slate-600 tabular-nums">
                {activeSlotPlan.lessonsDelivered} /{' '}
                {activeSlotSubstrand?.targetLessons ?? 1} lessons
              </span>
            </div>

            {canEdit && (
              <div className="flex flex-wrap gap-2 pt-1">
                {(['planned', 'in_progress', 'taught'] as LessonStatus[]).map(
                  (nextStatus) => (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() =>
                        onStateChange(
                          updateLessonStatus(
                            state,
                            activeSlotPlan.id,
                            nextStatus,
                            nextStatus === 'taught'
                              ? Math.max(2, activeSlotPlan.lessonsDelivered)
                              : nextStatus === 'in_progress'
                                ? Math.max(1, activeSlotPlan.lessonsDelivered)
                                : 0
                          )
                        )
                      }
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        activeSlotPlan.status === nextStatus
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {nextStatus === 'taught'
                        ? 'Mark Taught'
                        : nextStatus === 'in_progress'
                          ? 'In Progress'
                          : 'Planned'}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No Lesson Plan is linked to this period yet. Open Lesson Plans to schedule one for this Timetable slot.
          </p>
        )}
      </AppDialog>

      {/* Admin Add Timetable Slot Dialog with Conflict Detection */}
      <AppDialog
        open={showAddSlotDialog}
        title="Schedule Timetable Slot"
        subtitle="Validates against classroom, teacher, and room conflicts for the selected day and period."
        onClose={() => setShowAddSlotDialog(false)}
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tt-classroom"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Classroom
              </label>
              <select
                id="tt-classroom"
                value={slotClassroomId}
                onChange={(e) => setSlotClassroomId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                {state.classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="tt-subject"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Subject
              </label>
              <select
                id="tt-subject"
                value={slotSubjectId}
                onChange={(e) => setSlotSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="tt-teacher"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Teacher
              </label>
              <select
                id="tt-teacher"
                value={slotTeacherId}
                onChange={(e) => setSlotTeacherId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                {state.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="tt-day"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Weekday
              </label>
              <select
                id="tt-day"
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value as Weekday)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="tt-period"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Period #
              </label>
              <input
                id="tt-period"
                type="number"
                min={1}
                max={12}
                value={slotPeriod}
                onChange={(e) => setSlotPeriod(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tt-time"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Time Range
              </label>
              <input
                id="tt-time"
                type="text"
                value={slotTimeRange}
                onChange={(e) => setSlotTimeRange(e.target.value)}
                placeholder="09:40 - 10:25"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="tt-room"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Room
              </label>
              <input
                id="tt-room"
                type="text"
                value={slotRoom}
                onChange={(e) => setSlotRoom(e.target.value)}
                placeholder="B2-04"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          {slotError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {slotError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddSlotDialog(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Save Timetable Slot
            </button>
          </div>
        </form>
      </AppDialog>
    </div>
  );
}

interface RegisterModuleProps {
  state: SchoolECSState;
  role: Role;
  activeTeacherId: string;
  activeLearnerId: string;
  onStateChange: (next: SchoolECSState) => void;
  onOpenLearnerPage: (learnerId: string) => void;
}

export function ClassRegisterModule({
  state,
  role,
  activeTeacherId,
  activeLearnerId,
  onStateChange,
  onOpenLearnerPage,
}: RegisterModuleProps) {
  const [date, setDate] = useState('2026-11-25');
  const [selectedClassroomId, setSelectedClassroomId] = useState(
    state.classrooms[0]?.id ?? ''
  );

  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const registerFields = getFieldsForEntity(state, 'attendance_record', role);
  const canEdit = role === 'admin' || role === 'teacher';

  const learners =
    role === 'parent'
      ? state.learners.filter((l) => l.id === activeLearnerId)
      : state.learners.filter((l) => l.classroomId === selectedClassroomId);

  const handleMarkAllPresent = () => {
    const res = markClassroomAllPresent(state, {
      classroomId: selectedClassroomId,
      teacherId: activeTeacherId,
      date,
    });
    if (!res.error) {
      onStateChange(res.state);
      setBatchMessage(`Marked ${res.count} learners present for ${date}.`);
      setTimeout(() => setBatchMessage(null), 3000);
    }
  };

  const handleMark = (learnerId: string, status: AttendanceStatus) => {
    const existing = state.attendanceRecords.find(
      (r) => r.learnerId === learnerId && r.date === date
    );
    const res = upsertAttendanceRecord(state, {
      learnerId,
      teacherId: activeTeacherId,
      date,
      status,
      remark: existing?.remark || 'Updated via Class Register.',
      customFields: existing?.customFields ?? { uniform_compliant: true },
    });
    if (!res.error) {
      onStateChange(res.state);
    }
  };

  const handleToggleUniform = (learnerId: string, currentVal: boolean) => {
    const existing = state.attendanceRecords.find(
      (r) => r.learnerId === learnerId && r.date === date
    );
    const res = upsertAttendanceRecord(state, {
      learnerId,
      teacherId: activeTeacherId,
      date,
      status: existing?.status ?? 'present',
      remark: existing?.remark || '',
      customFields: {
        ...(existing?.customFields ?? {}),
        uniform_compliant: !currentVal,
      },
    });
    if (!res.error) {
      onStateChange(res.state);
    }
  };

  const showUniformColumn = registerFields.some(
    (f) => f.key === 'uniform_compliant'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Class Register
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {role === 'parent'
              ? 'Child attendance history. Internal staff flags are automatically hidden.'
              : 'Fast daily roll call with one-tap Mark All Present and role-scoped dynamic flags.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role !== 'parent' && (
            <select
              aria-label="Filter register by classroom"
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            >
              {state.classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <input
            aria-label="Register date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
          />
          {canEdit && (
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark All Present
            </button>
          )}
        </div>
      </div>

      {batchMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-800">
          {batchMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="px-4 py-3">Admission No</th>
              <th className="px-4 py-3">Learner</th>
              <th className="px-4 py-3">Status</th>
              {showUniformColumn && (
                <th className="px-4 py-3">Uniform Check (Staff Only)</th>
              )}
              <th className="px-4 py-3">Remark</th>
              {canEdit && <th className="px-4 py-3 text-right">Mark Roll</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {learners.map((learner) => {
              const rec = state.attendanceRecords.find(
                (r) => r.learnerId === learner.id && r.date === date
              );
              const status = rec?.status ?? 'present';
              const uniformOk = Boolean(
                rec?.customFields?.uniform_compliant ?? true
              );

              const statusColor =
                status === 'present'
                  ? 'text-emerald-700'
                  : status === 'late'
                    ? 'text-amber-700'
                    : status === 'absent'
                      ? 'text-red-700'
                      : 'text-slate-600';

              return (
                <tr key={learner.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 tabular-nums">
                    {learner.admissionNo}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <button
                      type="button"
                      onClick={() => onOpenLearnerPage(learner.id)}
                      className="text-left hover:text-blue-700 hover:underline"
                    >
                      {learner.name}
                    </button>
                  </td>
                  <td
                    className={`px-4 py-3 text-xs font-semibold capitalize ${statusColor}`}
                  >
                    {status}
                  </td>
                  {showUniformColumn && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleUniform(learner.id, uniformOk)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          uniformOk
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {uniformOk ? 'Compliant' : 'Needs Follow-up'}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {rec?.remark || '—'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {(
                          ['present', 'late', 'absent', 'excused'] as AttendanceStatus[]
                        ).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleMark(learner.id, st)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                              status === st
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
