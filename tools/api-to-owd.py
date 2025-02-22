#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

from __future__ import annotations

from csv import writer, reader, DictReader
from dataclasses import dataclass
from hashlib import md5
from typing import List, Tuple, Any, Dict, Optional

from requests import get as r_get

# optional, aber empfohlen
import requests_cache
requests_cache.install_cache('api-to-owd-cache')

def r_simple(url):
    # print(url)
    r = r_get(url)
    r.raise_for_status()
    return r

def r_json(url):
    r = r_simple(url)
    return r.json()

@dataclass
class Wahl:
    wahlparameter: Wahlparameter
    wahlgebietseinteilungen: Wahlgebietseinteilungen
    stimmzettel: Stimmzettel
    kandidaturen: Optional[Kandidaturen]
    wahlergebnisse: Wahlergebnisse

    def writeOWDcsv(self) -> None:
        # Reihenfolge ist jetzt erstmal wichtig geworden: Kandidaturen vor Stimmzettel.
        for obj in (self.wahlparameter, self.wahlgebietseinteilungen, self.kandidaturen, self.stimmzettel, self.wahlergebnisse):
            if obj: obj.writeOWDcsv()

@dataclass
class Wahlparameter:
    data: Dict[str, Any]
    termin: Dict[str, Any]
    wahlBehoerdeGS: str
    wahlBehoerdeName: str
    kandGebBez: str

    @property
    def wahlName(self):
        return self.data['titel']

    @property
    def niedrigsteEbeneID(self):
        return self.data['menu_links'][-1]['id']

    @property
    def ebenen(self):
        e = {}
        for link_data in self.data['menu_links']:
            if link_data['type'] != 'uebersicht': continue
            e[link_data['id']] = link_data['title']
        return e

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.data.get('datum') or self.termin.get('datum')}_{self.wahlName.replace("/", "-")}_Wahlparameter_V0-3_{self.data.get('file_timestamp', '').replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-behoerde-name", "wahl-datum", "wahl-name", "wahl-bezeichnung",
                "kandidat-gebiet-bezeichnung", "gebiet-ebene-5-bezeichnung", "gebiet-ebene-4-bezeichnung",
                "gebiet-ebene-3-bezeichnung", "gebiet-ebene-2-bezeichnung", "bezirk-bezeichnung"
            ))
            csvw.writerow((
                "0.3", self.wahlBehoerdeGS, self.wahlBehoerdeName, self.data.get('datum') or self.termin.get('datum'), self.wahlName, self.data['titel'],
                self.kandGebBez, *(['']*(5-len(self.ebenen))), *self.ebenen.values()
            ))

@dataclass
class Wahlgebietseinteilungen:
    uebersicht_data: Dict[str, Any]
    bezirke_data: Dict[str, Dict[str, Any]]
    datum: str
    wahlName: str
    wahlBehoerdeGS: str
    wahlLeiterGS: str
    wahlLeiterName: str
    kandGebNr: str
    kandGebBez: str
    stimmGebNr: str = ""  # TODO
    stimmGebBez: str = ""  # TODO

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName.replace("/", "-")}_Wahlgebietseinteilungen_V0-3_{(self.uebersicht_data.get('file_timestamp') or self.uebersicht_data.get('zeitstempel')).replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-datum", "wahl-name", "wahl-leiter-gs", "wahl-leiter-name",
                "gebiet-ebene-5-nr", "gebiet-ebene-5-name", "gebiet-ebene-4-nr", "gebiet-ebene-4-name",
                "gebiet-ebene-3-nr", "gebiet-ebene-3-name", "gebiet-ebene-2-nr", "gebiet-ebene-2-name",
                "bezirk-nr", "bezirk-name", "BRIEFWAHLBEZIRK-NR", "bezirk-art", "bezirk-repräsentativ",
                "kandidat-gebiet-nr", "kandidat-gebiet-bezeichnung",
                "stimmzettel-gebiet-nr", "stimmzettel-gebiet-bezeichnung"
            ))

            def _name_to_id(name) -> str:
                # wieso? weil wir nachher erstmal die open data csv verwenden und die gebiets IDs nicht die "internen" sind die wir hier sonst sehen
                # es ist aber leider nicht direkt in den Daten vorhanden, müssen wir also nachahmen
                assert name
                return ''.join(_ for _ in name.split(" ")[0] if _.isdigit()) or ''.join(_ for _ in name.split(" ")[-1] if _.isdigit()) or name

            for bezirk_id_intern, bezirk_dict in self.bezirke_data.items():
                bezirk_data = bezirk_dict['data']
                gebietsverlinkung = bezirk_data['Komponente']['gebietsverlinkung']
                # reihenfolge/anzahl sollte so sein wie in wahlparameter. häufig wohl manuelle anpassung notwendig (dort so machen wie es hier in daten ist)
                name_5 = gebietsverlinkung[-5]['gebietslinks'][0]['title'] if len(gebietsverlinkung) >= 5 else ''
                nr_5 = _name_to_id(name_5) if name_5 else ''
                name_4 = gebietsverlinkung[-4]['gebietslinks'][0]['title'] if len(gebietsverlinkung) >= 4 else ''
                nr_4 = _name_to_id(name_4) if name_4 else ''
                name_3 = gebietsverlinkung[-3]['gebietslinks'][0]['title'] if len(gebietsverlinkung) >= 3 else ''
                nr_3 = _name_to_id(name_3) if name_3 else ''
                name_2 = gebietsverlinkung[-2]['gebietslinks'][0]['title'] if len(gebietsverlinkung) >= 2 else ''
                nr_2 = _name_to_id(name_2) if name_2 else ''

                bezirk_name = bezirk_dict['name'] or bezirk_data['Komponente']['info']['titel']
                bezirk_id = _name_to_id(bezirk_name)
                briefwahlbezirk_id = bezirk_id
                # vorsicht
                if gebietsverlinkung and (letzte := gebietsverlinkung[-1])['titel'] != "Stimmbezirke":
                    assert len(letzte['gebietslinks']) == 1
                    briefwahlbezirk_id = _name_to_id(letzte['gebietslinks'][0]['title'])

                csvw.writerow((
                    "0.3", self.wahlBehoerdeGS, self.datum, self.wahlName, self.wahlLeiterGS, self.wahlLeiterName,
                    nr_5, name_5, nr_4, name_4, nr_3, name_3, nr_2, name_2,
                    bezirk_id, bezirk_name, briefwahlbezirk_id, "B" if "Briefwahl" in bezirk_name else "W", "",
                    self.kandGebNr, self.kandGebBez,
                    self.stimmGebNr, self.stimmGebBez
                ))

@dataclass
class Stimmzettel:
    data: Dict[str, Any]
    datum: str
    wahlName: str
    wahlBehoerdeGS: str
    alt_ts: str
    stimmGebNr: str = ""  # TODO
    stimmGebBez: str = ""  # TODO
    
    def __post_init__(self):
        self._fakes = {}

    def get_or_fake(self, labelKurz, color=None):
        # color dient nicht dem lookup sondern dem faken wenn es bewerber ohne liste gibt
        # in Hagen ist das mit ---, in Karlsruhe fehlt der Eintrag bei den Zweitstimmen in der Tabelle.
        for partei in self.entries:
            if partei['label']['labelKurz'] == labelKurz:
                return partei
        self._fakes[labelKurz] = color
        return self.fake_entry(labelKurz, color)

    @staticmethod
    def fake_entry(labelKurz, color):
        return {'label': {'labelKurz': labelKurz}, 'color': color}

    @property
    def entries(self):
        all_entries = []
        all_entries.extend(self.data['Komponente']['tabelle']['zeilen'])
        for fake_labelKurz, fake_color in self._fakes.items():
            all_entries.append(Stimmzettel.fake_entry(fake_labelKurz, fake_color))
        return all_entries

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName.replace("/", "-")}_Stimmzettel_V0-3_{(self.data.get('file_timestamp') or self.alt_ts).replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-datum", "wahl-name",
                "stimmzettel-gebiet-nr", "stimmzettel-gebiet-bezeichnung",
                "stimmzettel-position", "partei-kurzname", "partei-langname", "partei-rgb-wert", "partei-typ"
            ))
            for pos, partei in enumerate(self.entries, 1):
                csvw.writerow((
                    "0.3", self.wahlBehoerdeGS, self.datum, self.wahlName,
                    self.stimmGebNr, self.stimmGebBez,
                    pos, partei['label']['labelKurz'], partei['label'].get('labelLang'), partei['color'], 'E' if "Einzelbewerber" in (partei['label'].get('labelLang') or partei['label'].get('labelKurz')) else 'P'
                ))

@dataclass
class Kandidaturen:
    data: Dict[str, Any]
    stimmzettel: Stimmzettel
    datum: str
    wahlName: str
    wahlBehoerdeGS: str
    kandGebNr: str

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName.replace("/", "-")}_Kandidaten_V0-3_{self.data['file_timestamp'].replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-datum", "wahl-name",
                "partei-kurzname", "partei-langname",
                "kandidat-name", "kandidat-namensvorsatz", "kandidat-vorname",
                "kandidat-akadgrad", "kandidat-geburtsjahr", "kandidat-geschlecht", "kandidat-beruf",
                "kandidat-gebiet-nr", "kandidat-listenplatz"
            ))
            for kandidatur in self.data['Komponente']['tabelle']['zeilen']:
                if (kandidatur['zahl'] == '---'): continue
                nachname, parteiKurzLabel = kandidatur['label']['labelKurz'].split(", ")
                partei = self.stimmzettel.get_or_fake(parteiKurzLabel, kandidatur['color'])
                # ????
                vorname = (kandidatur['label'].get('labelLang') or kandidatur['label'].get('labelKurz')).split(nachname if not ' ' in nachname else nachname.split(' ')[1])[0].removeprefix('' if not ' ' in nachname else nachname.split(' ')[0]).strip()
                csvw.writerow((
                    "0.3", self.wahlBehoerdeGS, self.datum, self.wahlName,
                    partei['label']['labelKurz'], partei['label'].get('labelLang'),
                    nachname, "", vorname,
                    "", "", "", "",  # zurzeit keine weiteren Details
                    self.kandGebNr, ""  # zurzeit keine Listeninformationen
                ))

@dataclass
class Wahlergebnisse:
    bezirke_csv: str
    file_timestamp: str
    datum: str
    wahlName: str
    wahlBehoerdeGS: str

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName.replace("/", "-")}_Wahlergebnisse_V0-3_{self.file_timestamp.replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            orig_head = next(reader(self.bezirke_csv.splitlines(), delimiter=';'))
            zahlen = [h for h in orig_head if h[0].isupper()]
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-datum", "wahl-name",
                "bezirk-nr", "bezirk-name", "zeitstempel-erfassung", 
                *zahlen
            ))
            for ergebnis in DictReader(self.bezirke_csv.splitlines(), delimiter=';'):
                csvw.writerow((
                    "0.3", self.wahlBehoerdeGS, self.datum, self.wahlName,
                    ergebnis['gebiet-nr'], ergebnis['gebiet-name'], self.file_timestamp,  # timestamp nicht in bisheriger csv enthalten?
                    *[(v if v != '' else 0) for k, v in ergebnis.items() if k in zahlen]
                ))

# Grundkonfiguration
wahlBehoerdeGS = "00000000"
wahlBehoerdeName = ""
kandGebBez = ""
kandGebNr = ""
kandGebBezName = ""
# Die Werte werden nur in die csv geschrieben und nicht für den Abruf oder so genutzt. TODO: mehr automatisch ermitteln

# Hagen Bundestagswahl 2021 - aktualisierte Linkstruktur
wahlBehoerdeGS = "05914000"
wahlBehoerdeName = "Stadt Hagen"
base = f"https://wahlergebnisse.stadt-hagen.de/prod/BW2021/05914000/"
api_base = f"{base}daten/api/"
pr_base = f"{base}praesentation/"
opendata_base = f"{base}daten/opendata/"
opendata_json_base = opendata_base
# Muss dem Namen einer Ebene entsprechen. Die Ebene muss ggf. manuell hinzugefügt werden
# In diesem Beispiel wird es falsch ermittelt: "Gemeinden (Wahlkreis 138)" hat nix damit zu tun. Es gibt aber Gebietsverlinkung Wahlkreis..?
# Die Lösung lautet also, manuell in der Wahlparameter-Datei die Ebene 3 umzubenenennen in Wahlkreis und hier entsprechend zu nennen:
kandGebBez = "Wahlkreis"
# Wenn es mehrere im betrachteten Gebiet gäbe, müssten wir natürlich besser unterscheiden.
kandGebNr = "138"
# Wie schrecklich! kandidat-gebiet-bezeichnung gibt es im Standard zwei Mal.
kandGebBezName = "138 Hagen - Ennepe-Ruhr-Kreis I"
# Noch nicht (nichtmal manuell) hier berücksichtigt: Wenn es unterschiedliche Stimmzettel gibt, wie bei Bezirksvertretungswahl. Oben als TODO markiert und stets leer.

# Karlsruhe Bundestagswahl 2021
# wahlBehoerdeGS = "08212000"
# wahlBehoerdeName = "Stadt Karlsruhe"
# base = f"https://wahlergebnisse.komm.one/lb/produktion/wahltermin-20210926/08212000/"
# api_base = f"{base}api/praesentation/"
# pr_base = f"{base}praesentation/"
# opendata_base = pr_base
# opendata_json_base = api_base
# # In diesem Fall gibt es weder Gebietsverlinkung, noch fragwürdige Übersichtsebene.
# # Das heißt der manuelle Eingriff der hier erforderlich wird ist eine Ebene 3 zu jeder Gebietseinteilung hinzuzufügen (Nummer und Name vom Wahlkreis sind ja eh alle gleich)
# kandGebBez = "Wahlkreis"
# kandGebNr = "271"
# kandGebBezName = "271 Karlsruhe-Stadt"

filter_wahl_ids = {}

# Welche Wahlen gibt es?
termin_url = f"{api_base}termin.json"
# Achtung: mehrere Objekte mit gleicher ID kann es hier geben, weil Erst- und Zweitstimmen im Frontend getrennt werden, es sich aber um die gleiche Wahl handelt
termin = r_json(termin_url)

wahl_objs = []
for wahleintrag in termin['wahleintraege']:
    if (wahl := wahleintrag['wahl']) not in wahl_objs: wahl_objs.append(wahl)

wahlen = []
for wahl_obj in wahl_objs:
    wahl_id = wahl_obj['id']
    if filter_wahl_ids and wahl_id not in filter_wahl_ids: continue
    wahl_base = f"{api_base}wahl_{wahl_id}/"
    
    # Wahlparameter-Datei
    wahl_url = f"{wahl_base}wahl.json"
    wahl_json = r_json(wahl_url)
    wahlparameter = Wahlparameter(wahl_json, termin, wahlBehoerdeGS, wahlBehoerdeName, kandGebBez)
    if (gge := wahl_json.get('geografik_ebenen')):
        print(f"INFO: Ebenen mit GeoGrafik: {', '.join(map(lambda _: f'ebene_{_}', gge))}")
        for ggei in gge:
            try:
                print(f"Download GeoGrafik GeoJSON ebene_{ggei}")
                gg_r = r_simple(f"{wahl_base}geografik_ebene_{ggei}.json")
                with open(f"./{wahlparameter.wahlBehoerdeGS}_{wahlparameter.data.get('datum') or wahlparameter.termin.get('datum')}_{wahlparameter.wahlName.replace("/", "-")}_ebene_{ggei}.geojson",  "w") as f:
                    f.write(gg_r.text)
            except:
                print("Download fehlgeschlagen, fahre fort")

    # Wahlgebietseinteilungen-Datei
    uebersicht_url = f"{wahl_base}uebersicht_{wahlparameter.niedrigsteEbeneID}_0.json"  # hier wird generell die 0 verwendet, da uns die genaue Art der Stimmen erstmal egal ist
    uebersicht_json = r_json(uebersicht_url)
    gebiete_ts = uebersicht_json.get('file_timestamp') or uebersicht_json.get('zeitstempel')
    bezirke_data = {}
    for zeile in uebersicht_json['tabelle']['zeilen']:
        if not zeile['stimmbezirk']: continue
        if zeile.get('link') is None:
            print(f"keine Daten / Link für {zeile['label']}, wird komplett ignoriert!")
        else:
            bezirk_id = zeile['link']['id']
            assert bezirk_id not in bezirke_data
            bezirke_data[bezirk_id] = {'name': zeile['label'] or zeile['link'].get('title')}
    for bezirk_id, bezirk_dict in bezirke_data.items():
        bezirk_url = f"{wahl_base}ergebnis_{bezirk_id}_0.json"  # erneut einfach nur die 0
        bezirk_json = r_json(bezirk_url)
        bezirk_dict['data'] = bezirk_json
    wahlgebietseinteilungen = Wahlgebietseinteilungen(
        uebersicht_json, bezirke_data, datum=wahl_json.get('datum') or termin.get('datum'),
        wahlName=wahlparameter.wahlName, wahlBehoerdeGS=wahlBehoerdeGS, wahlLeiterGS=wahlBehoerdeGS, wahlLeiterName=wahlBehoerdeName,
        kandGebNr=kandGebNr, kandGebBez=kandGebBezName,
    )

    # Stimmzettel-Datei
    # Unterscheidung: Falls mehrere Stimmentypen, nehme die mit Namen Zweitstimme oder die die als zweites kommt, ansonsten nimm die eine
    stimmentypen = wahl_json['stimmentypen']
    type_partei = 0
    if len(stimmentypen) > 1:
        for st in stimmentypen:
            if st['titel'] == 'Zweitstimmen':
                type_partei = st['id']
                break
        else:
            print('Annahme: Stimmentyp 1 ist Zweitstimme')
            type_partei = 1
    # Quelle: erstes Gebiet, statt open_data.json, da mehr Informationsgehalt
    stimmzettel_url = f"{wahl_base}ergebnis_{next(iter(bezirke_data.keys()))}_{type_partei}.json"
    stimmzettel_json = r_json(stimmzettel_url)
    stimmzettel = Stimmzettel(stimmzettel_json, datum=wahl_json.get('datum') or termin.get('datum'), wahlName=wahlparameter.wahlName, alt_ts=uebersicht_json.get('file_timestamp') or uebersicht_json.get('zeitstempel'), wahlBehoerdeGS=wahlBehoerdeGS)
    # Achtung: Das Stimmzettelobjekt wird von den Kandidaturen ggf. beeinflusst

    # Kandidaten-Datei (ohne Liste)
    # Unterscheidung: Erstmal nur, wenn mehrere Stimmentypen, dann nehme die mit Namen Erststimme oder die, die als erstes kommt.
    kandidaturen = None
    if len(stimmentypen) > 1:
        type_kandidatur = 0
        for st in stimmentypen:
            if st['titel'] == 'Erststimmen':
                type_kandidatur = st['id']
                break
        else:
            print('Annahme: Stimmentyp 0 ist Erststimme')
        # Quelle: erstes Gebiet
        kandidaturen_url = f"{wahl_base}ergebnis_{next(iter(bezirke_data.keys()))}_{type_kandidatur}.json"
        kandidaturen_json = r_json(kandidaturen_url)
        kandidaturen = Kandidaturen(kandidaturen_json, stimmzettel, datum=wahl_json.get('datum') or termin.get('datum'), wahlName=wahlparameter.wahlName, wahlBehoerdeGS=wahlBehoerdeGS, kandGebNr=kandGebNr)

    # Wahlergebnisse-Datei
    # Quelle: open_data.json
    opendata_url = f"{opendata_json_base}open_data.json"
    opendata_json = r_json(opendata_url)
    wahl_csv_url = None
    try:
        wahl_csv_url = [c for c in opendata_json['csvs'] if c['wahl'] == wahl_json['titel']][-1]['url']
    except IndexError:
        for i, c in enumerate(opendata_json['csvs']):
            print(f"[{i}]: {c['wahl']} - {c['ebene']}")
        print(f"Zuordnung Ergebnisdatei fehlgeschlagen für Wahl mit Namen: {wahl_json['titel']}")
        while not wahl_csv_url:
            try:
                selected_i = int(input("Bitte Zahl für richtige Datei (niedrigste Ebene z. B. Stimmbezirk) angeben: "))
                wahl_csv_url = opendata_json['csvs'][selected_i]['url']
            except:
                print("Bitte erneut versuchen, nur Zahl eingeben")
    bezirke_csv_url = opendata_base + wahl_csv_url
    bezirke_csv_r = r_get(bezirke_csv_url)
    bezirke_csv_r.raise_for_status()
    bezirke_csv = bezirke_csv_r.content.decode('utf-8')
    wahlergebnisse = Wahlergebnisse(bezirke_csv, file_timestamp=opendata_json.get('file_timestamp') or uebersicht_json.get('file_timestamp') or uebersicht_json.get('zeitstempel'), datum=wahl_json.get('datum') or termin.get('datum'), wahlName=wahlparameter.wahlName, wahlBehoerdeGS=wahlBehoerdeGS)

    wahl = Wahl(
        wahlparameter=wahlparameter,
        wahlgebietseinteilungen=wahlgebietseinteilungen,
        stimmzettel=stimmzettel,
        kandidaturen=kandidaturen,
        wahlergebnisse=wahlergebnisse
    )
    wahl.writeOWDcsv()
    wahlen.append(wahl)
