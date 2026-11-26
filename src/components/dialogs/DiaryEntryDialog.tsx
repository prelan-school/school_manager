import { useEffect, useState, type FormEvent } from 'react';
import { createDiaryEntry, getFieldsForEntity } from '../../ecs/engine';
import type { Role, SchoolECSState } from '../../ecs/types';
import { AppDialog } from '../AppDialog';
import { DynamicFieldInputs } from '../DynamicFieldsRenderer';

interface DiaryEntryDialogProps {
  open: boolean;
  state: SchoolECSState;
  role: Role;
  activeTeacherId: string;
  initialLearnerId?: string;
  onClose: () => void;
  onStateChange: (next: SchoolECSState) => void;
}

export function DiaryEntryDialog({
  open,
  state,
  role,
  activeTeacherId,
  initialLearnerId,
  onClose,
  onStateChange,
}: DiaryEntryDialogProps) {
  const [selectedLearnerId, setSelectedLearnerId] = useState(
    initialLearnerId || state.learners[0]?.id || ''
  );
  const [date, setDate] = useState('2026-11-25');
  const [homeworkSummary, setHomeworkSummary] = useState('');
  const [teacherNote, setTeacherNote] = useState('');
  const [customValues, setCustomValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialLearnerId) {
      setSelectedLearnerId(initialLearnerId);
    }
  }, [initialLearnerId, open]);

  const diaryFields = getFieldsForEntity(state, 'diary_entry', role);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = createDiaryEntry(state, {
      learnerId: selectedLearnerId,
      teacherId: activeTeacherId,
      date,
      homeworkSummary,
      teacherNote,
      customFields: customValues,
      actorRole: role,
    });
    if (res.error) {
      setFormError(res.error);
      return;
    }
    setFormError(null);
    setHomeworkSummary('');
    setTeacherNote('');
    setCustomValues({});
    onStateChange(res.state);
    onClose();
  };

  return (
    <AppDialog
      open={open}
      title="Log Daily Diary Entry"
      subtitle="Core homework + dynamic ECS fields rendered from the Component Registry."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="dlg-diary-learner"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Learner
            </label>
            <select
              id="dlg-diary-learner"
              value={selectedLearnerId}
              onChange={(e) => setSelectedLearnerId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            >
              {state.learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.admissionNo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dlg-diary-date"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Date
            </label>
            <input
              id="dlg-diary-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="dlg-diary-homework"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Homework &amp; Tasks *
          </label>
          <textarea
            id="dlg-diary-homework"
            rows={2}
            value={homeworkSummary}
            onChange={(e) => setHomeworkSummary(e.target.value)}
            placeholder="Describe assigned homework or study tasks..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="dlg-diary-note"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Teacher Remark
          </label>
          <input
            id="dlg-diary-note"
            type="text"
            value={teacherNote}
            onChange={(e) => setTeacherNote(e.target.value)}
            placeholder="Classroom participation or reminders..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
          />
        </div>

        <DynamicFieldInputs
          fields={diaryFields}
          values={customValues}
          role={role}
          onChange={(key, value) =>
            setCustomValues((prev) => ({ ...prev, [key]: value }))
          }
        />

        {formError && (
          <p className="text-xs font-medium text-red-600">{formError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Publish Diary Entry
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
