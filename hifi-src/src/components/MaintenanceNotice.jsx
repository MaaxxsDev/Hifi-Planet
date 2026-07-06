const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a4 4 0 0 0-5.5 4.5L3 17l2 2 6.2-6.2a4 4 0 0 0 4.5-5.5l-2.6 2.6-2-2 2.6-2.6Z" />
  </svg>
);

export default function MaintenanceNotice({ message, fullScreen = false }) {
  const content = (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
        <WrenchIcon />
      </div>
      <h1 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">Wartungsarbeiten</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        {message || 'Dieser Bereich wird gerade aktualisiert. Bitte schau in Kürze wieder vorbei.'}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
        {content}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      {content}
    </div>
  );
}
