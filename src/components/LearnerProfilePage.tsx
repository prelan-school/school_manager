import { ArrowDown, ArrowLeft, ArrowUp, Plus, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  buildLearnerLongitudinalReport,
  getFieldsForEntity,
  getPageWidgetsForRole,
  movePageWidget,
  toggleDiaryAcknowledgment,
  togglePageWidgetEnabled,
  togglePageWidgetRole,
} from '../ecs/engine';
import type {
  LearnerTimeframe,
  PageWidgetId,
  Role,
  SchoolECSState,
  TimeframePreset,
} from '../ecs/types';
import { AppDialog } from './AppDialog';
import { DynamicFieldReadout } from './DynamicFieldsRenderer';

interface LearnerProfilePageProps {
  state: SchoolECSState;
  learnerId: string;
  role: Role;
  onBack: () => void;
  onStateChange: (next: SchoolECSState) => void;
  onOpenDiaryDialog: (learnerId: string) => void;
  onOpenAssessmentDialog: (learnerId: string) => void;
}

export function LearnerProfilePage({
  state,
  learnerId,
  role,
  onBack,
  onStateChange,
  onOpenDiaryDialog,
  onOpenAssessmentDialog,
}: LearnerProfilePageProps) {
  const [preset, setPreset] = useState<TimeframePreset>('since_registration');
  const [customFrom, setCustomFrom] = useState('2025-09-01');
  const [customTo, setCustomTo] = useState('2026-11-25');
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<
    'all' | 'diary' | 'assessment' | 'attendance'
  >('all');

  const timeframe: LearnerTimeframe = {
    preset,
    fromDate: customFrom,
    toDate: customTo,
  };

  const report = buildLearnerLongitudinalReport(state, learnerId, role, timeframe);
  const activeWidgets = getPageWidgetsForRole(state, 'learner_profile', role);

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">
          Learner record not found.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  const { learner, bounds } = report;
  const classroom = state.classrooms.find((c) => c.id === learner.classroomId);
  const diaryFields = getFieldsForEntity(state, 'diary_entry', role);
  const assessFields = getFieldsForEntity(state, 'assessment_entry', role);
  const registerFields = getFieldsForEntity(state, 'attendance_record', role);
  const showUniformCheck = registerFields.some(
    (f) => f.key === 'uniform_compliant'
  );

  const filteredTimeline =
    timelineFilter === 'all'
      ? report.timeline
      : report.timeline.filter((e) => e.category === timelineFilter);

  const canLog = role === 'admin' || role === 'teacher';

  const renderWidget = (widgetId: PageWidgetId) => {
    switch (widgetId) {
      case 'learner_overview':
        return (
          <section
            key={widgetId}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Registered Since</p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                {learner.registeredAt}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Status: {learner.enrollmentStatus}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Average Assessment</p>
              <p className="mt-1 font-mono text-2xl font-bold text-blue-700 tabular-nums">
                {report.averageScore !== null ? `${report.averageScore}%` : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {report.assessments.length} evaluations in range
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Attendance Rate</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                {report.attendanceRate !== null ? `${report.attendanceRate}%` : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {report.attendance.length} register logs in range
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Diary Awards &amp; Logs</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {report.awardsCount} / {report.diary.length}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Awards out of diary entries
              </p>
            </div>
          </section>
        );

      case 'learner_timeline':
        return (
          <section
            key={widgetId}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Unified Longitudinal Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  {bounds.from} to {bounds.to} · {filteredTimeline.length} events
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['all', 'assessment', 'diary', 'attendance'] as const).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTimelineFilter(f)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                        timelineFilter === f
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No learner records fall inside the selected date window.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {filteredTimeline.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {ev.date} · {ev.category.toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {ev.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">{ev.detail}</p>
                    </div>
                    <span className="font-mono text-xs font-medium text-slate-700 whitespace-nowrap shrink-0">
                      {ev.meta}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case 'learner_assessments':
        return (
          <section
            key={widgetId}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Assessment Book (Pulled from Schemes)
                </h3>
                <p className="text-xs text-slate-500">
                  {report.assessments.length} assessment records in range
                </p>
              </div>
              {canLog && (
                <button
                  type="button"
                  onClick={() => onOpenAssessmentDialog(learner.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Record Assessment
                </button>
              )}
            </div>

            {report.assessments.length === 0 ? (
              <p className="py-5 text-xs text-slate-500">
                No assessments logged in this time range.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {report.assessments.map((entry) => {
                  const subj = state.subjects.find((s) => s.id === entry.subjectId);
                  const strand = state.strands.find((s) => s.id === entry.strandId);
                  const sub = state.substrands.find(
                    (s) => s.id === entry.substrandId
                  );
                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-500">
                            {entry.date} · {subj?.name} · {strand?.code}{' '}
                            {strand?.title}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {sub?.code}: {sub?.title}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                          {entry.mastery} · {entry.scorePercent}%
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-700">
                        {entry.performanceComment}
                      </p>
                      <DynamicFieldReadout
                        fields={assessFields}
                        values={entry.customFields}
                        role={role}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );

      case 'learner_diary':
        return (
          <section
            key={widgetId}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  School Diary &amp; Dynamic Fields
                </h3>
                <p className="text-xs text-slate-500">
                  {report.diary.length} entries in range
                </p>
              </div>
              {canLog && (
                <button
                  type="button"
                  onClick={() => onOpenDiaryDialog(learner.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add Diary Entry
                </button>
              )}
            </div>

            {report.diary.length === 0 ? (
              <p className="py-5 text-xs text-slate-500">
                No diary entries in this time range.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {report.diary.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {entry.date}
                      </span>
                      {role === 'parent' ? (
                        <button
                          type="button"
                          onClick={() =>
                            onStateChange(
                              toggleDiaryAcknowledgment(state, entry.id)
                            )
                          }
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            entry.parentAcknowledged
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-700 text-white'
                          }`}
                        >
                          {entry.parentAcknowledged
                            ? 'Acknowledged'
                            : 'Acknowledge'}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-600">
                          {entry.parentAcknowledged
                            ? 'Parent Signed'
                            : 'Awaiting Sign-off'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">
                      {entry.homeworkSummary}
                    </p>
                    {entry.teacherNote && (
                      <p className="mt-1 text-xs text-slate-600">
                        {entry.teacherNote}
                      </p>
                    )}
                    <DynamicFieldReadout
                      fields={diaryFields}
                      values={entry.customFields}
                      role={role}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case 'learner_attendance':
        return (
          <section
            key={widgetId}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              Class Register History
            </h3>
            {report.attendance.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                No attendance logs in this time range.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4 font-semibold">Date</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      {showUniformCheck && (
                        <th className="py-2 pr-4 font-semibold">
                          Uniform (Staff Only)
                        </th>
                      )}
                      <th className="py-2 font-semibold">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.attendance.map((rec) => (
                      <tr key={rec.id}>
                        <td className="py-2.5 pr-4 font-mono text-slate-700 tabular-nums">
                          {rec.date}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold capitalize text-slate-900">
                          {rec.status}
                        </td>
                        {showUniformCheck && (
                          <td className="py-2.5 pr-4 text-slate-600">
                            {rec.customFields.uniform_compliant
                              ? 'Compliant'
                              : 'Needs Follow-up'}
                          </td>
                        )}
                        <td className="py-2.5 text-slate-600">
                          {rec.remark || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );

      case 'learner_timetable': {
        const slots = state.timetableSlots.filter(
          (s) => s.classroomId === learner.classroomId
        );
        return (
          <section
            key={widgetId}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              Class Schedule ({classroom?.name})
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {slots.map((slot) => {
                const subj = state.subjects.find((s) => s.id === slot.subjectId);
                const teacher = state.teachers.find(
                  (t) => t.id === slot.teacherId
                );
                return (
                  <div
                    key={slot.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                  >
                    <p className="font-mono text-slate-500 tabular-nums">
                      {slot.day} P{slot.period} · {slot.timeRange}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {subj?.name}
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      {teacher?.name} · {slot.room}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'learner_enrollment':
        return (
          <section
            key={widgetId}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              Registration, Guardian Audit &amp; Confidential Staff Notes
            </h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-slate-500">Guardian</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {learner.parentName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Guardian Contact</dt>
                <dd className="mt-0.5 font-mono text-slate-900">
                  {learner.guardianPhone} · {learner.parentEmail}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Enrollment Date</dt>
                <dd className="mt-0.5 font-mono text-slate-900 tabular-nums">
                  {learner.registeredAt} ({learner.enrollmentStatus})
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Internal Staff Health Note</dt>
                <dd className="mt-0.5 text-slate-800">
                  {learner.internalHealthNote}
                </dd>
              </div>
            </dl>
          </section>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Learner Context & Timeframe Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back
            </button>
            <div>
              <p className="text-xs text-slate-500">
                {learner.admissionNo} · {classroom?.name} · Registered{' '}
                {learner.registeredAt}
              </p>
              <h2 className="mt-0.5 font-display text-xl font-bold text-slate-900">
                {learner.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowLayoutDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Configure Page Widgets
              </button>
            )}
          </div>
        </div>

        {/* Timeframe filter */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Time Period
            </span>
            {(
              [
                { id: 'since_registration', label: 'Since Registration' },
                { id: 'this_term', label: 'This Term' },
                { id: 'last_30_days', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom Range' },
              ] as { id: TimeframePreset; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  preset === opt.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {preset === 'custom' ? (
            <div className="flex items-center gap-2 text-xs">
              <input
                aria-label="From date"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                aria-label="To date"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
              />
            </div>
          ) : (
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              Showing {bounds.from} &rarr; {bounds.to} · {activeWidgets.length} active
              widgets for {role}
            </span>
          )}
        </div>
      </div>

      {/* Composed Loosely Coupled Widgets */}
      <div className="space-y-5">
        {activeWidgets.map((w) => renderWidget(w.id))}
      </div>

      {/* Loosely Coupled Page Composition Dialog */}
      <AppDialog
        open={showLayoutDialog}
        title="Learner Page Widget Composition"
        subtitle="Enable, reorder, or align widgets to Teacher and Parent portals dynamically."
        onClose={() => setShowLayoutDialog(false)}
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-3">
          {[...state.pageWidgets]
            .sort((a, b) => a.order - b.order)
            .map((widget, idx, arr) => (
              <div
                key={widget.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      id={`w_toggle_${widget.id}`}
                      type="checkbox"
                      checked={widget.enabled}
                      onChange={() =>
                        onStateChange(togglePageWidgetEnabled(state, widget.id))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-700"
                    />
                    <label
                      htmlFor={`w_toggle_${widget.id}`}
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
                      aria-label={`Move ${widget.title} up`}
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
                      aria-label={`Move ${widget.title} down`}
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
        </div>
      </AppDialog>
    </div>
  );
}
