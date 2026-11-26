import { useState, type FormEvent } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import {
  archiveDynamicField,
  computeSubstrandCoverage,
  computeTeacherCoverageSummaries,
  invitePortalUserAccount,
  movePageWidget,
  registerDynamicField,
  restoreDynamicField,
  togglePageWidgetEnabled,
  togglePageWidgetRole,
  updateDynamicField,
  updatePortalUserAccount,
} from '../../ecs/engine';
import type {
  DynamicFieldDefinition,
  DynamicFieldType,
  EntityType,
  PortalUserAccount,
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

const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'learner', label: 'Learner Profile (learner)' },
  { value: 'diary_entry', label: 'School Diary (diary_entry)' },
  { value: 'assessment_entry', label: 'Assessment Book (assessment_entry)' },
  { value: 'lesson_plan', label: 'Lesson Plan (lesson_plan)' },
  { value: 'attendance_record', label: 'Class Register (attendance_record)' },
  { value: 'scheme_strand', label: 'Scheme Strand (scheme_strand)' },
  { value: 'scheme_substrand', label: 'Scheme Substrand (scheme_substrand)' },
  { value: 'timetable_slot', label: 'Timetable Slot (timetable_slot)' },
];

interface SchemaStudioModuleProps {
  state: SchoolECSState;
  role: Role;
  onStateChange: (next: SchoolECSState) => void;
}

export function SchemaStudioModule({
  state,
  role,
  onStateChange,
}: SchemaStudioModuleProps) {
  const isAdmin = role === 'admin';
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [filterEntityType, setFilterEntityType] = useState<'all' | EntityType>('all');
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
  const [editableBy, setEditableBy] = useState<Role[]>(['admin', 'teacher']);
  const [error, setError] = useState<string | null>(null);
  const [showArchivedSchemas, setShowArchivedSchemas] = useState(false);

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<Role>('parent');
  const [userTeacherId, setUserTeacherId] = useState<string>(
    state.teachers[0]?.id ?? ''
  );
  const [userLinkedLearnerIds, setUserLinkedLearnerIds] = useState<string[]>(
    []
  );
  const [userError, setUserError] = useState<string | null>(null);

  const openCreateUserDialog = () => {
    setEditingUserId(null);
    setUserEmail('');
    setUserName('');
    setUserRole('parent');
    setUserTeacherId(state.teachers[0]?.id ?? '');
    setUserLinkedLearnerIds([]);
    setUserError(null);
    setShowUserDialog(true);
  };

  const openEditUserDialog = (account: PortalUserAccount) => {
    setEditingUserId(account.id);
    setUserEmail(account.email);
    setUserName(account.displayName);
    setUserRole(account.role);
    setUserTeacherId(account.teacherId ?? state.teachers[0]?.id ?? '');
    setUserLinkedLearnerIds([...account.linkedLearnerIds]);
    setUserError(null);
    setShowUserDialog(true);
  };

  const toggleLinkedLearner = (learnerId: string) => {
    setUserLinkedLearnerIds((prev) =>
      prev.includes(learnerId)
        ? prev.filter((id) => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  const handleSaveUser = (e: FormEvent) => {
    e.preventDefault();
    const res = editingUserId
      ? updatePortalUserAccount(state, editingUserId, {
          displayName: userName,
          role: userRole,
          teacherId: userRole === 'parent' ? undefined : userTeacherId,
          linkedLearnerIds: userLinkedLearnerIds,
        })
      : invitePortalUserAccount(state, {
          email: userEmail,
          displayName: userName,
          role: userRole,
          teacherId: userRole === 'parent' ? undefined : userTeacherId,
          linkedLearnerIds: userLinkedLearnerIds,
        });
    if (res.error) {
      setUserError(res.error);
      return;
    }
    setUserError(null);
    setShowUserDialog(false);
    setEditingUserId(null);
    onStateChange(res.state);
  };

  const openCreateDialog = () => {
    setEditingFieldId(null);
    setTargetEntityType('diary_entry');
    setLabel('');
    setFieldType('text');
    setOptions('');
    setDescription('');
    setRequired(false);
    setVisibleTo(['admin', 'teacher', 'parent']);
    setEditableBy(['admin', 'teacher']);
    setError(null);
    setShowFieldDialog(true);
  };

  const openEditDialog = (field: DynamicFieldDefinition) => {
    setEditingFieldId(field.id);
    setTargetEntityType(field.targetEntityType);
    setLabel(field.label);
    setFieldType(field.fieldType);
    setOptions((field.options ?? []).join(', '));
    setDescription(field.description);
    setRequired(Boolean(field.required));
    setVisibleTo(
      field.visibleTo.includes('admin')
        ? field.visibleTo
        : ['admin', ...field.visibleTo]
    );
    setEditableBy(
      field.editableBy.includes('admin')
        ? field.editableBy
        : ['admin', ...field.editableBy]
    );
    setError(null);
    setShowFieldDialog(true);
  };

  const toggleRoleVisibility = (r: Role) => {
    setVisibleTo((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  const toggleRoleEditable = (r: Role) => {
    setEditableBy((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedOptions =
      fieldType === 'select'
        ? options
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    if (fieldType === 'select' && (!parsedOptions || parsedOptions.length === 0)) {
      setError('Select fields require at least one comma-separated option.');
      return;
    }

    const nextVisible = visibleTo.includes('admin')
      ? visibleTo
      : (['admin', ...visibleTo] as Role[]);
    const nextEditable = editableBy.includes('admin')
      ? editableBy
      : (['admin', ...editableBy] as Role[]);

    const res = editingFieldId
      ? updateDynamicField(state, editingFieldId, {
          label,
          targetEntityType,
          fieldType,
          options: parsedOptions ?? [],
          required,
          visibleTo: nextVisible,
          editableBy: nextEditable,
          description: description.trim() || 'Custom ECS component field',
        })
      : registerDynamicField(state, {
          label,
          targetEntityType,
          fieldType,
          options: parsedOptions,
          required,
          visibleTo: nextVisible,
          editableBy: nextEditable,
          description: description.trim() || 'Custom ECS component field',
        });

    if (res.error) {
      setError(res.error);
      return;
    }
    setError(null);
    setShowFieldDialog(false);
    setEditingFieldId(null);
    onStateChange(res.state);
  };

  const visibleFields = (
    filterEntityType === 'all'
      ? state.dynamicFields
      : state.dynamicFields.filter((f) => f.targetEntityType === filterEntityType)
  ).filter((f) => (showArchivedSchemas ? Boolean(f.archived) : !f.archived));

  const archivedCount = state.dynamicFields.filter((f) => f.archived).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            ECS Component &amp; Page Widget Studio
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {isAdmin
              ? 'Full Admin CRUD over all entity component fields and loosely coupled page widgets across Admin, Teacher, and Parent portals.'
              : 'Read-only view of registered ECS component fields and page widgets. Switch to Admin Side to create, edit, or delete schemas.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateUserDialog}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Invite User / Link Guardian
            </button>
            <button
              type="button"
              onClick={openCreateDialog}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Register Component Field
            </button>
          </div>
        )}
      </div>

      {/* Admin Users & Guardian Linking Dialog */}
      <AppDialog
        open={showUserDialog}
        title={
          editingUserId
            ? 'Edit User Role & Guardian Links'
            : 'Invite Staff or Link Guardian'
        }
        subtitle="Manage /users/{uid} roles, teacherId bindings, and multi-child linkedLearnerIds."
        onClose={() => {
          setShowUserDialog(false);
          setEditingUserId(null);
        }}
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="usr-email"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Email *
              </label>
              <input
                id="usr-email"
                type="email"
                disabled={Boolean(editingUserId)}
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="guardian@family.org"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100 focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="usr-name"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Display Name *
              </label>
              <input
                id="usr-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="usr-role"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Portal Role
              </label>
              <select
                id="usr-role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as Role)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent / Guardian</option>
              </select>
            </div>
            {userRole !== 'parent' && (
              <div>
                <label
                  htmlFor="usr-teacher"
                  className="mb-1 block text-xs font-medium text-slate-700"
                >
                  Linked Teacher Record
                </label>
                <select
                  id="usr-teacher"
                  value={userTeacherId}
                  onChange={(e) => setUserTeacherId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {state.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-700">
              Linked Learners (Multi-Child Guardian Scope)
            </span>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              {state.learners.map((learner) => (
                <label
                  key={learner.id}
                  className="flex items-center gap-2 text-xs text-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={userLinkedLearnerIds.includes(learner.id)}
                    onChange={() => toggleLinkedLearner(learner.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700"
                  />
                  <span>
                    {learner.name}{' '}
                    <span className="font-mono text-[11px] text-slate-500">
                      ({learner.admissionNo})
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {userError && (
            <p className="text-xs font-medium text-red-600">{userError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowUserDialog(false);
                setEditingUserId(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              {editingUserId ? 'Save User & Links' : 'Create User Account'}
            </button>
          </div>
        </form>
      </AppDialog>

      <AppDialog
        open={showFieldDialog}
        title={
          editingFieldId
            ? 'Edit Component Field Schema'
            : 'Register New Component Field'
        }
        subtitle="Attach or update a field schema on any Firestore entity collection with role visibility and edit permissions."
        onClose={() => {
          setShowFieldDialog(false);
          setEditingFieldId(null);
        }}
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
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                Options (comma-separated) *
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

          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div>
              <span className="block text-xs font-medium text-slate-700">
                Portal Visibility (Admin Always Included)
              </span>
              <div className="mt-1.5 flex flex-wrap gap-4 text-xs">
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
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700">
                Editable By Role (Admin Always Included)
              </span>
              <div className="mt-1.5 flex flex-wrap gap-4 text-xs">
                {(['teacher', 'parent'] as Role[]).map((r) => (
                  <label key={r} className="flex items-center gap-1.5 capitalize">
                    <input
                      type="checkbox"
                      checked={editableBy.includes(r)}
                      onChange={() => toggleRoleEditable(r)}
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
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowFieldDialog(false);
                setEditingFieldId(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              {editingFieldId ? 'Save Field Changes' : 'Register Component Schema'}
            </button>
          </div>
        </form>
      </AppDialog>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {showArchivedSchemas ? 'Archived' : 'Active'} Entity Component Fields (
              {visibleFields.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowArchivedSchemas((v) => !v)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  showArchivedSchemas
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {showArchivedSchemas
                  ? 'Show Active'
                  : `Archived (${archivedCount})`}
              </button>
              <select
                aria-label="Filter component fields by entity type"
                value={filterEntityType}
                onChange={(e) =>
                  setFilterEntityType(e.target.value as 'all' | EntityType)
                }
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
              >
                <option value="all">All Entities</option>
                {ENTITY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visibleFields.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              {showArchivedSchemas
                ? 'No archived schemas. Archiving hides a field from new forms while preserving historical record labels.'
                : 'No active component fields match this filter.'}
            </div>
          ) : (
            visibleFields.map((field) => (
              <div
                key={field.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-slate-500">
                    {field.targetEntityType}.{field.key} · {field.fieldType}
                    {field.required ? ' · Required' : ''}
                    {field.archived ? ' · ARCHIVED' : ''}
                  </p>
                  <h4 className="mt-0.5 text-sm font-semibold text-slate-900">
                    {field.label}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600">{field.description}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Visible: {field.visibleTo.join(', ')} · Editable:{' '}
                    {field.editableBy.join(', ')}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Edit field ${field.label}`}
                      onClick={() => openEditDialog(field)}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {field.archived ? (
                      <button
                        type="button"
                        aria-label={`Restore field ${field.label}`}
                        title="Restore field"
                        onClick={() =>
                          onStateChange(restoreDynamicField(state, field.id))
                        }
                        className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Archive field ${field.label}`}
                        title="Safe archive (preserves historical labels)"
                        onClick={() =>
                          onStateChange(archiveDynamicField(state, field.id))
                        }
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Archive className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
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
                      disabled={!isAdmin}
                      checked={widget.enabled}
                      onChange={() =>
                        onStateChange(togglePageWidgetEnabled(state, widget.id))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-700 disabled:opacity-50"
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
                      disabled={!isAdmin}
                      checked={widget.allowedRoles.includes('teacher')}
                      onChange={() =>
                        onStateChange(
                          togglePageWidgetRole(state, widget.id, 'teacher')
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700 disabled:opacity-50"
                    />
                    Teacher
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={widget.allowedRoles.includes('parent')}
                      onChange={() =>
                        onStateChange(
                          togglePageWidgetRole(state, widget.id, 'parent')
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700 disabled:opacity-50"
                    />
                    Parent
                  </label>
                  {isAdmin && (
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
                  )}
                </div>
              </div>
            ))}
        </section>
      </div>

      {/* Admin Users & Guardian Linking Directory */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Admin Users &amp; Guardian Linking ({state.users.length})
            </h3>
            <p className="text-xs text-slate-500">
              Bind staff accounts to Teacher entities and Parent accounts to multiple Learners.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateUserDialog}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add User / Guardian
            </button>
          )}
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 font-semibold">User</th>
                <th className="py-2 pr-4 font-semibold">Role</th>
                <th className="py-2 pr-4 font-semibold">Teacher Binding</th>
                <th className="py-2 pr-4 font-semibold">Linked Learners</th>
                {isAdmin && (
                  <th className="py-2 text-right font-semibold">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.users.map((account) => {
                const teacher = state.teachers.find(
                  (t) => t.id === account.teacherId
                );
                const linkedNames = account.linkedLearnerIds
                  .map(
                    (id) => state.learners.find((l) => l.id === id)?.name ?? id
                  )
                  .join(', ');

                return (
                  <tr key={account.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-slate-900">
                        {account.displayName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        {account.email}
                      </p>
                    </td>
                    <td className="py-2.5 pr-4 capitalize font-semibold text-blue-700">
                      {account.role}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {teacher?.name ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">
                      {linkedNames || '—'}
                    </td>
                    {isAdmin && (
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEditUserDialog(account)}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit Links
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
