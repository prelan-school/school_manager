import { useMemo, useState } from 'react';
import { Check, Copy, Download, FolderCode } from 'lucide-react';
import { getEntityGraphSnapshot } from '../ecs/engine';
import {
  DART_ECS_SNIPPET,
  FIRESTORE_COLLECTIONS_AND_RULES,
} from '../ecs/planData';
import type { EntityType, SchoolECSState } from '../ecs/types';
import { buildZipArchive } from '../utils/zipExport';

const FLUTTER_RAW_MODULES = import.meta.glob('/flutter_app/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface SpecsAndInspectorViewProps {
  state: SchoolECSState;
}

const ENTITY_TYPES: { id: EntityType; label: string }[] = [
  { id: 'diary_entry', label: 'Diary Entries' },
  { id: 'scheme_strand', label: 'Scheme Strands' },
  { id: 'scheme_substrand', label: 'Scheme Substrands' },
  { id: 'assessment_entry', label: 'Assessment Entries' },
  { id: 'lesson_plan', label: 'Lesson Plans' },
  { id: 'timetable_slot', label: 'Timetable Slots' },
  { id: 'attendance_record', label: 'Class Register' },
];

export function SpecsAndInspectorView({ state }: SpecsAndInspectorViewProps) {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('diary_entry');
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);
  const [zipDownloaded, setZipDownloaded] = useState(false);

  const flutterFiles = useMemo(() => {
    return Object.entries(FLUTTER_RAW_MODULES)
      .map(([fullPath, content]) => ({
        path: fullPath.replace(/^\/+/, ''),
        content,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }, []);

  const [selectedFlutterPath, setSelectedFlutterPath] = useState<string>(
    () =>
      flutterFiles.find((f) => f.path.endsWith('lib/main.dart'))?.path ??
      flutterFiles[0]?.path ??
      ''
  );

  const activeFlutterFile =
    flutterFiles.find((f) => f.path === selectedFlutterPath) ?? flutterFiles[0];

  const records = getEntityGraphSnapshot(state, selectedEntity);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(id);
      setTimeout(() => setCopiedTarget(null), 2000);
    } catch {
      // Fallback ignored in restricted frames
    }
  };

  const handleDownloadFlutterZip = () => {
    const zipBytes = buildZipArchive(flutterFiles);
    const blob = new Blob([zipBytes as unknown as BlobPart], {
      type: 'application/zip',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schola-ecs-flutter-web-firebase.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setZipDownloaded(true);
    setTimeout(() => setZipDownloaded(false), 2500);
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      {/* Flutter Web + Firebase Full Project Exporter */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FolderCode className="h-5 w-5 text-blue-700" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-slate-900">
                Flutter Web &amp; Firebase Project ({flutterFiles.length} Files)
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Complete Clean Architecture Flutter codebase (Auth, Learners Longitudinal Page, School Diary, Schemes DB, Assessments, Lesson Plans, Timetable, Class Register, Admin Coverage, Schema Studio, Firestore Rules &amp; Firebase Hosting config).
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadFlutterZip}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {zipDownloaded
              ? 'Downloaded Flutter ZIP'
              : 'Download Flutter Project (.zip)'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="max-h-[460px] space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 lg:col-span-4">
            {flutterFiles.map((file) => {
              const active = activeFlutterFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFlutterPath(file.path)}
                  className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left font-mono text-xs transition-colors ${
                    active
                      ? 'bg-blue-700 font-semibold text-white'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {file.path.replace(/^flutter_app\//, '')}
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs font-semibold text-slate-700">
                {activeFlutterFile?.path}
              </h2>
              {activeFlutterFile && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('flutter-file', activeFlutterFile.content)
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  {copiedTarget === 'flutter-file' ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copiedTarget === 'flutter-file' ? 'Copied File' : 'Copy File'}
                </button>
              )}
            </div>
            <pre className="mt-2 max-h-[436px] overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
              {activeFlutterFile?.content ?? 'No Flutter files bundled.'}
            </pre>
          </div>
        </div>
      </section>

      {/* Live ECS Entity & Component Store Inspector */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Live ECS Entity &amp; Component Store Inspector
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Inspect how Firestore document entities, custom dynamic components, and foreign document ID references behave in real time as you edit the Sandbox.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {state.dynamicFields.length} dynamic field definitions active
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {ENTITY_TYPES.map((et) => (
            <button
              key={et.id}
              type="button"
              onClick={() => setSelectedEntity(et.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedEntity === et.id
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold text-slate-700">
              Registered Dynamic Component Schemas
            </h3>
            <pre className="mt-2 max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100">
              {JSON.stringify(state.dynamicFields, null, 2)}
            </pre>
          </div>
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700">
                Entities ({selectedEntity}) — {records.length} documents
              </h3>
              <button
                type="button"
                onClick={() => handleCopy('json', JSON.stringify(records, null, 2))}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                {copiedTarget === 'json' ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copiedTarget === 'json' ? 'Copied JSON' : 'Copy JSON'}
              </button>
            </div>
            <pre className="mt-2 max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100">
              {JSON.stringify(records, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Dart / Flutter Firestore &amp; Riverpod Models
            </h2>
            <button
              type="button"
              onClick={() => handleCopy('dart', DART_ECS_SNIPPET)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copiedTarget === 'dart' ? (
                <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copiedTarget === 'dart' ? 'Copied' : 'Copy Dart'}
            </button>
          </div>
          <pre className="mt-4 max-h-[460px] overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
            {DART_ECS_SNIPPET}
          </pre>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Cloud Firestore Security Rules
            </h2>
            <button
              type="button"
              onClick={() =>
                handleCopy('rules', FIRESTORE_COLLECTIONS_AND_RULES)
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copiedTarget === 'rules' ? (
                <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copiedTarget === 'rules' ? 'Copied' : 'Copy Rules'}
            </button>
          </div>
          <pre className="mt-4 max-h-[460px] overflow-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
            {FIRESTORE_COLLECTIONS_AND_RULES}
          </pre>
        </section>
      </div>
    </div>
  );
}
