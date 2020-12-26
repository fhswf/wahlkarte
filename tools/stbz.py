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
    stadtbezirk: str = ""
    wahlbezirk: str = ""
    wahlbezirk_name: str = ""
    wahlbezirk_url: str = ""

    @property
    def nr(self) -> str:
        # return self.name.split(" ")[0]
        return ''.join(_ for _ in self.name if _.isdigit())

    def row(self) -> Tuple[Any]:
        return (self.nr, self.name, self.url, self.stadtbezirk, self.wahlbezirk, self.wahlbezirk_name, self.wahlbezirk_url)

    @staticmethod
    def writecsv(outpath: str, stimmbezirke: List[Stimmbezirk]) -> None:
        with open(outpath, "w", newline="", encoding="utf-8") as csvf:
            csvw = writer(csvf, delimiter=";")
            csvw.writerow(("Stimmbezirk", "S_Name", "S_URL", "Stadtbezirk", "Wahlbezirk", "W_Name", "W_URL"))
            csvw.writerows((sb.row() for sb in stimmbezirke))

    @property
    def stadtbezirkNr(self) -> str:
        '''...?'''
        return {
            'Hagen-Mitte': '1',
            'Hagen-Nord': '2',
            'Hohenlimburg': '3',
            'Eilpe/Dahl': '4',
            'Haspe': '5'
        }.get(self.stadtbezirk) or ''

    @property
    def art(self) -> str:
        '''...?'''
        return 'B' if 'Briefwahl' in self.name else 'U'

    def OWDrow(self) -> Tuple[Any]:
        return (
            "", "",
            "", "",
            self.stadtbezirkNr, self.stadtbezirk,
            self.wahlbezirk, self.wahlbezirk_name,
            self.nr, self.name, self.art,
            "",
            self.wahlbezirk, self.wahlbezirk_name,
            "",""
        )

    @staticmethod
    def writeOWDcsv(outpath: str, stimmbezirke: List[Stimmbezirk]) -> None:
        '''
        Output passend zur Ratswahl (Bezirk=Stimmbezirk, 2=Wahlbezirk, 3=Stadtbezirk),
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

base_url = "http://www.wahlergebnisse.stadt-hagen.de/prod/KW2020/05914000/html5/"
stbz_path = "Ratswahl_NRW_205_Uebersicht_stbz.html"
outpath = "./scrape-stimmbezirke.csv"

r = r_get(base_url + stbz_path)
r.raise_for_status()

soup = BS(r.text, features="html.parser")

assert len(soup.findAll("table")) == 1
table = soup.find("table")

# alle ersten td finden -> Stimmbezirk-Name & URL
td0s = [tr.find('td') for tr in table.find('tbody').findAll('tr')]

# letzten Eintrag (Gemeinde/Gesamtergebnis) entfernen
if "Gemeinde" in str(td0s[-1]):
    del td0s[-1]
else:
    print("Achtung: Letzter Tabelleneintrag _kein_ Gemeinde-Link?")

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

    a_stadtbezirk = sb_soup.find(lambda x:
        x.name == 'div'
        and x.has_attr('class')
        and "card" in x['class']
        and (_h := x.find("div", class_="card-header"))
        and _h.text == "Stadtbezirk"
    ).find('a')

    a_wahlbezirk = sb_soup.find(lambda x:
        x.name == 'div'
        and x.has_attr('class')
        and "card" in x['class']
        and (_h := x.find("div", class_="card-header"))
        and _h.text == "Wahlbezirk"
    ).find('a')

    return (
        a_stadtbezirk.text,
        a_wahlbezirk.text,
        a_wahlbezirk['title'],
        (base_url + a_wahlbezirk['href'])
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
            sb.stadtbezirk = result[0]
            sb.wahlbezirk = result[1]
            sb.wahlbezirk_name = result[2]
            sb.wahlbezirk_url = result[3]

Stimmbezirk.writecsv(outpath, stimmbezirke)
# Stimmbezirk.writeOWDcsv(outpath, stimmbezirke)

