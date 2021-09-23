#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

from __future__ import annotations

from csv import writer, reader, DictReader
from dataclasses import dataclass
from hashlib import md5
from typing import List, Tuple, Any, Dict

from requests import get as r_get

def r_json(url):
    r = r_get(url)
    r.raise_for_status()
    return r.json()

default_wahlName = "Bundestagswahl"

@dataclass
class Wahl:
    wahlparameter: Wahlparameter
    wahlgebietseinteilungen: Wahlgebietseinteilungen
    stimmzettel: Stimmzettel
    kandidaturen: Kandidaturen
    wahlergebnisse: Wahlergebnisse

    def writeOWDcsv(self) -> None:
        for obj in (self.wahlparameter, self.wahlgebietseinteilungen, self.stimmzettel, self.kandidaturen, self.wahlergebnisse):
            if obj: obj.writeOWDcsv()

@dataclass
class Wahlparameter:
    data: Dict[str, Any]
    wahlBehoerdeGS: str = "05914000"
    wahlBehoerdeName: str = "Stadt Hagen"
    wahlName: str = default_wahlName
    kandGebBez: str = "Wahlkreis"
    geb5: str = ""
    geb4: str = ""
    geb3: str = "Wahlkreis"
    geb2: str = "Stadtbezirk"
    bez: str = "Wahlbezirk"

    @property
    def niedrigsteEbeneID(self):
        return self.data['menu_links'][-1]['id']

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.data['datum']}_{self.wahlName}_Wahlparameter_V0-3_{self.data['file_timestamp'].replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-behoerde-name", "wahl-datum", "wahl-name", "wahl-bezeichnung",
                "kandidat-gebiet-bezeichnung", "gebiet-ebene-5-bezeichnung", "gebiet-ebene-4-bezeichnung",
                "gebiet-ebene-3-bezeichnung", "gebiet-ebene-2-bezeichnung", "bezirk-bezeichnung"
            ))
            #geb5 = self.data['menu_links'][-5]['title'] if self.data['menu_links'][-5] else ''
            #geb4 = self.data['menu_links'][-4]['title'] if self.data['menu_links'][-4] else ''
            #geb3 = self.data['menu_links'][-3]['title'] if self.data['menu_links'][-3] else ''
            #geb2 = self.data['menu_links'][-2]['title'] if self.data['menu_links'][-2] else ''
            #bez = self.data['menu_links'][-1]['title']
            csvw.writerow((
                "0.3", self.wahlBehoerdeGS, self.wahlBehoerdeName, self.data['datum'], self.wahlName, self.data['titel'],
                self.kandGebBez, self.geb5, self.geb4, self.geb3, self.geb2, self.bez  # geb5, geb4, geb3, geb2, bez
            ))

@dataclass
class Wahlgebietseinteilungen:
    uebersicht_data: Dict[str, Any]
    bezirke_data: Dict[str, Dict[str, Any]]
    datum: str
    wahlBehoerdeGS: str = "05914000"
    wahlLeiterGS: str = "05914000"
    wahlLeiterName: str = "Stadt Hagen"
    wahlName: str = default_wahlName
    kandGebNr: str = "138"
    kandGebBez: str = "138 Hagen - Ennepe-Ruhr-Kreis I"
    stimmGebNr: str = "138"
    stimmGebBez: str = "138 Hagen - Ennepe-Ruhr-Kreis I"

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName}_Wahlgebietseinteilungen_V0-3_{self.uebersicht_data['file_timestamp'].replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
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
                assert name
                return ''.join(_ for _ in name if _.isdigit()) or name

            for bezirk_id_intern, bezirk_data in self.bezirke_data.items():
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

                bezirk_name = bezirk_data['Komponente']['info']['titel']
                bezirk_id = _name_to_id(bezirk_name)
                briefwahlbezirk_id = bezirk_id
                if (letzte := gebietsverlinkung[-1])['titel'] != "Stimmbezirke":
                    assert len(letzte['gebietslinks']) == 1
                    briefwahlbezirk_id = _name_to_id(letzte['gebietslinks'][0]['title'])

                csvw.writerow((
                    "0.3", self.wahlBehoerdeGS, self.datum, self.wahlName, self.wahlLeiterGS, self.wahlLeiterName,
                    nr_5, name_5, nr_4, name_4, nr_3, name_3, nr_2, name_2,
                    bezirk_id, bezirk_name, briefwahlbezirk_id, "B" if "Briefwahlb" in bezirk_name else "W", "",
                    self.kandGebNr, self.kandGebBez,
                    self.stimmGebNr, self.stimmGebBez
                ))

@dataclass
class Stimmzettel:
    data: Dict[str, Any]
    datum: str
    wahlBehoerdeGS: str = "05914000"
    wahlName: str = default_wahlName
    stimmGebNr: str = "138"
    stimmGebBez: str = "138 Hagen - Ennepe-Ruhr-Kreis I"

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName}_Stimmzettel_V0-3_{self.data['file_timestamp'].replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-datum", "wahl-name",
                "stimmzettel-gebiet-nr", "stimmzettel-gebiet-bezeichnung",
                "stimmzettel-position", "partei-kurzname", "partei-langname", "partei-rgb-wert", "partei-typ"
            ))
            for pos, partei in enumerate(self.data['Komponente']['tabelle']['zeilen'], 1):
                csvw.writerow((
                    "0.3", self.wahlBehoerdeGS, self.datum, self.wahlName,
                    self.stimmGebNr, self.stimmGebBez,
                    pos, partei['label']['labelKurz'], partei['label']['labelLang'], partei['color'], 'E' if "Einzelbewerber" in partei['label']['labelLang'] else 'P'
                ))

@dataclass
class Kandidaturen:
    data: Dict[str, Any]
    stimmzettel_data: Dict[str, Any]
    datum: str
    wahlBehoerdeGS: str = "05914000"
    wahlName: str = default_wahlName
    kandGebNr: str = "138"

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName}_Kandidaten_V0-3_{self.data['file_timestamp'].replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                "version", "wahl-behoerde-gs", "wahl-datum", "wahl-name",
                "partei-kurzname", "partei-langname",
                "kandidat-name", "kandidat-namensvorsatz", "kandidat-vorname",
                "kandidat-akadgrad", "kandidat-geburtsjahr", "kandidat-geschlecht", "kandidat-beruf",
                "kandidat-gebiet-nr", "kandidat-listenplatz"
            ))
            for kandidatur, partei in zip(self.data['Komponente']['tabelle']['zeilen'], self.stimmzettel_data['Komponente']['tabelle']['zeilen']):
                if (kandidatur['zahl'] == '---'): continue
                nachname = kandidatur['label']['labelKurz'].removesuffix(f", {partei['label']['labelKurz']}")
                #if ',' in nachname:  # ausweichlösung
                #    nachname = nachname.split(',')[0]
                vorname = kandidatur['label']['labelLang'].split(nachname if not ' ' in nachname else nachname.split(' ')[1])[0].removeprefix('' if not ' ' in nachname else nachname.split(' ')[0]).strip()
                csvw.writerow((
                    "0.3", self.wahlBehoerdeGS, self.datum, self.wahlName,
                    partei['label']['labelKurz'], partei['label']['labelLang'],
                    nachname, "", vorname,
                    "", "", "", "",  # zurzeit keine weiteren Details
                    self.kandGebNr, ""  # zurzeit keine Listeninformationen
                ))

@dataclass
class Wahlergebnisse:
    bezirke_csv: str
    file_timestamp: str
    datum: str
    wahlBehoerdeGS: str = "05914000"
    wahlName: str = default_wahlName
    kandGebNr: str = "138"

    def writeOWDcsv(self) -> None:
        with open(f"./{self.wahlBehoerdeGS}_{self.datum}_{self.wahlName}_Wahlergebnisse_V0-3_{self.file_timestamp.replace(':', '')}.csv", "w", newline="", encoding="utf-8") as csvf:
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

test = True
base = f"http://wahlergebnisse.stadt-hagen.de/{'test' if test else 'prod'}/BW2021/05914000/"
pr_base = f"{base}praesentation/"
api_base = f"{base}/api/praesentation/"

# Welche Wahlen gibt es?
termin_url = f"{api_base}termin.json"
# Achtung: mehrere Objekte mit gleicher ID kann es hier geben, weil Erst- und Zweitstimmen im Frontend getrennt werden, es sich aber um die gleiche Wahl handelt
termin = r_json(termin_url)

wahl_objs = []
for wahleintrag in termin['wahleintraege']:
    if (wahl := wahleintrag['wahl']) not in wahl_objs: wahl_objs.append(wahl)

wahlen = []
for wahl_obj in wahl_objs:
    wahl_base = f"{api_base}wahl_{wahl_obj['id']}/"
    
    # Wahlparameter-Datei
    wahl_url = f"{wahl_base}wahl.json"
    wahl_json = r_json(wahl_url)
    wahlparameter = Wahlparameter(wahl_json)

    # Wahlgebietseinteilungen-Datei
    uebersicht_url = f"{wahl_base}uebersicht_{wahlparameter.niedrigsteEbeneID}_0.json"  # hier wird generell die 0 verwendet, da uns die genaue Art der Stimmen erstmal egal ist
    uebersicht_json = r_json(uebersicht_url)
    gebiete_ts = uebersicht_json['file_timestamp']
    bezirk_ids = []
    for zeile in uebersicht_json['tabelle']['zeilen']:
        if not zeile['stimmbezirk']: continue
        bezirk_ids.append(zeile['link']['id'])
    bezirke_data = {}
    for bezirk_id in bezirk_ids:
        bezirk_url = f"{wahl_base}ergebnis_{bezirk_id}_0.json"  # erneut einfach nur die 0
        bezirk_json = r_json(bezirk_url)
        bezirke_data[bezirk_id] = bezirk_json
    wahlgebietseinteilungen = Wahlgebietseinteilungen(uebersicht_json, bezirke_data, datum=wahl_json['datum'])

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
    stimmzettel_url = f"{wahl_base}ergebnis_{bezirk_ids[0]}_{type_partei}.json"
    stimmzettel_json = r_json(stimmzettel_url)
    stimmzettel = Stimmzettel(stimmzettel_json, datum=wahl_json['datum'])

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
        kandidaturen_url = f"{wahl_base}ergebnis_{bezirk_ids[0]}_{type_kandidatur}.json"
        kandidaturen_json = r_json(kandidaturen_url)
        kandidaturen = Kandidaturen(kandidaturen_json, stimmzettel_json, datum=wahl_json['datum'])

    # Wahlergebnisse-Datei
    # Quelle: open_data.json
    opendata_url = f"{api_base}open_data.json"
    opendata_json = r_json(opendata_url)
    bezirke_csv_url = pr_base + [c for c in opendata_json['csvs'] if c['wahl'] == wahl_json['titel']][-1]['url']
    bezirke_csv_r = r_get(bezirke_csv_url)
    bezirke_csv_r.raise_for_status()
    bezirke_csv = bezirke_csv_r.content.decode('utf-8')
    wahlergebnisse = Wahlergebnisse(bezirke_csv, file_timestamp=opendata_json['file_timestamp'], datum=wahl_json['datum'])

    wahl = Wahl(
        wahlparameter=wahlparameter,
        wahlgebietseinteilungen=wahlgebietseinteilungen,
        stimmzettel=stimmzettel,
        kandidaturen=kandidaturen,
        wahlergebnisse=wahlergebnisse
    )
    wahl.writeOWDcsv()
    wahlen.append(wahl)
