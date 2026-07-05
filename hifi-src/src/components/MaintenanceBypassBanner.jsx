const TEXT = (
  <>
    Wartungsmodus aktiv – Besucher sehen aktuell eine Wartungsmeldung. Du siehst diese Seite nur, weil
    du die Berechtigung "Wartungsmodus umgehen" hast.
  </>
);

export default function MaintenanceBypassBanner({ inline = false }) {
  if (inline) {
    return (
      <div className="mb-8 rounded-lg bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-white">
        {TEXT}
      </div>
    );
  }

  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-white">
      {TEXT}
    </div>
  );
}
