#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from csv import writer
from dataclasses import dataclass
from typing import List, Tuple, Any

from bs4 import BeautifulSoup as BS
from requests import get as r_get

@dataclass
class Stimmbezirk:
    name: str
    url: str
    wahlkreis: str = ""
    wahlkreis_url: str = ""
    stadtteil: str = ""
    stadtteil_url: str = ""

    @property
    def nr(self) -> str:
        # return self.name.split(" ")[0]
        return ''.join(_ for _ in self.name if _.isdigit())

    @property
    def wahlkreisId(self) -> str:
        '''...?'''
        return self.wahlkreis[10:12]

    @property
    def stadtteilId(self) -> str:
        '''...?'''
        return self.stadtteil

    @property
    def art(self) -> str:
        '''...?'''
        return 'B' if 'Briefwahl' in self.name else 'W'

    def OWDrow(self) -> Tuple[Any]:
        return (
            "", "",
            "", "",
            self.wahlkreisId, self.wahlkreis,
            self.stadtteilId, self.stadtteil,
            self.nr, self.name, self.art,
            "",
            self.wahlkreisId, self.wahlkreis,
            self.wahlkreisId, self.wahlkreis
        )

    @staticmethod
    def writeOWDcsv(outpath: str, stimmbezirke: List[Stimmbezirk]) -> None:
        '''
        Output passend zur Landtagswahl (Bezirk=Wahlbezirk, 2=Stadtteil, 3=Wahlkreis),
        und nur die Kernfelder, die anderen kann man mit einem modernen Editor ergänzen.'''
        with open(outpath, "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow((
                    "gebiet-ebene-5-nr", "gebiet-ebene-5-name",
                    "gebiet-ebene-4-nr", "gebiet-ebene-4-name",
                    "gebiet-ebene-3-nr", "gebiet-ebene-3-name",
                    "gebiet-ebene-2-nr", "gebiet-ebene-2-name",
                    "bezirk-nr", "bezirk-name", "bezirk-art",
                    "bezirk-repräsentativ",
                    "kandidat-gebiet-nr", "kandidat-gebiet-bezeichnung",
                    "stimmzettel-gebiet-nr", "stimmzettel-gebiet-bezeichnung"
            ))
            csvw.writerows((sb.OWDrow() for sb in stimmbezirke))

base_url = "https://wahlergebnisse.komm.one/02/produktion/wahltermin-20210314/08212000/html5/"
stbz_path = "Landtagswahl_BW_2021_Land_BW_172_Uebersicht_stbz.html"
outpath = "./scrape-stbz-karlsruhe.csv"

r = r_get(base_url + stbz_path)
r.raise_for_status()

soup = BS(r.text, features="html.parser")

assert len(soup.findAll("table")) == 1
table = soup.find("table")

# alle ersten td finden -> Stimmbezirk-Name & URL
td0s = [tr.find('td') for tr in table.find('tbody').findAll('tr')]

# letzten Eintrag (Gemeinde/Gesamtergebnis) entfernen
# In Karlsruhe nicht notwendig
#if "Gemeinde" in str(td0s[-1]):
#    del td0s[-1]
#else:
#    print("Achtung: Letzter Tabelleneintrag _kein_ Gemeinde-Link?")

stimmbezirke: List[Stimmbezirk] = list()
for cell in td0s:
    stimmbezirke.append(Stimmbezirk(
        name=cell.text,
        url=base_url + cell.find('a')['href']
    ))

def _sb(sb) -> Tuple[str, str, str, str]:
    sb_r = r_get(sb.url)
    sb_r.raise_for_status()
    sb_soup = BS(sb_r.text, features="html.parser")

    a_wahlkreis = sb_soup.find(lambda x:
        x.name == 'div'
        and x.has_attr('class')
        and "card" in x['class']
        and (_h := x.find("div", class_="card-header"))
        and _h.text == "Wahlkreise"
    ).find('a')

    a_stadtteil = sb_soup.find(lambda x:
        x.name == 'div'
        and x.has_attr('class')
        and "card" in x['class']
        and (_h := x.find("div", class_="card-header"))
        and _h.text == "Stadtteile"
    ).find('a')

    # eventuelle Erweiterung: Briefwahlbezirkszuordnung als inoffizielle Zwischenebene.
    # ---> In KA nicht sichtbar?

    return (
        a_wahlkreis.text,
        (base_url + a_wahlkreis['href']),
        a_stadtteil.text,
        (base_url + a_stadtteil['href'])
    )

with ThreadPoolExecutor(max_workers=10) as tpe:
    fs = {tpe.submit(_sb, sb): sb for sb in stimmbezirke}
    for f in as_completed(fs):
        sb = fs[f]
        try:
            result = f.result()
        except:
            print(f'fail on stimmbezirk {sb}')
        else:
            sb.wahlkreis = result[0]
            sb.wahlkreis_url = result[1]
            sb.stadtteil = result[2]
            sb.stadtteil_url = result[3]

Stimmbezirk.writeOWDcsv(outpath, stimmbezirke)

