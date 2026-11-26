import { useState, type FormEvent } from 'react';
import { CheckCircle2, Megaphone, Plus } from 'lucide-react';
import {
  broadcastClassroomDiary,
  getFieldsForEntity,
  registerDynamicField,
  toggleDiaryAcknowledgment,
} from '../../ecs/engine';
import type {
  DynamicFieldType,
  Role,
  SchoolECSState,
} from '../../ecs/types';
import { AppDialog } from '../AppDialog';
import {
  DynamicFieldInputs,
  DynamicFieldReadout,
} from '../DynamicFieldsRenderer';

interface DiaryModuleProps {
  state: SchoolECSState;
  role: Role;
  activeTeacherId: string;
  activeLearnerId: string;
  onStateChange: (next: SchoolECSState) => void;
  onOpenDiaryDialog: (learnerId?: string) => void;
  onOpenLearnerPage: (learnerId: string) => void;
}

export function DiaryModule({
  state,
  role,
  activeTeacherId,
  activeLearnerId,
  onStateChange,
  onOpenDiaryDialog,
  onOpenLearnerPage,
}: DiaryModuleProps) {
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<DynamicFieldType>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldParentVisible, setNewFieldParentVisible] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastClassroomId, setBroadcastClassroomId] = useState(
    state.classrooms[0]?.id ?? ''
  );
  const [broadcastDate, setBroadcastDate] = useState('2026-11-25');
  const [broadcastHomework, setBroadcastHomework] = useState('');
  const [broadcastNote, setBroadcastNote] = useState('');
  const [broadcastCustomValues, setBroadcastCustomValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastBanner, setBroadcastBanner] = useState<string | null>(null);

  const activeDiaryFields = getFieldsForEntity(state, 'diary_entry', role, false);
  const diaryReadoutFields = getFieldsForEntity(state, 'diary_entry', role, true);

  const visibleEntries =
    role === 'parent'
      ? state.diaryEntries.filter((d) => d.learnerId === activeLearnerId)
      : state.diaryEntries;

  const handleAddField = (e: FormEvent) => {
    e.preventDefault();
    const res = registerDynamicField(state, {
      label: newFieldLabel,
      targetEntityType: 'diary_entry',
      fieldType: newFieldType,
      options:
        newFieldType === 'select'
          ? newFieldOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      required: false,
      visibleTo: newFieldParentVisible
        ? ['admin', 'teacher', 'parent']
        : ['admin', 'teacher'],
      editableBy: ['admin', 'teacher'],
      description: 'Custom diary component field',
    });
    if (res.error) {
      setFieldError(res.error);
      return;
    }
    setFieldError(null);
    setNewFieldLabel('');
    setNewFieldOptions('');
    setShowFieldDialog(false);
    onStateChange(res.state);
  };

  const handleBroadcastSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = broadcastClassroomDiary(state, {
      classroomId: broadcastClassroomId,
      teacherId: activeTeacherId,
      date: broadcastDate,
      homeworkSummary: broadcastHomework,
      teacherNote: broadcastNote,
      customFields: broadcastCustomValues,
      actorRole: role,
    });
    if (res.error) {
      setBroadcastError(res.error);
      return;
    }
    setBroadcastError(null);
    setBroadcastHomework('');
    setBroadcastNote('');
    setBroadcastCustomValues({});
    setShowBroadcastDialog(false);
    setBroadcastBanner(
      `Broadcasted diary entry to ${res.entries.length} learners.`
    );
    setTimeout(() => setBroadcastBanner(null), 3500);
    onStateChange(res.state);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            School Diary
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {role === 'parent'
              ? 'Child-scoped daily homework, teacher notes, dynamic awards, and parent acknowledgment.'
              : 'Loosely coupled daily diary feed. Broadcast class homework or log individual learner entries via dialogs.'}
          </p>
        </div>

        {(role === 'admin' || role === 'teacher') && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFieldDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Custom Diary Field
            </button>
            <button
              type="button"
              onClick={() => {
                setBroadcastError(null);
                setShowBroadcastDialog(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap shrink-0"
            >
              <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
              Broadcast to Class
            </button>
            <button
              type="button"
              onClick={() => onOpenDiaryDialog()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Log Diary Entry
            </button>
          </div>
        )}
      </div>

      {broadcastBanner && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
          {broadcastBanner}
        </div>
      )}

      {/* Class-Wide Broadcast Dialog */}
      <AppDialog
        open={showBroadcastDialog}
        title="Broadcast Diary to Classroom"
        subtitle="Assign homework once to every learner in the selected classroom."
        onClose={() => setShowBroadcastDialog(false)}
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="broadcast-classroom"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Classroom
              </label>
              <select
                id="broadcast-classroom"
                value={broadcastClassroomId}
                onChange={(e) => setBroadcastClassroomId(e.target.value)}
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
                htmlFor="broadcast-date"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Date
              </label>
              <input
                id="broadcast-date"
                type="date"
                value={broadcastDate}
                onChange={(e) => setBroadcastDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="broadcast-homework"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Class Homework Assignment *
            </label>
            <textarea
              id="broadcast-homework"
              rows={2}
              value={broadcastHomework}
              onChange={(e) => setBroadcastHomework(e.target.value)}
              placeholder="e.g. Complete Fractions Mastery Sheet Q1-Q10..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="broadcast-note"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Shared Class Note
            </label>
            <input
              id="broadcast-note"
              type="text"
              value={broadcastNote}
              onChange={(e) => setBroadcastNote(e.target.value)}
              placeholder="Reminder for all parents in this classroom..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <DynamicFieldInputs
            fields={activeDiaryFields}
            values={broadcastCustomValues}
            role={role}
            onChange={(key, val) =>
              setBroadcastCustomValues((prev) => ({ ...prev, [key]: val }))
            }
          />

          {broadcastError && (
            <p className="text-xs font-medium text-red-600">{broadcastError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowBroadcastDialog(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Broadcast to Classroom
            </button>
          </div>
        </form>
      </AppDialog>

      {/* Custom Field Dialog */}
      <AppDialog
        open={showFieldDialog}
        title="Add Custom Diary Field"
        subtitle="Dynamically attach a new ECS field to diary_entry documents without altering schemas."
        onClose={() => setShowFieldDialog(false)}
      >
        <form onSubmit={handleAddField} className="space-y-4">
          <div>
            <label
              htmlFor="quick-diary-field-label"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Field Label *
            </label>
            <input
              id="quick-diary-field-label"
              type="text"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="e.g. Citizenship Merit"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="quick-diary-field-type"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Component Data Type
              </label>
              <select
                id="quick-diary-field-type"
                value={newFieldType}
                onChange={(e) =>
                  setNewFieldType(e.target.value as DynamicFieldType)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Checkbox (Boolean)</option>
                <option value="select">Select Options</option>
              </select>
            </div>

            <label className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={newFieldParentVisible}
                onChange={(e) => setNewFieldParentVisible(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700"
              />
              Visible in Parent Portal
            </label>
          </div>

          {newFieldType === 'select' && (
            <div>
              <label
                htmlFor="quick-diary-field-opts"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Comma-Separated Options
              </label>
              <input
                id="quick-diary-field-opts"
                type="text"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
                placeholder="Gold Star, Helper, Reader"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
          )}

          {fieldError && (
            <p className="text-xs font-medium text-red-600">{fieldError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowFieldDialog(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Register Component Field
            </button>
          </div>
        </form>
      </AppDialog>

      {visibleEntries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-800">
            No diary entries recorded yet for this view.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visibleEntries.map((entry) => {
            const learner = state.learners.find((l) => l.id === entry.learnerId);
            const teacher = state.teachers.find((t) => t.id === entry.teacherId);
            const classroom = state.classrooms.find(
              (c) => c.id === entry.classroomId
            );

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {entry.date} · {classroom?.name} · Logged by {teacher?.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => learner && onOpenLearnerPage(learner.id)}
                      className="mt-1 text-left font-display text-base font-bold text-slate-900 hover:text-blue-700 hover:underline"
                    >
                      {learner?.name}
                    </button>
                  </div>

                  {role === 'parent' ? (
                    <button
                      type="button"
                      onClick={() =>
                        onStateChange(toggleDiaryAcknowledgment(state, entry.id))
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        entry.parentAcknowledged
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'bg-blue-700 text-white hover:bg-blue-800'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {entry.parentAcknowledged
                        ? 'Acknowledged by Parent'
                        : 'Acknowledge Entry'}
                    </button>
                  ) : (
                    <span
                      className={`text-xs font-medium ${
                        entry.parentAcknowledged
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {entry.parentAcknowledged
                        ? 'Parent Signed'
                        : 'Awaiting Parent Sign-off'}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-slate-800">
                  <span className="font-semibold">Homework: </span>
                  {entry.homeworkSummary}
                </p>
                {entry.teacherNote && (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">Note: </span>
                    {entry.teacherNote}
                  </p>
                )}

                <DynamicFieldReadout
                  fields={diaryReadoutFields}
                  values={entry.customFields}
                  role={role}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
