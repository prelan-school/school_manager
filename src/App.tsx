/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ArchitecturePlanView } from './components/ArchitecturePlanView';
import { AssessmentEntryDialog } from './components/dialogs/AssessmentEntryDialog';
import { DiaryEntryDialog } from './components/dialogs/DiaryEntryDialog';
import { OfflineIndicator } from './components/PWAInstallButton';
import { SandboxWorkspace, type SandboxModule } from './components/SandboxWorkspace';
import { SpecsAndInspectorView } from './components/SpecsAndInspectorView';
import { TopBar, type MainSection } from './components/TopBar';
import { INITIAL_ECS_STATE } from './ecs/initialData';
import { buildFullPlanMarkdown } from './ecs/planData';
import type { Role, SchoolECSState } from './ecs/types';

const STORAGE_KEY = 'schola_ecs_state_v2';

function loadSavedState(): SchoolECSState {
  if (typeof window === 'undefined') {
    return INITIAL_ECS_STATE;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_ECS_STATE;
    }
    const parsed = JSON.parse(raw) as Partial<SchoolECSState>;
    if (
      parsed &&
      Array.isArray(parsed.learners) &&
      Array.isArray(parsed.pageWidgets) &&
      Array.isArray(parsed.dynamicFields) &&
      Array.isArray(parsed.diaryEntries)
    ) {
      return parsed as SchoolECSState;
    }
  } catch {
    // Ignore corrupted cache and fall back to deterministic initial data
  }
  return INITIAL_ECS_STATE;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<MainSection>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('section') === 'plan') {
        return 'plan';
      }
      if (params.get('section') === 'specs') {
        return 'specs';
      }
    }
    return 'sandbox';
  });

  const [ecsState, setEcsState] = useState<SchoolECSState>(loadSavedState);
  const [role, setRole] = useState<Role>('admin');
  const [activeModule, setActiveModule] = useState<SandboxModule>('learners');
  const [activeTeacherId, setActiveTeacherId] = useState<string>(
    INITIAL_ECS_STATE.teachers[0].id
  );
  const [activeLearnerId, setActiveLearnerId] = useState<string>(
    INITIAL_ECS_STATE.learners[0].id
  );
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [diaryDialog, setDiaryDialog] = useState<{
    open: boolean;
    learnerId?: string;
  }>({ open: false });
  const [assessmentDialog, setAssessmentDialog] = useState<{
    open: boolean;
    learnerId?: string;
  }>({ open: false });
  const [exportConfirmed, setExportConfirmed] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ecsState));
    } catch {
      // Ignore storage quota errors
    }
  }, [ecsState]);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    if (nextRole === 'parent' && selectedLearnerId) {
      setSelectedLearnerId(activeLearnerId);
    }
  };

  const handleLearnerScopeChange = (nextLearnerId: string) => {
    setActiveLearnerId(nextLearnerId);
    if (role === 'parent' && selectedLearnerId) {
      setSelectedLearnerId(nextLearnerId);
    }
  };

  const handleLaunchSandbox = (module: SandboxModule = 'learners') => {
    setSelectedLearnerId(null);
    setActiveModule(module);
    setActiveSection('sandbox');
  };

  const handleExportPlan = () => {
    const markdown = buildFullPlanMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schola-ecs-firebase-architecture-plan.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportConfirmed(true);
    setTimeout(() => setExportConfirmed(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onExportPlan={handleExportPlan}
        exportConfirmed={exportConfirmed}
      />

      {activeSection === 'plan' && (
        <ArchitecturePlanView
          onLaunchSandbox={handleLaunchSandbox}
          onViewSpecs={() => setActiveSection('specs')}
        />
      )}

      {activeSection === 'sandbox' && (
        <SandboxWorkspace
          state={ecsState}
          role={role}
          activeModule={activeModule}
          activeTeacherId={activeTeacherId}
          activeLearnerId={activeLearnerId}
          selectedLearnerId={selectedLearnerId}
          onRoleChange={handleRoleChange}
          onModuleChange={setActiveModule}
          onTeacherChange={setActiveTeacherId}
          onLearnerChange={handleLearnerScopeChange}
          onOpenLearnerPage={(lid) => setSelectedLearnerId(lid)}
          onCloseLearnerPage={() => setSelectedLearnerId(null)}
          onOpenDiaryDialog={(lid) =>
            setDiaryDialog({ open: true, learnerId: lid })
          }
          onOpenAssessmentDialog={(lid) =>
            setAssessmentDialog({ open: true, learnerId: lid })
          }
          onStateChange={setEcsState}
        />
      )}

      {activeSection === 'specs' && <SpecsAndInspectorView state={ecsState} />}

      <DiaryEntryDialog
        open={diaryDialog.open}
        state={ecsState}
        role={role}
        activeTeacherId={activeTeacherId}
        initialLearnerId={diaryDialog.learnerId}
        onClose={() => setDiaryDialog({ open: false })}
        onStateChange={setEcsState}
      />

      <AssessmentEntryDialog
        open={assessmentDialog.open}
        state={ecsState}
        role={role}
        activeTeacherId={activeTeacherId}
        initialLearnerId={assessmentDialog.learnerId}
        onClose={() => setAssessmentDialog({ open: false })}
        onStateChange={setEcsState}
      />

      <OfflineIndicator />
    </div>
  );
}
