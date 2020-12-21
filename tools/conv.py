#!/usr/bin/env python3.9
# -*- coding: utf-8 -*-

from collections import defaultdict
from csv import reader, writer
from dataclasses import dataclass
from typing import Dict, List, Any, Set, Optional, Tuple

# Key: OpenData-Zuordnungen, Value: OpenData-Hauskoordinaten
replacements = {
    "Friedr.-Gustav-Theis-Weg": "Friedrich-Gustav-Theis-Weg",
    "Geschw.-Scholl-Str.": "Geschwister-Scholl-Str.",
    "Karl-E.-Osthaus-Str.": "Karl-Ernst-Osthaus-Str.",
    "Lievinstr.": "Liévinstr."
}
noconv = [
    "Joh.-Gottlieb-Fichte-Str.",
    "Johann-F.-Oberlin-Str.",
]

@dataclass
class Zuordnung:
    datum: str
    ags: str
    street: str
    nrs: str
    plz: str
    place: str
    bez_id: str

    def __post_init__(self):
        if self.street in replacements:
            self.street = replacements[self.street]
        if self.street.endswith("tr.") and self.street not in noconv:
            self.street = self.street.replace("tr.", "traße")

fpath = "./opendata-strassen.csv"
hausnrpath = "./Hauskoordinaten.csv"
outpath = "./opendata-zuordnung.csv"
zuordnungen: Dict[str, List[Zuordnung]] = defaultdict(list)

# Beispiel:
# {'1021': ['54-60 ger.', '83-95 ung.'],
#  '1014': ['90-100 ger.', '101-116', '120', '122'],
#  '1022': ['43-77 ung.'],
#  '1024': ['19-41'],
#  '1031': ['1-17'],
#  '4201': ['117', '119']}

def check_range(range_: str, check_no: str) -> bool:
    if "-" not in range_:
        return range_ == check_no
    no_numeric = int(''.join(_ for _ in check_no if _.isdigit()))
    if not any(_ in range_ for _ in (" ger.", " ung.")):
        lower, higher = map(int, range_.split("-"))
        return lower <= no_numeric <= higher
    # eigentlich nicht notwendig: even = range_.endswith(" ger.")
    range_ = range_[:-5]
    lower, higher = map(int, range_.split("-"))
    return no_numeric in range(lower, higher + 1, 2)

def check_rangelists(data: Dict[str, List[str]], check_no: str) -> Optional[str]:
    valid: Set[str] = set()
    for bez_id, ranges in data.items():
        for range_ in ranges:
            if check_range(range_, check_no):
                valid.add(bez_id)
    return ",".join(valid) if valid else None

def check(street: str, check_no: str) -> str:
    if street not in zuordnungen:
        return "???Straße"
    str_z = zuordnungen[street]
    if len(str_z) == 1 and str_z[0].nrs == "":
        return str_z[0].bez_id
    bez_ids_ranges: Dict[str, List[str]] = {z.bez_id: z.nrs.split(',') for z in str_z}
    # print(bez_ids_ranges)
    range_result = check_rangelists(bez_ids_ranges, check_no)
    # print(street,check_no,range_result)
    return "???Nummer" if range_result is None else range_result

with open(fpath, "r", encoding="utf-8") as csvf:
    csvr = reader(csvf, delimiter=";")
    next(csvr, None)
    for l in csvr:
        z = Zuordnung(*l)
        zuordnungen[z.street].append(z)

@dataclass
class Hauskoordinate:
    plz: str
    place: str
    street: str
    nr: str
    x: str
    y: str
    bez_id: str = ""

    def row(self) -> Tuple[Any]:
        return (self.plz, self.place, self.street, self.nr, self.x, self.y, self.bez_id)

hauskoordinaten: List[Hauskoordinate] = list()

with open(hausnrpath, "r", encoding="utf-8") as csvf:
    csvr = reader(csvf, delimiter=";")
    next(csvr, None)
    for l in csvr:
        hauskoordinaten.append(Hauskoordinate(
            plz=l[0],
            place=l[1],
            street=l[3],
            nr=l[4]+l[5],
            x=l[13], y=l[14]))

for hk in hauskoordinaten:
    hk.bez_id = check(hk.street, hk.nr)

with open(outpath, "w", newline="", encoding="utf-8") as csvf:
    csvw = writer(csvf, delimiter=";")
    csvw.writerow(("PLZ", "Ort", "Straße", "Hausnummer", "X", "Y", "Stimmbezirk"))
    csvw.writerows((hk.row() for hk in hauskoordinaten))
