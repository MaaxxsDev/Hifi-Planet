import { Link } from 'react-router-dom';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function Datenschutz() {
  usePageMeta({
    title: 'Datenschutzerklärung',
    description: 'Datenschutzerklärung von HifiPlanet Amorbach gemäß Art. 13 DSGVO.',
    path: '/datenschutz',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">Datenschutzerklärung</h1>

      <div className="space-y-8 text-sm text-neutral-600 dark:text-neutral-300">
        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">1. Verantwortlicher</h2>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            <br />
            Hifi Planet e.K., Christopher Horndasch
            <br />
            Boxbrunner Str. 20a, 63916 Amorbach
            <br />
            Telefon: 09373 20 62 390 · E-Mail:{' '}
            <a href="mailto:info@hifi-planet-amorbach.de" className="hover:text-brand-500">info@hifi-planet-amorbach.de</a>
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">2. Ihre Rechte als betroffene Person</h2>
          <p className="mb-2">Sie haben jederzeit das Recht,</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO),</li>
            <li>die Berichtigung unrichtiger Daten zu verlangen (Art. 16 DSGVO),</li>
            <li>die Löschung Ihrer Daten zu verlangen (Art. 17 DSGVO),</li>
            <li>die Verarbeitung Ihrer Daten einschränken zu lassen (Art. 18 DSGVO),</li>
            <li>der Verarbeitung Ihrer Daten zu widersprechen (Art. 21 DSGVO),</li>
            <li>Ihre Daten in einem gängigen Format zu erhalten (Datenübertragbarkeit, Art. 20 DSGVO), und</li>
            <li>eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO).</li>
          </ul>
          <p className="mt-2">
            Außerdem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer
            personenbezogenen Daten durch uns zu beschweren, zum Beispiel beim Bayerischen Landesamt für
            Datenschutzaufsicht (BayLDA).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">3. Hosting und Server-Logfiles</h2>
          <p>
            Beim Aufruf dieser Website erhebt der Webserver automatisch Daten in sogenannten Server-Logfiles, die
            Ihr Browser übermittelt. Dazu gehören: IP-Adresse, Datum und Uhrzeit der Anfrage, aufgerufene Seite,
            verwendeter Browser und Betriebssystem sowie die zuvor besuchte Seite (Referrer-URL). Diese Daten
            dienen ausschließlich der technisch fehlerfreien Auslieferung der Website sowie der IT-Sicherheit
            (z. B. zur Abwehr von Angriffen) und werden nicht mit anderen Datenquellen zusammengeführt. Rechtsgrundlage
            ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb der Website (Art. 6 Abs. 1
            lit. f DSGVO).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">4. Kontaktformular</h2>
          <p>
            Wenn Sie uns über das Kontaktformular eine Anfrage zukommen lassen, werden Ihre Angaben aus dem
            Formular (Name, E-Mail-Adresse, optional Telefonnummer, Nachricht sowie ggf. der Kontext Ihrer Anfrage
            wie Marke, Modell oder Paket) inklusive der von Ihnen dort angegebenen Kontaktdaten bei uns
            gespeichert, um Ihre Anfrage zu bearbeiten und zu beantworten. Die Verarbeitung erfolgt auf Grundlage
            Ihrer Einwilligung durch Absenden des Formulars (Art. 6 Abs. 1 lit. a DSGVO) bzw., sofern Ihre Anfrage
            der Vorbereitung eines Vertrags dient, auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO. Wir löschen die
            Anfrage inklusive der Kontaktdaten, sobald der jeweilige Sachverhalt abschließend geklärt ist und keine
            gesetzlichen Aufbewahrungspflichten entgegenstehen. Diese Einwilligung können Sie jederzeit
            widerrufen, indem Sie uns formlos per E-Mail kontaktieren.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">5. Cookies und lokale Speicherung</h2>
          <p className="mb-2">
            Diese Website verwendet technisch notwendige Cookies bzw. Speichertechnologien, die für den Betrieb der
            Seite erforderlich sind und ohne die einzelne Funktionen nicht funktionieren würden. Dazu gehören:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              ein Session-Cookie (<code>hifi_admin_session</code>), das für den Anmeldestatus im Mitarbeiter-Login
              benötigt wird und mit Ende der Browsersitzung abläuft,
            </li>
            <li>
              eine lokale Speicherung (<code>localStorage</code>) Ihrer Hell-/Dunkelmodus-Einstellung sowie Ihrer
              Cookie-Auswahl, damit wir Sie nicht bei jedem Besuch erneut danach fragen müssen.
            </li>
          </ul>
          <p className="mt-2">
            Für diese technisch notwendigen Cookies ist gemäß § 25 Abs. 2 Nr. 2 TTDSG keine Einwilligung
            erforderlich. Rechtsgrundlage ist unser berechtigtes Interesse am technischen Betrieb der Website (Art.
            6 Abs. 1 lit. f DSGVO). Für alle darüber hinausgehenden Inhalte – aktuell die eingebundenen Google
            Maps- und YouTube-Elemente – fragen wir Sie beim ersten Besuch aktiv nach Ihrer Einwilligung. Sie
            können Ihre Auswahl jederzeit über den Link „Cookie-Einstellungen" im Footer ändern.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">6. Google Maps</h2>
          <p>
            Auf unserer Kontaktseite und im Footer binden wir Kartenmaterial des Dienstes „Google Maps" ein, um
            Ihnen die Anfahrt zu unserem Standort zu erleichtern. Anbieter ist Google Ireland Limited, Gordon
            House, Barrow Street, Dublin 4, Irland. Die eingebettete Karte wird erst geladen, nachdem Sie dem im
            Cookie-Banner unter „Externe Medien" zugestimmt haben. Beim Laden der Karte wird Ihre IP-Adresse an
            Google übertragen; eine Verarbeitung kann dabei auch auf Servern außerhalb der EU/des EWR erfolgen. Die
            Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit
            über die Cookie-Einstellungen widerrufen können. Weitere Informationen finden Sie in der{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand-500"
            >
              Datenschutzerklärung von Google
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">7. YouTube</h2>
          <p>
            Auf unserer Startseite binden wir ein Video des Anbieters YouTube (Google Ireland Limited, Gordon
            House, Barrow Street, Dublin 4, Irland) im „erweiterten Datenschutzmodus" ein (Domain
            youtube-nocookie.com). Auch dieses Video wird erst geladen, nachdem Sie unter „Externe Medien"
            zugestimmt haben. Nach Angaben von Google werden dabei bis zum Start der Wiedergabe keine Cookies
            gesetzt; beim Laden des Players wird jedoch bereits eine Verbindung zu Google-Servern aufgebaut und
            Ihre IP-Adresse übertragen. Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1
            lit. a DSGVO), die Sie jederzeit über die Cookie-Einstellungen widerrufen können. Weitere Informationen
            finden Sie in der{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand-500"
            >
              Datenschutzerklärung von Google
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">8. Empfänger der Daten</h2>
          <p>
            Ihre Daten werden grundsätzlich nur innerhalb unseres Unternehmens verarbeitet. Eine Weitergabe an
            Dritte erfolgt nur, soweit dies zur Bearbeitung Ihrer Anfrage erforderlich ist (z. B. an unseren
            Hosting-Provider zum Betrieb dieser Website und an unseren E-Mail-Anbieter zur Zustellung Ihrer
            Kontaktanfrage) oder soweit wir gesetzlich dazu verpflichtet sind.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">9. Speicherdauer</h2>
          <p>
            Sofern in dieser Erklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre
            personenbezogenen Daten bei uns, bis der Zweck für die Datenspeicherung entfällt. Gesetzliche
            Aufbewahrungsfristen (z. B. aus dem Handels- oder Steuerrecht) bleiben hiervon unberührt und können eine
            längere Speicherung erforderlich machen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">10. SSL-/TLS-Verschlüsselung</h2>
          <p>
            Diese Seite nutzt aus Sicherheitsgründen eine SSL-/TLS-Verschlüsselung zur Übertragung Ihrer Daten. Eine
            verschlüsselte Verbindung erkennen Sie an dem Schloss-Symbol in der Adresszeile Ihres Browsers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">11. Änderung dieser Datenschutzerklärung</h2>
          <p>
            Wir passen diese Datenschutzerklärung an, sobald sich die von uns eingesetzten Datenverarbeitungen
            ändern. Es gilt jeweils die zum Zeitpunkt Ihres Besuchs aktuelle, auf dieser Seite veröffentlichte
            Fassung.
          </p>
        </section>

        <p>
          Fragen zum Datenschutz beantworten wir Ihnen gerne über unser{' '}
          <Link to="/kontakt" className="underline hover:text-brand-500">Kontaktformular</Link> oder direkt per
          E-Mail.
        </p>
      </div>
    </div>
  );
}
