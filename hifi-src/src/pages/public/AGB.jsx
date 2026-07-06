import usePageMeta from '../../hooks/usePageMeta.js';

export default function AGB() {
  usePageMeta({
    title: 'AGB',
    description: 'Allgemeine Geschäftsbedingungen von HifiPlanet Amorbach.',
    path: '/agb',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
        Allgemeine Geschäftsbedingungen
      </h1>

      <div className="space-y-8 text-sm text-neutral-600 dark:text-neutral-300">
        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">1. Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Beratungs-, Werkstatt- und
            Umbauleistungen, die die Hifi Planet e.K., Boxbrunner Str. 20a, 63916 Amorbach („wir", „HifiPlanet")
            gegenüber ihren Kunden erbringt, sowie für die Nutzung des Kontaktformulars auf dieser Website.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">2. Anfragen über die Website</h2>
          <p>
            Über das Kontaktformular können Sie unverbindlich eine Beratung oder ein Angebot zu einem einzelnen
            Produkt oder einem ganzen Paket anfragen. Die auf der Website angezeigten Preise sind, soweit sie von
            Drittanbietern automatisiert übernommen werden, unverbindliche Circa-Preise ohne Einbau und können sich
            bis zur Erstellung eines konkreten Angebots ändern. Mit dem Absenden einer Anfrage kommt noch kein
            Vertrag zustande.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">3. Vertragsschluss</h2>
          <p>
            Ein verbindlicher Vertrag über Beratung, Material und Einbauleistungen kommt erst zustande, wenn wir
            Ihnen nach persönlicher oder schriftlicher Abstimmung ein konkretes Angebot unterbreitet haben und Sie
            dieses angenommen haben, spätestens jedoch mit der Übergabe Ihres Fahrzeugs zur vereinbarten
            Auftragsdurchführung in unserer Werkstatt in Amorbach.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">4. Preise und Zahlung</h2>
          <p>
            Es gelten die im jeweiligen Einzelangebot genannten Preise inklusive der zum Zeitpunkt der
            Rechnungsstellung gesetzlich geltenden Umsatzsteuer. Sofern nichts anderes vereinbart ist, ist die
            Rechnung nach Abnahme der Leistung bzw. Übergabe des Fahrzeugs ohne Abzug fällig.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">5. Termine und Fahrzeugübergabe</h2>
          <p>
            Vereinbarte Termine zur Fahrzeugübergabe sind von beiden Seiten einzuhalten. Verschiebungen sind
            möglichst frühzeitig mitzuteilen. Für Gegenstände, die sich zum Zeitpunkt der Übergabe im Fahrzeug
            befinden und nicht Gegenstand des Auftrags sind, übernehmen wir keine Haftung.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">6. Gewährleistung</h2>
          <p>
            Es gelten die gesetzlichen Gewährleistungsrechte. Mängel sind uns unverzüglich nach Feststellung
            anzuzeigen, damit wir Ihnen Nacherfüllung anbieten können. Für Verschleißteile sowie für Schäden, die
            auf unsachgemäße Behandlung, Fremdeingriffe Dritter oder normalen Verschleiß zurückzuführen sind,
            besteht kein Gewährleistungsanspruch.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">7. Eigentumsvorbehalt</h2>
          <p>
            Verbautes Material und gelieferte Ware bleiben bis zur vollständigen Bezahlung unser Eigentum.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">8. Haftung</h2>
          <p>
            Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie nach Maßgabe des
            Produkthaftungsgesetzes. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen
            Vertragspflicht (Kardinalpflicht) und begrenzt auf den vertragstypisch vorhersehbaren Schaden. Die
            Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit bleibt hiervon
            unberührt.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">9. Widerrufsrecht</h2>
          <p>
            Ein gesetzliches Widerrufsrecht für Verbraucher besteht bei Verträgen, die außerhalb von
            Geschäftsräumen oder im Fernabsatz geschlossen werden. Da der eigentliche Werkvertrag über Beratung und
            Einbauleistungen erst bei persönlicher Fahrzeugübergabe in unseren Geschäftsräumen in Amorbach
            geschlossen wird, handelt es sich hierbei nicht um einen Fernabsatzvertrag; ein gesetzliches
            Widerrufsrecht besteht in diesem Fall nicht. Sollte im Einzelfall ausnahmsweise ein Vertrag im
            Fernabsatz zustande kommen, informieren wir Sie gesondert über Ihr gesetzliches Widerrufsrecht.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">10. Anwendbares Recht und Gerichtsstand</h2>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Ist der Kunde
            Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist
            Gerichtsstand für alle Streitigkeiten aus diesem Vertragsverhältnis unser Geschäftssitz in Amorbach.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-900 dark:text-white">11. Schlussbestimmungen</h2>
          <p>
            Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen
            Bestimmungen hiervon unberührt.
          </p>
        </section>
      </div>
    </div>
  );
}
