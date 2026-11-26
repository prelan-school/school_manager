import { ArrowRight } from 'lucide-react';
import { FLUTTER_ECS_CHAPTERS } from '../ecs/planData';
import type { SandboxModule } from './SandboxWorkspace';

interface ArchitecturePlanViewProps {
  onLaunchSandbox: (module?: SandboxModule) => void;
  onViewSpecs: () => void;
}

export function ArchitecturePlanView({
  onLaunchSandbox,
  onViewSpecs,
}: ArchitecturePlanViewProps) {
  return (
    <div id="top" className="mx-auto max-w-[1440px] px-6 py-8">
      {/* Hero section */}
      <section className="rounded-xl border border-slate-200 bg-white p-8">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="flex flex-col justify-between lg:col-span-8">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Flutter System Architecture · Entity-Component-System Blueprint · Multi-Portal RBAC
              </p>
              <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight text-slate-900 text-balance sm:text-4xl">
                Loosely Coupled ECS Architecture for School Operations
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                A complete engineering plan for building a Flutter platform serving{' '}
                <strong className="font-semibold text-slate-900">Admin</strong>,{' '}
                <strong className="font-semibold text-slate-900">Teachers</strong>, and{' '}
                <strong className="font-semibold text-slate-900">Parents</strong>. Curriculum
                Strands and Substrands are authored once in Schemes, pulled directly into
                Assessment Books and Lesson Plans, and extended at runtime with dynamic
                components such as Diary Awards without schema migrations.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onLaunchSandbox('diary')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                Open Live ECS Sandbox
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onViewSpecs}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                Inspect Firebase &amp; Dart Specs
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-5 lg:col-span-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Architectural Guarantees
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                <dt className="text-slate-600">Role Portals</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                  Admin · Teacher · Parent
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                <dt className="text-slate-600">Core Modules</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                  6 Coupled Entities
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                <dt className="text-slate-600">Curriculum Source</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                  Single Schemes Tree
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-600">Field Extensibility</dt>
                <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                  Runtime ECS Registry
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 4-Column Quick Jump Strip */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onLaunchSandbox('diary')}
          className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-700"
        >
          <span className="text-xs font-medium text-slate-500">Dynamic Coupling</span>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900">
            School Diary + Custom Fields
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Add fields like Awards or Reading Minutes at runtime and preview Teacher &amp; Parent views.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onLaunchSandbox('schemes')}
          className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-700"
        >
          <span className="text-xs font-medium text-slate-500">Canonical Curriculum</span>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900">
            Schemes Strand &rarr; Substrand
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Register Strands and Substrands once; pull them directly into Assessments &amp; Lessons.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onLaunchSandbox('assessments')}
          className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-700"
        >
          <span className="text-xs font-medium text-slate-500">Zero Duplication</span>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900">
            Assessment Books
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Teachers select pulled Substrands and focus purely on learner performance commentary.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onLaunchSandbox('coverage')}
          className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-700"
        >
          <span className="text-xs font-medium text-slate-500">Admin Oversight</span>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900">
            Syllabus Coverage Rollup
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Track exactly what each teacher has taught against Scheme target lessons in real time.
          </p>
        </button>
      </section>

      {/* Main Blueprint Chapters */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500">
              Plan Chapters
            </h2>
            <nav aria-label="Architecture chapters" className="mt-3 space-y-1">
              {FLUTTER_ECS_CHAPTERS.map((ch) => (
                <a
                  key={ch.id}
                  href={`#${ch.id}`}
                  className="flex items-baseline gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
                >
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {ch.number}
                  </span>
                  <span className="font-medium">{ch.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-8 lg:col-span-9">
          {FLUTTER_ECS_CHAPTERS.map((chapter) => (
            <article
              key={chapter.id}
              id={chapter.id}
              className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-7"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-medium text-blue-700 tabular-nums">
                    Chapter {chapter.number}
                  </span>
                  <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
                    {chapter.number}. {chapter.title}
                  </h2>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
                {chapter.summary}
              </p>

              {chapter.diagram && (
                <pre className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
                  {chapter.diagram}
                </pre>
              )}

              {chapter.table && (
                <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        {chapter.table.headers.map((h) => (
                          <th key={h} className="px-4 py-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {chapter.table.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-4 py-3 align-top ${
                                cIdx === 0
                                  ? 'font-semibold text-slate-900 whitespace-nowrap'
                                  : 'text-slate-600'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {chapter.highlights.map((item) => (
                  <div
                    key={item.heading}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">
                      {item.heading}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
