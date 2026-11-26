import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createAssessmentEntry, getFieldsForEntity } from '../../ecs/engine';
import type { MasteryLevel, Role, SchoolECSState } from '../../ecs/types';
import { AppDialog } from '../AppDialog';
import { DynamicFieldInputs } from '../DynamicFieldsRenderer';

interface AssessmentEntryDialogProps {
  open: boolean;
  state: SchoolECSState;
  role: Role;
  activeTeacherId: string;
  initialLearnerId?: string;
  onClose: () => void;
  onStateChange: (next: SchoolECSState) => void;
}

export function AssessmentEntryDialog({
  open,
  state,
  role,
  activeTeacherId,
  initialLearnerId,
  onClose,
  onStateChange,
}: AssessmentEntryDialogProps) {
  const [selectedLearnerId, setSelectedLearnerId] = useState(
    initialLearnerId || state.learners[0]?.id || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    state.subjects[0]?.id ?? ''
  );

  useEffect(() => {
    if (initialLearnerId) {
      setSelectedLearnerId(initialLearnerId);
    }
  }, [initialLearnerId, open]);

  const strandsForSubject = useMemo(
    () => state.strands.filter((s) => s.subjectId === selectedSubjectId),
    [state.strands, selectedSubjectId]
  );

  const [selectedStrandId, setSelectedStrandId] = useState(
    strandsForSubject[0]?.id ?? state.strands[0]?.id ?? ''
  );

  const activeStrandId = strandsForSubject.some((s) => s.id === selectedStrandId)
    ? selectedStrandId
    : (strandsForSubject[0]?.id ?? '');

  const substrandsForStrand = useMemo(
    () => state.substrands.filter((sub) => sub.strandId === activeStrandId),
    [state.substrands, activeStrandId]
  );

  const [selectedSubstrandId, setSelectedSubstrandId] = useState(
    substrandsForStrand[0]?.id ?? state.substrands[0]?.id ?? ''
  );

  const activeSubstrandId = substrandsForStrand.some(
    (sub) => sub.id === selectedSubstrandId
  )
    ? selectedSubstrandId
    : (substrandsForStrand[0]?.id ?? '');

  const [mastery, setMastery] = useState<MasteryLevel>('Meeting');
  const [scorePercent, setScorePercent] = useState(82);
  const [performanceComment, setPerformanceComment] = useState('');
  const [customValues, setCustomValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [error, setError] = useState<string | null>(null);

  const assessFields = getFieldsForEntity(state, 'assessment_entry', role);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = createAssessmentEntry(state, {
      learnerId: selectedLearnerId,
      substrandId: activeSubstrandId,
      teacherId: activeTeacherId,
      date: '2026-11-25',
      mastery,
      scorePercent,
      performanceComment,
      customFields: customValues,
      actorRole: role,
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    setError(null);
    setPerformanceComment('');
    setCustomValues({});
    onStateChange(res.state);
    onClose();
  };

  return (
    <AppDialog
      open={open}
      title="Record Learner Assessment"
      subtitle="Strands and Substrands are pulled directly from the Schemes Database."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="dlg-assess-learner"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Learner
          </label>
          <select
            id="dlg-assess-learner"
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

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700">
            Pulled from Schemes Database
          </p>
          <div>
            <label
              htmlFor="dlg-assess-subject"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Subject
            </label>
            <select
              id="dlg-assess-subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-700 focus:outline-none"
            >
              {state.subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dlg-assess-strand"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Strand (Linked)
            </label>
            <select
              id="dlg-assess-strand"
              value={activeStrandId}
              onChange={(e) => setSelectedStrandId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-700 focus:outline-none"
            >
              {strandsForSubject.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.code}: {st.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dlg-assess-substrand"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Substrand (Linked)
            </label>
            <select
              id="dlg-assess-substrand"
              value={activeSubstrandId}
              onChange={(e) => setSelectedSubstrandId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-blue-700 focus:outline-none"
            >
              {substrandsForStrand.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code}: {sub.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="dlg-assess-mastery"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Mastery Level
            </label>
            <select
              id="dlg-assess-mastery"
              value={mastery}
              onChange={(e) => setMastery(e.target.value as MasteryLevel)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            >
              <option value="Exceeding">Exceeding</option>
              <option value="Meeting">Meeting</option>
              <option value="Approaching">Approaching</option>
              <option value="Developing">Developing</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dlg-assess-score"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Score (%)
            </label>
            <input
              id="dlg-assess-score"
              type="number"
              min={0}
              max={100}
              value={scorePercent}
              onChange={(e) => setScorePercent(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums focus:border-blue-700 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="dlg-assess-comment"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Learner Performance Comment *
          </label>
          <textarea
            id="dlg-assess-comment"
            rows={3}
            value={performanceComment}
            onChange={(e) => setPerformanceComment(e.target.value)}
            placeholder="Specific observations on learner understanding and next steps..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
          />
        </div>

        <DynamicFieldInputs
          fields={assessFields}
          values={customValues}
          role={role}
          onChange={(key, value) =>
            setCustomValues((prev) => ({ ...prev, [key]: value }))
          }
        />

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

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
            disabled={!activeSubstrandId}
            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
          >
            Save Assessment Entry
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
