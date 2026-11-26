import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  computeSubstrandCoverage,
  computeTeacherCoverageSummaries,
  movePageWidget,
  registerDynamicField,
  removeDynamicField,
  togglePageWidgetEnabled,
  togglePageWidgetRole,
} from '../../ecs/engine';
import type {
  DynamicFieldDefinition,
  DynamicFieldType,
  Role,
  SchoolECSState,
} from '../../ecs/types';
import { AppDialog } from '../AppDialog';

interface AdminCoverageModuleProps {
  state: SchoolECSState;
}

export function AdminCoverageModule({ state }: AdminCoverageModuleProps) {
  const substrandReports = computeSubstrandCoverage(state);
  const teacherSummaries = computeTeacherCoverageSummaries(state);

  const avgCoverage =
    substrandReports.length === 0
      ? 0
      : Math.round(
          substrandReports.reduce((s, r) => s + r.coveragePercent, 0) /
            substrandReports.length
        );

  const diarySignedCount = state.diaryEntries.filter(
    (d) => d.parentAcknowledged
  ).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Admin Syllabus Coverage &amp; Activity Tracker
        </h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Cross-entity rollup computed automatically from Schemes Substrands, Lesson Plans marked Taught, Assessment Books, and Diary entries.
        </p>
      </div>

      {/* 4-column summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Overall Syllabus Coverage</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {avgCoverage}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Registered Substrands</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {substrandReports.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Lesson Plans Taught</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {state.lessonPlans.filter((l) => l.status === 'taught').length} /{' '}
            {state.lessonPlans.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Parent Diary Sign-Offs</p>
          <p className="mt-1 font-mono text-2xl font-bold text-blue-700 tabular-nums">
            {diarySignedCount} / {state.diaryEntries.length}
          </p>
        </div>
      </div>

      {/* Teacher Delivery Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Teacher Syllabus Delivery &amp; Engagement
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Teacher</th>
                <th className="py-2.5 pr-4 text-right font-semibold">
                  Taught Plans
                </th>
                <th className="py-2.5 pr-4 text-right font-semibold">
                  In Progress
                </th>
                <th className="py-2.5 pr-4 text-right font-semibold">
                  Lessons Delivered
                </th>
                <th className="py-2.5 pr-4 text-right font-semibold">
                  Assessments
                </th>
                <th className="py-2.5 text-right font-semibold">
                  Diary Logs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherSummaries.map((row) => (
                <tr key={row.teacher.id} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-4 font-semibold text-slate-900">
                    {row.teacher.name}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-emerald-700 tabular-nums">
                    {row.taughtPlans} / {row.totalPlans}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-amber-700 tabular-nums">
                    {row.inProgressPlans}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-900 tabular-nums">
                    {row.totalLessonsDelivered}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-900 tabular-nums">
                    {row.assessmentsLogged}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-900 tabular-nums">
                    {row.diaryEntriesLogged}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Substrand Coverage Breakdown */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Coverage by Canonical Substrand
        </h3>
        <div className="mt-4 space-y-4">
          {substrandReports.map((rep) => (
            <div
              key={rep.substrand.id}
              className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">
                    {rep.subject?.name} · {rep.strand?.code} {rep.strand?.title}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {rep.substrand.code}: {rep.substrand.title}
                  </p>
                </div>
                <div className="text-right font-mono text-xs tabular-nums">
                  <span className="font-bold text-slate-900">
                    {rep.coveragePercent}%
                  </span>{' '}
                  <span className="text-slate-500">
                    ({rep.deliveredLessons}/{rep.targetLessons} lessons)
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all ${
                    rep.coveragePercent >= 75
                      ? 'bg-emerald-600'
                      : rep.coveragePercent > 0
                        ? 'bg-blue-700'
                        : 'bg-slate-300'
                  }`}
                  style={{ width: `${rep.coveragePercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface SchemaStudioModuleProps {
  state: SchoolECSState;
  onStateChange: (next: SchoolECSState) => void;
}

export function SchemaStudioModule({
  state,
  onStateChange,
}: SchemaStudioModuleProps) {
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [targetEntityType, setTargetEntityType] =
    useState<DynamicFieldDefinition['targetEntityType']>('diary_entry');
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<DynamicFieldType>('text');
  const [options, setOptions] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);
  const [visibleTo, setVisibleTo] = useState<Role[]>([
    'admin',
    'teacher',
    'parent',
  ]);
  const [error, setError] = useState<string | null>(null);

  const toggleRoleVisibility = (r: Role) => {
    setVisibleTo((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = registerDynamicField(state, {
      label,
      targetEntityType,
      fieldType,
      options:
        fieldType === 'select'
          ? options
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      required,
      visibleTo: visibleTo.includes('admin') ? visibleTo : ['admin', ...visibleTo],
      editableBy: ['admin', 'teacher'],
      description: description || 'Custom ECS component field',
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    setError(null);
    setLabel('');
    setOptions('');
    setDescription('');
    onStateChange(res.state);
    setShowRegisterDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            ECS Component &amp; Page Widget Studio
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Compose entity fields and loosely coupled page widgets at runtime. Changes immediately project across Admin, Teacher, and Parent portals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRegisterDialog(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Register Component Field
        </button>
      </div>

      <AppDialog
        open={showRegisterDialog}
        title="Register New Component Field"
        subtitle="Attach a new field schema to any Firestore entity collection with role visibility."
        onClose={() => setShowRegisterDialog(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="schema-target"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Target Entity Type
            </label>
            <select
              id="schema-target"
              value={targetEntityType}
              onChange={(e) =>
                setTargetEntityType(
                  e.target.value as DynamicFieldDefinition['targetEntityType']
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            >
              <option value="diary_entry">School Diary (diary_entry)</option>
              <option value="assessment_entry">
                Assessment Book (assessment_entry)
              </option>
              <option value="lesson_plan">Lesson Plan (lesson_plan)</option>
              <option value="attendance_record">
                Class Register (attendance_record)
              </option>
              <option value="scheme_substrand">
                Scheme Substrand (scheme_substrand)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="schema-label"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Field Label *
              </label>
              <input
                id="schema-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Lab Safety Score"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="schema-type"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Data Type
              </label>
              <select
                id="schema-type"
                value={fieldType}
                onChange={(e) =>
                  setFieldType(e.target.value as DynamicFieldType)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>

          {fieldType === 'select' && (
            <div>
              <label
                htmlFor="schema-options"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Options (comma-separated)
              </label>
              <input
                id="schema-options"
                type="text"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Option A, Option B, Option C"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="schema-desc"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Description
            </label>
            <input
              id="schema-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of this component field..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
            />
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <span className="block text-xs font-medium text-slate-700">
              Portal Visibility (RBAC)
            </span>
            <div className="flex flex-wrap gap-4 text-xs">
              {(['teacher', 'parent'] as Role[]).map((r) => (
                <label key={r} className="flex items-center gap-1.5 capitalize">
                  <input
                    type="checkbox"
                    checked={visibleTo.includes(r)}
                    onChange={() => toggleRoleVisibility(r)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700"
                  />
                  {r}
                </label>
              ))}
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                Required field
              </label>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRegisterDialog(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Register Component Schema
            </button>
          </div>
        </form>
      </AppDialog>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Registered Entity Component Fields ({state.dynamicFields.length})
          </h3>
          {state.dynamicFields.map((field) => (
            <div
              key={field.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-mono text-xs text-slate-500">
                  {field.targetEntityType}.{field.key} · {field.fieldType}
                </p>
                <h4 className="mt-0.5 text-sm font-semibold text-slate-900">
                  {field.label}
                </h4>
                <p className="mt-1 text-xs text-slate-600">{field.description}</p>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Visible to: {field.visibleTo.join(', ')}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove field ${field.label}`}
                onClick={() => onStateChange(removeDynamicField(state, field.id))}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-3 lg:col-span-6">
          <h3 className="text-sm font-semibold text-slate-900">
            Loosely Coupled Learner Page Widgets ({state.pageWidgets.length})
          </h3>
          {[...state.pageWidgets]
            .sort((a, b) => a.order - b.order)
            .map((widget, idx, arr) => (
              <div
                key={widget.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      id={`studio_w_${widget.id}`}
                      type="checkbox"
                      checked={widget.enabled}
                      onChange={() =>
                        onStateChange(togglePageWidgetEnabled(state, widget.id))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-700"
                    />
                    <label
                      htmlFor={`studio_w_${widget.id}`}
                      className="text-sm font-semibold text-slate-900"
                    >
                      {widget.title}
                    </label>
                  </div>
                  <p className="mt-0.5 pl-6 text-xs text-slate-600">
                    {widget.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={widget.allowedRoles.includes('teacher')}
                      onChange={() =>
                        onStateChange(
                          togglePageWidgetRole(state, widget.id, 'teacher')
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700"
                    />
                    Teacher
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={widget.allowedRoles.includes('parent')}
                      onChange={() =>
                        onStateChange(
                          togglePageWidgetRole(state, widget.id, 'parent')
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700"
                    />
                    Parent
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      aria-label={`Move ${widget.title} up in schema studio`}
                      onClick={() =>
                        onStateChange(movePageWidget(state, widget.id, 'up'))
                      }
                      className="rounded border border-slate-300 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      aria-label={`Move ${widget.title} down in schema studio`}
                      onClick={() =>
                        onStateChange(movePageWidget(state, widget.id, 'down'))
                      }
                      className="rounded border border-slate-300 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
