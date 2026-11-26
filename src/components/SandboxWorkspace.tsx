import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import type { Role, SchoolECSState } from '../ecs/types';
import { LearnerProfilePage } from './LearnerProfilePage';
import {
  AdminCoverageModule,
  SchemaStudioModule,
} from './modules/AdminCoverageAndSchemaModule';
import { AssessmentsModule } from './modules/AssessmentsModule';
import { DiaryModule } from './modules/DiaryModule';
import { LearnersDirectoryModule } from './modules/LearnersDirectoryModule';
import { LessonPlansModule } from './modules/LessonPlansModule';
import { SchemesModule } from './modules/SchemesModule';
import {
  ClassRegisterModule,
  TimetableModule,
} from './modules/TimetableAndRegisterModule';
import { PWAInstallButton } from './PWAInstallButton';

export type SandboxModule =
  | 'learners'
  | 'diary'
  | 'schemes'
  | 'assessments'
  | 'lessons'
  | 'timetable'
  | 'register'
  | 'coverage'
  | 'schema';

interface SandboxWorkspaceProps {
  state: SchoolECSState;
  role: Role;
  activeModule: SandboxModule;
  activeTeacherId: string;
  activeLearnerId: string;
  selectedLearnerId: string | null;
  onRoleChange: (role: Role) => void;
  onModuleChange: (module: SandboxModule) => void;
  onTeacherChange: (teacherId: string) => void;
  onLearnerChange: (learnerId: string) => void;
  onOpenLearnerPage: (learnerId: string) => void;
  onCloseLearnerPage: () => void;
  onOpenDiaryDialog: (learnerId?: string) => void;
  onOpenAssessmentDialog: (learnerId?: string) => void;
  onStateChange: (next: SchoolECSState) => void;
}

const MODULE_TABS: { id: SandboxModule; label: string; roles: Role[] }[] = [
  { id: 'learners', label: 'Learners', roles: ['admin', 'teacher', 'parent'] },
  { id: 'diary', label: 'School Diary', roles: ['admin', 'teacher', 'parent'] },
  { id: 'schemes', label: 'Schemes DB', roles: ['admin', 'teacher'] },
  {
    id: 'assessments',
    label: 'Assessment Books',
    roles: ['admin', 'teacher', 'parent'],
  },
  { id: 'lessons', label: 'Lesson Plans', roles: ['admin', 'teacher'] },
  { id: 'timetable', label: 'Timetable', roles: ['admin', 'teacher', 'parent'] },
  {
    id: 'register',
    label: 'Class Register',
    roles: ['admin', 'teacher', 'parent'],
  },
  { id: 'coverage', label: 'Admin Coverage', roles: ['admin'] },
  { id: 'schema', label: 'Schema Studio', roles: ['admin', 'teacher'] },
];

const MOBILE_NAV_ITEMS: {
  id: SandboxModule;
  label: string;
  Icon: typeof Users;
}[] = [
  { id: 'learners', label: 'Learners', Icon: Users },
  { id: 'diary', label: 'Diary', Icon: BookOpen },
  { id: 'assessments', label: 'Assess', Icon: FileSpreadsheet },
  { id: 'timetable', label: 'Schedule', Icon: Calendar },
  { id: 'register', label: 'Register', Icon: ClipboardCheck },
];

export function SandboxWorkspace({
  state,
  role,
  activeModule,
  activeTeacherId,
  activeLearnerId,
  selectedLearnerId,
  onRoleChange,
  onModuleChange,
  onTeacherChange,
  onLearnerChange,
  onOpenLearnerPage,
  onCloseLearnerPage,
  onOpenDiaryDialog,
  onOpenAssessmentDialog,
  onStateChange,
}: SandboxWorkspaceProps) {
  const availableTabs = MODULE_TABS.filter((t) => t.roles.includes(role));
  const resolvedModule = availableTabs.some((t) => t.id === activeModule)
    ? activeModule
    : availableTabs[0].id;

  const scopedSelectedLearnerId =
    selectedLearnerId && role === 'parent' ? activeLearnerId : selectedLearnerId;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 pb-24 sm:px-6 sm:py-6 md:pb-8">
      {/* Workspace Role & Persona Control Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Active Portal Role
            </span>
            <div
              role="group"
              aria-label="Portal role switcher"
              className="inline-flex rounded-lg bg-slate-100 p-1"
            >
              {(['admin', 'teacher', 'parent'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRoleChange(r)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0 ${
                    role === r
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'admin'
                    ? 'Admin Side'
                    : r === 'teacher'
                      ? 'Teacher Side'
                      : 'Parent Portal'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {role === 'teacher' && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="active-teacher-select"
                  className="text-xs font-medium text-slate-600"
                >
                  Signed-in Teacher
                </label>
                <select
                  id="active-teacher-select"
                  value={activeTeacherId}
                  onChange={(e) => onTeacherChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  {state.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === 'parent' && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="active-parent-select"
                  className="text-xs font-medium text-slate-600"
                >
                  Parent / Child Scope
                </label>
                <select
                  id="active-parent-select"
                  value={activeLearnerId}
                  onChange={(e) => onLearnerChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-none"
                >
                  {state.learners.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.parentName} (Child: {l.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === 'admin' && (
              <span className="text-xs text-slate-500">
                Full Access · All Teachers, Learners &amp; Widget Studio
              </span>
            )}

            <PWAInstallButton />
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <div
          role="tablist"
          aria-label="School software modules"
          className="mt-4 flex flex-nowrap gap-1.5 overflow-x-auto border-t border-slate-100 pt-3 pb-0.5 md:flex-wrap md:overflow-visible"
        >
          {availableTabs.map((tab) => {
            const isSelected = !scopedSelectedLearnerId && resolvedModule === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => {
                  onCloseLearnerPage();
                  onModuleChange(tab.id);
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Module or Loosely Coupled Learner Page Viewport */}
      <main className="mt-6">
        {scopedSelectedLearnerId ? (
          <LearnerProfilePage
            state={state}
            learnerId={scopedSelectedLearnerId}
            role={role}
            onBack={onCloseLearnerPage}
            onStateChange={onStateChange}
            onOpenDiaryDialog={(lid) => onOpenDiaryDialog(lid)}
            onOpenAssessmentDialog={(lid) => onOpenAssessmentDialog(lid)}
          />
        ) : (
          <>
            {resolvedModule === 'learners' && (
              <LearnersDirectoryModule
                state={state}
                role={role}
                activeLearnerId={activeLearnerId}
                onOpenLearnerPage={onOpenLearnerPage}
              />
            )}
            {resolvedModule === 'diary' && (
              <DiaryModule
                state={state}
                role={role}
                activeLearnerId={activeLearnerId}
                onStateChange={onStateChange}
                onOpenDiaryDialog={onOpenDiaryDialog}
                onOpenLearnerPage={onOpenLearnerPage}
              />
            )}
            {resolvedModule === 'schemes' && (
              <SchemesModule
                state={state}
                role={role}
                activeTeacherId={activeTeacherId}
                onStateChange={onStateChange}
              />
            )}
            {resolvedModule === 'assessments' && (
              <AssessmentsModule
                state={state}
                role={role}
                activeLearnerId={activeLearnerId}
                onOpenAssessmentDialog={onOpenAssessmentDialog}
                onOpenLearnerPage={onOpenLearnerPage}
              />
            )}
            {resolvedModule === 'lessons' && (
              <LessonPlansModule
                state={state}
                role={role}
                activeTeacherId={activeTeacherId}
                onStateChange={onStateChange}
              />
            )}
            {resolvedModule === 'timetable' && (
              <TimetableModule
                state={state}
                role={role}
                onStateChange={onStateChange}
              />
            )}
            {resolvedModule === 'register' && (
              <ClassRegisterModule
                state={state}
                role={role}
                activeTeacherId={activeTeacherId}
                activeLearnerId={activeLearnerId}
                onStateChange={onStateChange}
                onOpenLearnerPage={onOpenLearnerPage}
              />
            )}
            {resolvedModule === 'coverage' && (
              <AdminCoverageModule state={state} />
            )}
            {resolvedModule === 'schema' && (
              <SchemaStudioModule state={state} onStateChange={onStateChange} />
            )}
          </>
        )}
      </main>

      {/* Mobile PWA Bottom App Bar */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden"
      >
        <div className="grid grid-cols-5">
          {MOBILE_NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = !scopedSelectedLearnerId && resolvedModule === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onCloseLearnerPage();
                  onModuleChange(id);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                  active ? 'text-blue-700' : 'text-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
