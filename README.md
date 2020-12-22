# wahlkarte

Die Anwendung ist bis Dezember 2020 im Rahmen einer Bachelorarbeit mit dem Titel "Interaktive geographische Darstellung von Wahlergebnissen unter Einsatz von Open Data" entstanden.

Für Wahldaten wird der [Standard für Offene Wahldaten](https://offenewahldaten.de/) verwendet, der sich noch in Entwicklung befindet.  
Projektpartner vom Wahldatenstandard sind u. a. der kommunale IT-Dienstleister [kdvz Rhein-Erft-Rur](https://www.kdvz-frechen.de/), die [Open Knowledge Foundation Deutschland](https://okfn.de/), und der führende Dienstleister [vote iT](https://vote-it.de/).

Dieses Repositorium/Software zitieren: [![DOI](https://zenodo.org/badge/317960064.svg)](https://zenodo.org/badge/latestdoi/317960064)  
Die Bachelorarbeit ist ebenfalls veröffentlicht, dies ermöglicht einen vertiefenden Einblick in die Erkenntnisse und Schwierigkeiten im Umgang mit den Daten: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4386794.svg)](https://doi.org/10.5281/zenodo.4386794)

---

Installation: `npm install`  
Ausführung: `npm run start:dev` für Entwicklungsserver, `npm run build` für einen Build in das `dist/`-Verzeichnis.

---

- `src/` -- Web-Anwendung
  - `src/data/` -- statisch verwendete Datensätze, teilweise selber erstellt (Offene Wahldaten & Geodaten)
  - `src/js/` -- Quellcode der Web-Anwendung (`src/js/wahl-lib`: lässt sich unabhängig vom Interface zur Verarbeitung der Wahldaten verwenden)
- `tools/` -- bisher unsortierte Sammlung an Daten und Tools zur Datenverarbeitung oder für Scraping

---

Die Struktur basiert auf [erickzhao/static-html-webpack-boilerplate](https://github.com/erickzhao/static-html-webpack-boilerplate).
