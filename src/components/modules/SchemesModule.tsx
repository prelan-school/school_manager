import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  getFieldsForEntity,
  registerSchemeStrand,
  registerSchemeSubstrand,
} from '../../ecs/engine';
import type { Role, SchoolECSState } from '../../ecs/types';
import { AppDialog } from '../AppDialog';
import { DynamicFieldInputs } from '../DynamicFieldsRenderer';

interface SchemesModuleProps {
  state: SchoolECSState;
  role: Role;
  activeTeacherId: string;
  onStateChange: (next: SchoolECSState) => void;
}

export function SchemesModule({
  state,
  role,
  activeTeacherId,
  onStateChange,
}: SchemesModuleProps) {
  const [showStrandDialog, setShowStrandDialog] = useState(false);
  const [showSubstrandDialog, setShowSubstrandDialog] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState(
    state.subjects[0]?.id ?? ''
  );
  const [strandCode, setStrandCode] = useState('');
  const [strandTitle, setStrandTitle] = useState('');
  const [strandTerm, setStrandTerm] = useState('Term 1');
  const [strandError, setStrandError] = useState<string | null>(null);

  const [targetStrandId, setTargetStrandId] = useState(
    state.strands[0]?.id ?? ''
  );
  const [subCode, setSubCode] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [subOutcome, setSubOutcome] = useState('');
  const [targetLessons, setTargetLessons] = useState(4);
  const [subCustomFields, setSubCustomFields] = useState<
    Record<string, string | number | boolean>
  >({});
  const [subError, setSubError] = useState<string | null>(null);

  const canEdit = role === 'admin' || role === 'teacher';
  const substrandFields = getFieldsForEntity(state, 'scheme_substrand', role);

  const handleCreateStrand = (e: FormEvent) => {
    e.preventDefault();
    const res = registerSchemeStrand(state, {
      subjectId: selectedSubjectId,
      code: strandCode,
      title: strandTitle,
      term: strandTerm,
      createdByTeacherId: activeTeacherId,
    });
    if (res.error) {
      setStrandError(res.error);
      return;
    }
    setStrandError(null);
    setStrandCode('');
    setStrandTitle('');
    if (res.strand) {
      setTargetStrandId(res.strand.id);
    }
    onStateChange(res.state);
    setShowStrandDialog(false);
  };

  const handleCreateSubstrand = (e: FormEvent) => {
    e.preventDefault();
    const res = registerSchemeSubstrand(state, {
      strandId: targetStrandId,
      code: subCode,
      title: subTitle,
      learningOutcome: subOutcome,
      targetLessons,
      customFields: subCustomFields,
    });
    if (res.error) {
      setSubError(res.error);
      return;
    }
    setSubError(null);
    setSubCode('');
    setSubTitle('');
    setSubOutcome('');
    setTargetLessons(4);
    setSubCustomFields({});
    onStateChange(res.state);
    setShowSubstrandDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Schemes of Work Database
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Canonical curriculum repository. Register Strands and Substrands once here—Assessment Books and Lesson Plans automatically pull them by Entity reference.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStrandDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Register Strand
            </button>
            <button
              type="button"
              onClick={() => setShowSubstrandDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Substrand
            </button>
          </div>
        )}
      </div>

      {/* Register Strand Dialog */}
      <AppDialog
        open={showStrandDialog}
        title="Register Curriculum Strand"
        subtitle="Strands group related substrands and are shared across Assessment Books and Lesson Plans."
        onClose={() => setShowStrandDialog(false)}
      >
        <form onSubmit={handleCreateStrand} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="scheme-subject"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Subject
              </label>
              <select
                id="scheme-subject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
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
                htmlFor="strand-code"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Strand Code *
              </label>
              <input
                id="strand-code"
                type="text"
                value={strandCode}
                onChange={(e) => setStrandCode(e.target.value)}
                placeholder="STR-M3"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="strand-term"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Term
              </label>
              <select
                id="strand-term"
                value={strandTerm}
                onChange={(e) => setStrandTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="strand-title"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Strand Title *
            </label>
            <input
              id="strand-title"
              type="text"
              value={strandTitle}
              onChange={(e) => setStrandTitle(e.target.value)}
              placeholder="e.g. Geometry & Polyhedra"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          {strandError && (
            <p className="text-xs font-medium text-red-600">{strandError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowStrandDialog(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Register Strand
            </button>
          </div>
        </form>
      </AppDialog>

      {/* Add Substrand Dialog */}
      <AppDialog
        open={showSubstrandDialog}
        title="Add Substrand Under Strand"
        subtitle="Assessment Books and Lesson Plans pull this Substrand directly without duplicating text."
        onClose={() => setShowSubstrandDialog(false)}
      >
        <form onSubmit={handleCreateSubstrand} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="parent-strand"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Parent Strand
              </label>
              <select
                id="parent-strand"
                value={targetStrandId}
                onChange={(e) => setTargetStrandId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                {state.strands.map((st) => {
                  const subj = state.subjects.find((s) => s.id === st.subjectId);
                  return (
                    <option key={st.id} value={st.id}>
                      {subj?.code} · {st.code} — {st.title}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label
                htmlFor="sub-code"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Substrand Code *
              </label>
              <input
                id="sub-code"
                type="text"
                value={subCode}
                onChange={(e) => setSubCode(e.target.value)}
                placeholder="3.1"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-3">
              <label
                htmlFor="sub-title"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Substrand Title *
              </label>
              <input
                id="sub-title"
                type="text"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="e.g. 3D Solid Nets"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="sub-lessons"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Target Lessons
              </label>
              <input
                id="sub-lessons"
                type="number"
                min={1}
                max={30}
                value={targetLessons}
                onChange={(e) => setTargetLessons(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sub-outcome"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Learning Outcome
            </label>
            <input
              id="sub-outcome"
              type="text"
              value={subOutcome}
              onChange={(e) => setSubOutcome(e.target.value)}
              placeholder="Measurable competency learners demonstrate..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <DynamicFieldInputs
            fields={substrandFields}
            values={subCustomFields}
            role={role}
            onChange={(key, value) =>
              setSubCustomFields((prev) => ({ ...prev, [key]: value }))
            }
          />

          {subError && (
            <p className="text-xs font-medium text-red-600">{subError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSubstrandDialog(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Add Substrand to Scheme
            </button>
          </div>
        </form>
      </AppDialog>

      {/* Canonical Strands & Substrands Tree */}
      <div className="space-y-4">
        {state.strands.map((strand) => {
          const subject = state.subjects.find((s) => s.id === strand.subjectId);
          const childSubstrands = state.substrands.filter(
            (sub) => sub.strandId === strand.id
          );

          return (
            <section
              key={strand.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {subject?.name} ({subject?.code}) · {strand.term} ·{' '}
                    <span className="font-mono">{strand.id}</span>
                  </p>
                  <h3 className="mt-1 font-display text-base font-bold text-slate-900">
                    {strand.code}: {strand.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-600 tabular-nums">
                    {childSubstrands.length} substrands
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetStrandId(strand.id);
                        setShowSubstrandDialog(true);
                      }}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      + Add Substrand
                    </button>
                  )}
                </div>
              </div>

              {childSubstrands.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                  No substrands registered under this strand yet.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-4 font-semibold">Code</th>
                        <th className="py-2 pr-4 font-semibold">Substrand</th>
                        <th className="py-2 pr-4 font-semibold">
                          Learning Outcome
                        </th>
                        <th className="py-2 pr-4 text-right font-semibold">
                          Target Lessons
                        </th>
                        <th className="py-2 pr-4 text-right font-semibold">
                          Linked Plans
                        </th>
                        <th className="py-2 text-right font-semibold">
                          Linked Assessments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {childSubstrands.map((sub) => {
                        const planCount = state.lessonPlans.filter(
                          (lp) => lp.substrandId === sub.id
                        ).length;
                        const assessCount = state.assessments.filter(
                          (a) => a.substrandId === sub.id
                        ).length;
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 pr-4 font-mono text-slate-700 tabular-nums">
                              {sub.code}
                            </td>
                            <td className="py-2.5 pr-4 font-semibold text-slate-900">
                              {sub.title}
                            </td>
                            <td className="py-2.5 pr-4 text-slate-600">
                              {sub.learningOutcome || '—'}
                            </td>
                            <td className="py-2.5 pr-4 text-right font-mono text-slate-800 tabular-nums">
                              {sub.targetLessons}
                            </td>
                            <td className="py-2.5 pr-4 text-right font-mono text-blue-700 tabular-nums">
                              {planCount}
                            </td>
                            <td className="py-2.5 text-right font-mono text-emerald-700 tabular-nums">
                              {assessCount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
