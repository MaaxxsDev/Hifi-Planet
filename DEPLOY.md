# Deployment

Alles liegt auf **einem Branch: `main`** — Quellcode (`hifi-src/`) und das fertig
gebaute, deploybare Ergebnis (`hifi/` = Frontend-Build + PHP-API inkl. vendor).
Es gibt keinen `deploy`-Branch und keine GitHub Action mehr.

## Ablauf bei Änderungen

```
cd hifi-src
npm run build        # räumt hifi/assets vorher automatisch leer (prebuild)
git add ...          # Quellcode UND Build-Output (hifi/index.html, hifi/assets, ...)
git commit && git push
```

Wichtig: **Vor jedem Commit bauen** — der Build-Output gehört mit in den Commit,
sonst ist der Stand auf dem Server veraltet.

## Kunden-Hosting (All-Inkl)

Einmalig per SSH:

```
git clone https://github.com/MaaxxsDev/Hifi-Planet.git
```

- Domain-Docroot auf `<checkout>/hifi` zeigen lassen.
- `hifi/api/config/db.php` und `setup.php` sind bewusst nicht im Repo
  (umgebungsspezifische Zugangsdaten) — beim ersten Aufruf über den
  Setup-Assistenten (`/setup`) anlegen bzw. Dateien manuell hinterlegen.

Update danach einfach:

```
git pull
```

(Ohne SSH alternativ: Repo lokal klonen und den Inhalt von `hifi/` per FTP hochladen.)

## Testserver (Plesk)

In Plesk unter „Git" die Quelle vom früheren `deploy`-Branch auf **`main`**
umstellen; der Docroot bleibt auf dem Unterordner `hifi/` des Checkouts.
