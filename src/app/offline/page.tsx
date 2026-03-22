"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* CSS-only animated wifi icon */}
        <div className="mx-auto w-24 h-24 relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full border-4 border-blue-400/60 dark:border-blue-500/60"
              style={{
                animation: "offline-pulse 2s ease-out infinite",
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full border-4 border-blue-300/40 dark:border-blue-600/40"
              style={{
                animation: "offline-pulse 2s ease-out infinite 0.4s",
              }}
            />
          </div>
          {/* Diagonal slash */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-[2px] h-20 bg-red-500 dark:bg-red-400"
              style={{ transform: "rotate(45deg)" }}
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Vous etes hors ligne
        </h1>

        <p className="text-slate-600 dark:text-slate-400">
          Pas de connexion Internet detectee. Certaines fonctionnalites restent
          accessibles hors ligne :
        </p>

        <ul className="text-left text-sm text-slate-600 dark:text-slate-400 space-y-2 mx-auto max-w-xs">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Diagnostic en cours (reprise)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Feuille de route (consultation)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Fiches memo telechargees
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Profil entreprise
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Notes et commentaires
          </li>
        </ul>

        <p className="text-xs text-slate-500 dark:text-slate-500">
          Vos modifications seront synchronisees automatiquement des que la
          connexion sera retablie.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reessayer
        </button>
      </div>

      <style>{`
        @keyframes offline-pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
