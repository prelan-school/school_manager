import { Download, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppDialog } from './AppDialog';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          Install App
        </button>

        <AppDialog
          open={showIOSGuide}
          title="Install ScholaECS on iPhone / iPad"
          subtitle="Add this web app to your home screen for full-screen standalone access."
          onClose={() => setShowIOSGuide(false)}
          maxWidthClass="max-w-sm"
        >
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>
              Tap the <strong className="font-semibold">Share</strong> button in
              your Safari toolbar.
            </li>
            <li>
              Scroll down and tap{' '}
              <strong className="font-semibold">Add to Home Screen</strong>.
            </li>
            <li>Tap Add to launch ScholaECS like a native app.</li>
          </ol>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </AppDialog>
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-sm md:bottom-4"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
      Offline Mode — Changes saved locally in PWA cache
    </div>
  );
}
