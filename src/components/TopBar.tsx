import { Download } from 'lucide-react';

export type MainSection = 'plan' | 'sandbox' | 'specs';

interface TopBarProps {
  activeSection: MainSection;
  onNavigate: (section: MainSection) => void;
  onExportPlan: () => void;
  exportConfirmed: boolean;
}

export function TopBar({
  activeSection,
  onNavigate,
  onExportPlan,
  exportConfirmed,
}: TopBarProps) {
  const navItems: { id: MainSection; label: string; shortLabel: string }[] = [
    { id: 'sandbox', label: 'School Web App', shortLabel: 'App' },
    { id: 'plan', label: 'Architecture Plan', shortLabel: 'Plan' },
    { id: 'specs', label: 'Firebase & Dart', shortLabel: 'Specs' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-3.5">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('sandbox');
          }}
          className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 sm:text-lg"
        >
          ScholaECS
        </a>

        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-4 sm:gap-6"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 sm:text-sm ${
                  isActive
                    ? 'text-blue-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-blue-700 sm:-bottom-[15px]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            aria-label="Export architecture plan"
            onClick={onExportPlan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:gap-2 sm:px-4 sm:py-2"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sm:hidden">
              {exportConfirmed ? 'Saved' : 'Export'}
            </span>
            <span className="hidden sm:inline">
              {exportConfirmed ? 'Plan Downloaded' : 'Export Plan'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
