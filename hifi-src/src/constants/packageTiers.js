// Die 8 Standard-Paketstufen (Preisleiter, aufsteigend) - entsprechen den
// Referenz-Kacheln (Strassen-Motive base.webp ... limitless.webp).
// Nur vom Admin-Bereich genutzt: die oeffentliche ModelPage ordnet ihre
// Kachel-Themes weiterhin per Preis-Rang zu (siehe ModelPage.jsx tierOf),
// damit auch Alt-Pakete mit abweichenden Namen korrekt dargestellt werden.
export const PACKAGE_TIERS = [
  'Base',
  'Clear',
  'Drive',
  'Prime',
  'Elite R',
  'Apex',
  'The Statement',
  'Limitless',
];

// Default-Sortierung fuer neu angelegte Tier-Pakete: 10, 20, ..., 80 -
// laesst Luecken, falls dazwischen mal etwas einsortiert werden muss.
export const tierSortOrder = (index) => (index + 1) * 10;
