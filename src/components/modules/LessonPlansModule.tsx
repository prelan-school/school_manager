import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  createLessonPlan,
  getFieldsForEntity,
  updateLessonStatus,
} from '../../ecs/engine';
import type { LessonStatus, Role, SchoolECSState } from '../../ecs/types';
import { AppDialog } from '../AppDialog';
import {
  DynamicFieldInputs,
  DynamicFieldReadout,
} from '../DynamicFieldsRenderer';

interface LessonPlansModuleProps {
  state: SchoolECSState;
  role: Role;
  activeTeacherId: string;
  onStateChange: (next: SchoolECSState) => void;
}

export function LessonPlansModule({
  state,
  role,
  activeTeacherId,
  onStateChange,
}: LessonPlansModuleProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [classroomId, setClassroomId] = useState(state.classrooms[0]?.id ?? '');
  const [substrandId, setSubstrandId] = useState(state.substrands[0]?.id ?? '');
  const [timetableSlotId, setTimetableSlotId] = useState(
    state.timetableSlots[0]?.id ?? ''
  );
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2026-11-26');
  const [lessonsDelivered, setLessonsDelivered] = useState(2);
  const [status, setStatus] = useState<LessonStatus>('planned');
  const [reflectionNote, setReflectionNote] = useState('');
  const [customFields, setCustomFields] = useState<
    Record<string, string | number | boolean>
  >({});
  const [error, setError] = useState<string | null>(null);

  const canEdit = role === 'admin' || role === 'teacher';
  const lessonFields = getFieldsForEntity(state, 'lesson_plan', role);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const res = createLessonPlan(state, {
      teacherId: activeTeacherId,
      classroomId,
      substrandId,
      timetableSlotId: timetableSlotId || undefined,
      title,
      scheduledDate,
      lessonsDelivered,
      status,
      reflectionNote,
      customFields,
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    setError(null);
    setTitle('');
    setReflectionNote('');
    setCustomFields({});
    onStateChange(res.state);
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Lesson Plans &amp; Syllabus Coverage
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Each Lesson Plan binds a Schemes Substrand and Timetable Slot. Marking a lesson as Taught updates Admin Coverage immediately.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Schedule Lesson Plan
          </button>
        )}
      </div>

      <AppDialog
        open={showCreateDialog}
        title="Schedule Lesson Plan"
        subtitle="Link a canonical Schemes Substrand and Timetable period."
        onClose={() => setShowCreateDialog(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label
              htmlFor="lp-substrand"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Scheme Substrand (Linked)
            </label>
            <select
              id="lp-substrand"
              value={substrandId}
              onChange={(e) => setSubstrandId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            >
              {state.substrands.map((sub) => {
                const subj = state.subjects.find((s) => s.id === sub.subjectId);
                return (
                  <option key={sub.id} value={sub.id}>
                    {subj?.code} · {sub.code} — {sub.title}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="lp-class"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Classroom
              </label>
              <select
                id="lp-class"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
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
                htmlFor="lp-slot"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Timetable Slot
              </label>
              <select
                id="lp-slot"
                value={timetableSlotId}
                onChange={(e) => setTimetableSlotId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                {state.timetableSlots.map((slot) => {
                  const subj = state.subjects.find((s) => s.id === slot.subjectId);
                  return (
                    <option key={slot.id} value={slot.id}>
                      {slot.day} P{slot.period} · {subj?.code}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="lp-title"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Lesson Focus Title *
            </label>
            <input
              id="lp-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Polyhedra Net Folding"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="lp-date"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Date
              </label>
              <input
                id="lp-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="lp-status"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="lp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LessonStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs focus:border-blue-700 focus:outline-none"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="taught">Taught</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="lp-count"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Periods Taught
              </label>
              <input
                id="lp-count"
                type="number"
                min={0}
                max={10}
                value={lessonsDelivered}
                onChange={(e) => setLessonsDelivered(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs tabular-nums focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lp-reflection"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Teaching Reflection
            </label>
            <input
              id="lp-reflection"
              type="text"
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="Notes on pacing or learner misconceptions..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <DynamicFieldInputs
            fields={lessonFields}
            values={customFields}
            role={role}
            onChange={(key, value) =>
              setCustomFields((prev) => ({ ...prev, [key]: value }))
            }
          />

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateDialog(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Save Lesson Plan
            </button>
          </div>
        </form>
      </AppDialog>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {state.lessonPlans.map((lp) => {
          const subject = state.subjects.find((s) => s.id === lp.subjectId);
          const strand = state.strands.find((st) => st.id === lp.strandId);
          const substrand = state.substrands.find(
            (sub) => sub.id === lp.substrandId
          );
          const teacher = state.teachers.find((t) => t.id === lp.teacherId);
          const slot = state.timetableSlots.find(
            (sl) => sl.id === lp.timetableSlotId
          );

          const statusColor =
            lp.status === 'taught'
              ? 'text-emerald-700'
              : lp.status === 'in_progress'
                ? 'text-amber-700'
                : 'text-slate-600';

          return (
            <article
              key={lp.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {lp.scheduledDate} · {subject?.name} · {strand?.code}{' '}
                    &rarr; {substrand?.code} {substrand?.title}
                    {slot ? ` · ${slot.day} P${slot.period}` : ''}
                  </p>
                  <h3 className="mt-1 font-display text-base font-bold text-slate-900">
                    {lp.title}
                  </h3>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-semibold ${statusColor}`}>
                    {lp.status === 'taught'
                      ? 'Taught'
                      : lp.status === 'in_progress'
                        ? 'In Progress'
                        : 'Planned'}
                  </span>
                  <p className="font-mono text-xs text-slate-600 tabular-nums">
                    {lp.lessonsDelivered} / {substrand?.targetLessons ?? 1} lessons
                  </p>
                </div>
              </div>

              {lp.reflectionNote && (
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {lp.reflectionNote}
                </p>
              )}

              <DynamicFieldReadout
                fields={lessonFields}
                values={lp.customFields ?? {}}
                role={role}
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  Teacher: {teacher?.name}
                </span>

                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    {(['planned', 'in_progress', 'taught'] as LessonStatus[]).map(
                      (nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() =>
                            onStateChange(
                              updateLessonStatus(
                                state,
                                lp.id,
                                nextStatus,
                                nextStatus === 'taught'
                                  ? Math.max(2, lp.lessonsDelivered)
                                  : nextStatus === 'in_progress'
                                    ? Math.max(1, lp.lessonsDelivered)
                                    : 0
                              )
                            )
                          }
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            lp.status === nextStatus
                              ? 'bg-slate-900 text-white'
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
            </article>
          );
        })}
      </div>
    </div>
  );
}
