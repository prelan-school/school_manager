import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { buildLearnerLongitudinalReport } from '../../ecs/engine';
import type { Role, SchoolECSState } from '../../ecs/types';

interface LearnersDirectoryModuleProps {
  state: SchoolECSState;
  role: Role;
  activeLearnerId: string;
  onOpenLearnerPage: (learnerId: string) => void;
}

export function LearnersDirectoryModule({
  state,
  role,
  activeLearnerId,
  onOpenLearnerPage,
}: LearnersDirectoryModuleProps) {
  const [search, setSearch] = useState('');
  const [classroomFilter, setClassroomFilter] = useState('all');

  const scopedLearners =
    role === 'parent'
      ? state.learners.filter((l) => l.id === activeLearnerId)
      : state.learners.filter((l) => {
          const matchesClass =
            classroomFilter === 'all' || l.classroomId === classroomFilter;
          const q = search.trim().toLowerCase();
          const matchesSearch =
            !q ||
            l.name.toLowerCase().includes(q) ||
            l.admissionNo.toLowerCase().includes(q);
          return matchesClass && matchesSearch;
        });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Learners
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Select any learner to open their loosely coupled longitudinal profile (since registration until now), aligned to your {role} role.
          </p>
        </div>

        {role !== 'parent' && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <input
              aria-label="Search learners"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or admission no..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none sm:w-64"
            />
            <select
              aria-label="Filter learners by classroom"
              value={classroomFilter}
              onChange={(e) => setClassroomFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none sm:w-auto"
            >
              <option value="all">All Classrooms</option>
              {state.classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {scopedLearners.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No learners match your search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {scopedLearners.map((learner) => {
            const classroom = state.classrooms.find(
              (c) => c.id === learner.classroomId
            );
            const summary = buildLearnerLongitudinalReport(
              state,
              learner.id,
              role,
              { preset: 'since_registration' }
            );

            return (
              <article
                key={learner.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {learner.admissionNo} · {classroom?.name} · Registered{' '}
                        {learner.registeredAt}
                      </p>
                      <h3 className="mt-1 font-display text-base font-bold text-slate-900">
                        {learner.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-medium text-emerald-700">
                      {learner.enrollmentStatus}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Avg Mastery</dt>
                      <dd className="mt-0.5 font-mono font-bold text-slate-900 tabular-nums">
                        {summary?.averageScore !== null
                          ? `${summary?.averageScore}%`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Attendance</dt>
                      <dd className="mt-0.5 font-mono font-bold text-slate-900 tabular-nums">
                        {summary?.attendanceRate !== null
                          ? `${summary?.attendanceRate}%`
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Diary Logs</dt>
                      <dd className="mt-0.5 font-mono font-bold text-slate-900 tabular-nums">
                        {summary?.diary.length ?? 0}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">
                    Guardian: {learner.parentName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenLearnerPage(learner.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
                  >
                    Open Learner Page
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
