# Handoff: Kontaktformular Redesign (HiFi Planet)

## Aufgabe für Claude Code

Ersetze das bestehende Kontaktformular der Website durch das neue Design aus `Kontaktformular.dc.html` (Design-Referenz in diesem Ordner). Baue es in der bestehenden Codebase mit deren Framework, Komponenten- und Styling-Patterns nach — die HTML-Datei ist ein **Design-Prototyp als Referenz**, kein Produktionscode zum Kopieren.

### Wichtige Integrationspunkte (unbedingt beachten!)

1. **KEIN eigener Dark-Mode-Toggle.** Die Seite hat bereits einen globalen Hell/Dunkel-Umschalter. Den Sonne/Mond-Button aus dem Prototyp (oben rechts in der Nav) **weglassen**. Stattdessen: das Kontaktformular reagiert auf den vorhandenen Theme-Mechanismus der Seite (z.B. `data-theme`-Attribut, CSS-Klasse auf `<html>`/`<body>`, oder Theme-Context — an das anpassen, was die Codebase nutzt). Beide Farbwelten (Light + Dark, siehe Design Tokens unten) müssen umgesetzt werden.

2. **Paket-Vorauswahl übernehmen.** Auf der Seite gibt es eine Paketauswahl (Marke → Modell → Paket); klickt der Nutzer dort auf „Kontakt aufnehmen", landet er auf dem Kontaktformular und dort muss die Box **„Deine Anfrage bezieht sich auf"** mit Marke, Modell, Paketname und Paketpreis erscheinen (siehe Screens unten). Anbindung an den bestehenden Mechanismus (Query-Params, Router-State, Store o.ä. — prüfen, wie es aktuell gelöst ist). Kommt der Nutzer **ohne** Paketauswahl auf die Seite, wird die Box **nicht** angezeigt. Die Paketdaten sollen zusammen mit dem Formular abgeschickt werden.

3. **Formular-Versand:** Der Prototyp zeigt nur eine Erfolgsmeldung im UI. Den echten Versand (bestehender Endpoint / Mailer der Seite) anbinden.

## Fidelity

**High-fidelity.** Farben, Typografie, Abstände, Radii und Zustände sind final und sollen pixelgenau übernommen werden.

## Screens / Aufbau

Eine Seite, zwei Themes (light/dark), responsive. Max. Inhaltsbreite 1280px, zentriert, Seiten-Padding 40px (mobil 16px), unten 40px.

### Top-Nav
- Zeile mit `justify-content: space-between`, unten 1px Border (`--cardbrd`), padding-top 34px, padding-bottom 22px.
- Links: Logo-Wortmarke „HIFI PLANET" (Michroma, 24px, letter-spacing 4px; „PLANET" in Akzentgrün) + Tagline „HOME OF PURE SOUND" (12px, letter-spacing 6px, uppercase, gedämpft). **Falls die Seite bereits eine globale Nav hat, entfällt dieser Block — dann nur den Seiteninhalt ab „Kontakt" übernehmen.**
- Rechts: WhatsApp-Pille — weiße (dark: Karten-)Pille, `border-radius: 999px`, padding 11px 22px, Icon in grünem Kreis (26px, Hintergrund `--accentsoft`), Nummer „+49 1520 6682940", Link `https://wa.me/4915206682940`. Hover: Border wird Akzentgrün.
- (Der Theme-Toggle-Button daneben entfällt, s.o.)

### Hero / Intro (linke Spalte, oberhalb Formular)
- Eyebrow „KONTAKT": 13px, letter-spacing 6px, uppercase, Akzentgrün, semibold, margin-bottom 12px.
- H1 „Sprich mit uns.": Michroma, `clamp(34px, 5vw, 60px)`, line-height 1.08, Textfarbe `--text`; das Wort „mit" in Akzentgrün. Mobil 34px.
- Untertitel: „Ob Anlage, Einbau oder Klang-Tuning für dein Fahrzeug — schreib uns, wir melden uns schnellstmöglich zurück." — 18px, line-height 1.55, `--muted`, max-width 520px, margin 20px 0 40px.

### Hauptraster
- Grid: `minmax(0, 1.35fr) minmax(320px, 1fr)`, gap 40px, `align-items: start`, margin-top 46px.
- **≤980px:** einspaltig.

### Formular-Karte (links)
Karte: Hintergrund `--card`, 1px Border `--cardbrd`, `border-radius: 14px`, padding 40px (mobil 22px), Schatten `--shadow`.

**Paket-Box (konditional, ganz oben in der Karte):**
- Hintergrund `--pkgbg`, 1px Border `--pkgbrd`, `border-radius: 12px`, padding 22px 24px, margin-bottom 30px.
- Kopfzeile: Paket-Icon (16px, Outline-Stil) + „DEINE ANFRAGE BEZIEHT SICH AUF" — 12px, letter-spacing 2px, uppercase, Akzentgrün, bold, margin-bottom 14px.
- Zeilen als 2-Spalten-Grid (`auto 1fr`, gap 8px 20px, 15px): Label gedämpft (`--label`), Wert semibold (`--text2`):
  - Marke → z.B. „Audi"
  - Modell → z.B. „A5 F5 Cabrio"
  - Paket → z.B. „Base"
- Trennlinie (1px, `--pkgbrd`), darunter Zeile „PAKETPREIS" (13px, uppercase, `--muted`) links und Preis rechts (Michroma, 20px, `--text`), z.B. „999,00 €".

**Überschrift:** „Anfrage senden" — Michroma, 20px, `--text`, margin-bottom 30px.

**Felder** (Grid 2 Spalten, gap 24px; **≤640px** einspaltig):
1. Name * (Pflicht) — Icon: Person
2. E-Mail * (Pflicht, type=email) — Icon: Briefumschlag
3. Telefon (optional) — Icon: Hörer
4. Fahrgestellnummer (FIN) (optional, Placeholder „Optional – hilft bei der Einschätzung") — Icon: Auto

Feld-Anatomie:
- Label: 12px, letter-spacing 2px, uppercase, `--label`, semibold, gap 9px zum Input.
- Input: Hintergrund `--field`, 1px Border `--fieldbrd`, `border-radius: 8px`, padding 14px 16px (links 42px wegen Icon), 15px Text, Icon 17px absolut links 14px in Farbe `--fieldicon`.
- Focus: Border Akzent, `box-shadow: 0 0 0 3px rgba(164,212,23,0.2)`.
- Placeholder-Farbe: `--fieldicon`.

**Nachricht:** Textarea, 5 Zeilen, gleiche Feld-Optik (ohne Icon), `resize: vertical`, margin-top 24px. Placeholder: „Erzähl uns von deinem Projekt – Fahrzeug, Wunschklang, Budget …".

**Submit-Zeile** (margin-top 30px, flex, gap 20px):
- Button „ANFRAGE SENDEN" mit Papierflieger-Icon (18px): Hintergrund `--accent`, Text `--btntext`, `border-radius: 8px`, padding 16px 34px, 14px, bold, letter-spacing 3px, uppercase, Schatten `0 10px 24px rgba(150,200,20,0.32)`. Hover: leicht heller + stärkerer Schatten.
- Hinweis „* Pflichtfelder", 13px, `--label`.

**Erfolgszustand:** Nach Versand Box über den Feldern — Border `--accent`, Hintergrund `--accentsoft`, `border-radius: 10px`, padding 20px 22px: „Anfrage gesendet ✓" (bold, Akzent) + „Danke! Wir melden uns innerhalb eines Werktags bei dir." (14px, `--muted`).

### Kontakt-Karte (rechts oben)
Gleiche Kartenoptik, padding 34px 32px (mobil 26px 22px). Dekor: gestrichelter Kreis (190px, `--pkgbrd`) rechts oben aus der Karte laufend.
- Überschrift „HiFi Planet Amorbach" — Michroma 17px.
- 4 Einträge, je: runder Icon-Chip 44px (`--accentsoft`, Icon 18px Akzentgrün) + Mini-Label (11px, letter-spacing 3px, uppercase, Akzentgrün) + Wert (16px, semibold):
  - TELEFON → „09373 20 62 390" (`tel:093732062390`)
  - E-MAIL → „info@hifi-planet.de" (`mailto:`)
  - ADRESSE → „Boxbrunner Straße 20a / 63916 Amorbach" (zweizeilig)
  - WHATSAPP → „+49 1520 6682940" (`https://wa.me/4915206682940`)
- Abschnitt „ÖFFNUNGSZEITEN" nach Trennlinie (`--divider`): Grid `auto 1fr`, gap 8px 24px, 15px — „Mo–Fr / 9:00 – 18:00 Uhr", „Sa / 10:00 – 13:00 Uhr".

### Karten-/Map-Block (rechts unten)
- Karte mit `border-radius: 14px`, overflow hidden.
- Google-Maps-Embed (`https://www.google.com/maps?q=Boxbrunner+Str.+20a,+63916+Amorbach&output=embed`), Höhe 210px.
- Overlay-Chip oben links: „In Maps öffnen" + Extern-Icon, Pillen-Optik (Hintergrund `--pill`, Border `--pillbrd`, radius 8px, padding 8px 14px, 13px semibold).
- Fußzeile: „ROUTE PLANEN →" — 13px, bold, letter-spacing 3px, uppercase, Akzentgrün, padding 16px, obere Trennlinie; Hover: Hintergrund `--accentsoft`. Beide Links: Google-Maps-Directions-URL, `target="_blank"`.

### Feature-Leiste (unter dem Raster, volle Breite)
Karte, margin-top 40px, Grid 4 Spalten (≤900px: 2 Spalten, ≤640px: 1 Spalte), Zellen mit 1px Trenner rechts (mobil unten):
Je Zelle: Icon im Kreis 46px (1.5px Border `--pkgbrd`, Icon 22px Akzentgrün) + Titel (15px, bold) + Untertitel (13px, `--muted`):
1. „Premium Klang" / „Höchste Qualität" (Equalizer-Icon)
2. „Made in Germany" / „Präzise Handarbeit" (Zahnrad/Sonne-Icon)
3. „Individuell" / „Maßgeschneiderte Lösungen" (Diamant-Icon)
4. „Experten Team" / „Leidenschaft & Know-how" (Häkchen-Icon)

Alle Icons: Outline-SVGs, `stroke-width: 2`, `stroke-linecap/linejoin: round` (Lucide-Stil — falls die Codebase Lucide o.ä. nutzt, deren Icons verwenden).

## Hintergründe (Seitenebene, hinter den Karten)

### Light Mode
- Seitenverlauf: `linear-gradient(120deg, #eef0ea 0%, #f6f8f3 45%, #fbfcf9 100%)`.
- Links: Auto-Foto-Streifen, 34% Breite, volle Höhe, `object-fit: cover`, darüber Scrim `linear-gradient(90deg, rgba(244,246,241,0.35), rgba(244,246,241,0.55) 55%, rgba(246,248,243,1))`. Foto: eigenes Asset der Seite verwenden. **≤980px ausblenden.**
- Rechts: grüne „Lichtstreifen"-Gruppe, 42% Breite, um 6° rotiert, aus vier Ebenen: 3px-Linie (`linear-gradient(180deg, transparent, #b6e619 30%, #cfef5a 55%, transparent)`, blur 1px, opacity .85), 90px weicher Schein (blur 26px), zweite dünne Linie (2px, blur 1px), großer radialer Glow (`rgba(207,239,90,0.35)`, blur 20px).
- Oben links: dezente Topo-Wellenlinien (5 geschwungene Pfade, Stroke `#d7dccd`, 1px, opacity .5, ca. 360×280px).

### Dark Mode
- Seitenverlauf: `linear-gradient(120deg, #181b0f 0%, #111409 45%, #0a0c06 100%)`.
- Vollflächige Grunge-Textur: `assets/grunge.png` (cover, zentriert) — dunkle Körnung mit Lichtfleck und Vignette.
- Rechts: grüner Paint-Splatter `assets/splatter.png` — 46% Breite, 122% Höhe, top -8%, right -4%, `background-size: contain`, rechtsbündig, mit `filter: drop-shadow(0 0 22px rgba(164,212,23,0.35))`.
- Rechts zusätzlich: großer Kreisbogen als SVG — Vollton-Bogen `rgba(168,225,12,0.5)` (1.5px) + innerer gestrichelter Bogen `rgba(168,225,12,0.18)` (1px, `stroke-dasharray: 2 9`).
- Beide PNGs liegen in `assets/` bei.

Alle Hintergrund-Ebenen: `position: absolute`, `pointer-events: none`, Inhalt darüber (`z-index: 1`).

## Design Tokens

Als CSS Custom Properties umgesetzt (Prototyp nutzt `:root` + `[data-theme="dark"]`):

| Token | Light | Dark |
|---|---|---|
| `--card` | `#ffffff` | `#14170e` |
| `--cardbrd` | `#e4e8dc` | `rgba(168,225,12,0.16)` |
| `--text` (Headings) | `#23271d` | `#f3f6ea` |
| `--text2` (Body) | `#2a2e24` | `#e8ece0` |
| `--muted` | `#6c7360` | `#9aa38c` |
| `--label` | `#838a72` | `#8f987f` |
| `--field` | `#fafcf6` | `rgba(0,0,0,0.35)` |
| `--fieldbrd` | `#dde2d3` | `#2c3323` |
| `--fieldicon` | `#a7ad9d` | `#5f6852` |
| `--accent` (Button) | `#a4d417` | `#a8e10c` |
| `--accent2` (Grün-Text/Icons) | `#8ec21a` | `#b6e619` |
| `--accentsoft` | `#f2f8df` | `rgba(168,225,12,0.1)` |
| `--pill` | `#ffffff` | `#14170e` |
| `--pillbrd` | `#dfe4d6` | `rgba(168,225,12,0.28)` |
| `--shadow` | `0 24px 60px rgba(60,70,40,0.08)` | `0 24px 60px rgba(0,0,0,0.55)` |
| `--shadow2` | `0 16px 40px rgba(60,70,40,0.06)` | `0 16px 40px rgba(0,0,0,0.45)` |
| `--divider` | `#e8ecdf` | `rgba(168,225,12,0.15)` |
| `--pkgbg` (Paket-Box) | `#f4fbe4` | `rgba(168,225,12,0.08)` |
| `--pkgbrd` | `#cfe89a` | `rgba(168,225,12,0.4)` |
| `--btntext` | `#1f2417` | `#0f1208` |

**Typografie:** Michroma (Headings/Logo/Preis) + Barlow 400–700 (alles andere), via Google Fonts. Falls die Seite diese Fonts schon lädt, vorhandene Einbindung nutzen.

**Radii:** Karten 14px, Paket-Box 12px, Erfolgsbox 10px, Inputs/Buttons 8px, Pillen 999px, Icon-Chips 50%.

## Responsive Breakpoints
- **≤980px:** Hauptraster einspaltig; Auto-Foto (light) ausblenden.
- **≤900px:** Feature-Leiste 2-spaltig.
- **≤640px:** Formularfelder 1-spaltig, Feature-Leiste 1-spaltig (Trenner unten statt rechts), Seiten-Padding 16px, Karten-Padding reduziert (Formular 22px), H1 34px.

## State Management
- `sent: boolean` — Erfolgsbox nach Submit (bzw. an echten Submit-Flow koppeln: loading/success/error).
- Paketdaten `{ marke, modell, paket, preis }` — von der Paketauswahl-Seite übergeben (bestehenden Mechanismus verwenden); `null` → Box ausblenden.
- Theme — vom globalen Umschalter der Seite, kein lokaler State.

## Assets (beiliegend)
- `assets/grunge.png` — Dark-Mode Grunge-Hintergrund (1600×1400)
- `assets/splatter.png` — Dark-Mode Paint-Splatter, transparent (1100×1500)
- Auto-Foto für den Light Mode: **nicht enthalten** — vorhandenes Bildmaterial der Seite verwenden.

## Dateien
- `Kontaktformular.dc.html` — Design-Referenz (Prototyp; Template + Inline-Styles; Dark Mode über `data-theme="dark"` toggelbar — im Prototyp per Button, in der Umsetzung über den globalen Theme-Schalter)
