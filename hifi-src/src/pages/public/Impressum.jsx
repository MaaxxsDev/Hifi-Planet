import usePageMeta from '../../hooks/usePageMeta.js';

export default function Impressum() {
  usePageMeta({
    title: 'Impressum',
    description: 'Impressum von HifiPlanet Amorbach gemäß § 5 DDG.',
    path: '/impressum',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Impressum</h1>

      <div className="space-y-8 text-sm text-slate-600 dark:text-slate-300">
        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Angaben gemäß § 5 DDG</h2>
          <p>
            Hifi Planet e.K.
            <br />
            Inhaber: Christopher Horndasch
            <br />
            Boxbrunner Str. 20a
            <br />
            63916 Amorbach
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Kontakt</h2>
          <p>
            Telefon: <a href="tel:+4993732062390" className="hover:text-brand-500">09373 20 62 390</a>
            <br />
            E-Mail: <a href="mailto:info@hifi-planet-amorbach.de" className="hover:text-brand-500">info@hifi-planet-amorbach.de</a>
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Umsatzsteuer-ID</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: DE 275084766
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Zuständige Kammer</h2>
          <p>IHK Aschaffenburg</p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            Christopher Horndasch
            <br />
            Anschrift wie oben
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle im Sinne des Verbraucherstreitbeilegungsgesetzes (VSBG) teilzunehmen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
            forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung
            der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine
            diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
            möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
            entfernen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Eine
            permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer
            Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links
            umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte
            Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem
            auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei
            Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
          </p>
        </section>
      </div>
    </div>
  );
}
