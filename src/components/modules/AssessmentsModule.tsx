import { Plus } from 'lucide-react';
import { getFieldsForEntity } from '../../ecs/engine';
import type { Role, SchoolECSState } from '../../ecs/types';
import { DynamicFieldReadout } from '../DynamicFieldsRenderer';

interface AssessmentsModuleProps {
  state: SchoolECSState;
  role: Role;
  activeLearnerId: string;
  onOpenAssessmentDialog: (learnerId?: string) => void;
  onOpenLearnerPage: (learnerId: string) => void;
}

export function AssessmentsModule({
  state,
  role,
  activeLearnerId,
  onOpenAssessmentDialog,
  onOpenLearnerPage,
}: AssessmentsModuleProps) {
  const assessFields = getFieldsForEntity(state, 'assessment_entry', role);

  const visibleAssessments =
    role === 'parent'
      ? state.assessments.filter((a) => a.learnerId === activeLearnerId)
      : state.assessments;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Assessment Books
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Strands and Substrands are pulled directly from Schemes DB. Click any learner to open their longitudinal page.
          </p>
        </div>

        {(role === 'admin' || role === 'teacher') && (
          <button
            type="button"
            onClick={() => onOpenAssessmentDialog()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Record Assessment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleAssessments.map((entry) => {
          const learner = state.learners.find((l) => l.id === entry.learnerId);
          const subject = state.subjects.find((s) => s.id === entry.subjectId);
          const strand = state.strands.find((st) => st.id === entry.strandId);
          const substrand = state.substrands.find(
            (sub) => sub.id === entry.substrandId
          );
          const teacher = state.teachers.find((t) => t.id === entry.teacherId);

          const masteryTone =
            entry.mastery === 'Exceeding' || entry.mastery === 'Meeting'
              ? 'text-emerald-700'
              : entry.mastery === 'Approaching'
                ? 'text-amber-700'
                : 'text-red-700';

          return (
            <article
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {entry.date} · {subject?.name} · {strand?.code} {strand?.title}
                  </p>
                  <h3 className="mt-1 font-display text-base font-bold text-slate-900">
                    <button
                      type="button"
                      onClick={() => learner && onOpenLearnerPage(learner.id)}
                      className="text-left hover:text-blue-700 hover:underline"
                    >
                      {learner?.name}
                    </button>
                    {' — '}
                    <span className="font-semibold text-slate-700">
                      {substrand?.code} {substrand?.title}
                    </span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold ${masteryTone}`}>
                    {entry.mastery}
                  </span>
                  <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    {entry.scorePercent}%
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {entry.performanceComment}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Assessed by {teacher?.name} · Pulled ref:{' '}
                <span className="font-mono">{entry.substrandId}</span>
              </p>

              <DynamicFieldReadout
                fields={assessFields}
                values={entry.customFields}
                role={role}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
