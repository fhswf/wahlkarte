/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import type { GesamtWahlConfigType, WahlTerminConfigType } from './wahl-controller';
import type { EbeneConfigType } from './wahl-lib/wahl';
import { ErgebnisKommunalwahlNRW, ErgebnisKommunalwahlBW, ErgebnisLandtagswahlBW, ErgebnisBuergerentscheid, ErgebnisBundestagswahl } from './wahl-lib/ergebnis';

/* -------------------------------------------------------------------------- */
/*                                 Wahltermine                                */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- Hagen --------------------------------- */

let ebenenHagenKWahl: Map<string, EbeneConfigType> = new Map([
    ["Stimmbezirk", {
        geoJson: "wahlbezirke_btw2021.json",
        keyProp: "BEZIRKSNUM",
        uniqueId: true
    }],
    ["Wahlbezirk", {
        geoJson: "wahlbezirke.geojson",
        keyProp: "Wahlbezirk",
        uniqueId: true
    }],
    ["Stadtbezirk", {
        geoJson: "stadtbezirke.geojson",
        keyProp: "Bez_Nr",
        uniqueId: true
    }],
]);

let wahlTerminHagenKWahl: WahlTerminConfigType = {
    name: "Hagen: Kommunalwahlen 2020",
    baseUrl: "./data/hagen-kommunal2020/",
    // in Zukunft evtl. das hier nur als Standard.
    // Auswahl in UI dann nicht nur zwischen den "wahltermine"n sondern zwischen den Unterpunkten die es so gibt?? So als Tree-Ansicht irgendwie...?
    // Info: Filter ist gerade sowieso deaktiviert!
    wahlDatumStr: "13.09.2020",
    defaultCenter: [51.37, 7.48],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "RVR-Wahl",
            name: "RVR-Wahl", // todo in Daten
            parameterPath: "05914000_20200913_RVR-Wahl_Wahlparameter_V0-2_20201024T191200.csv",
            gebietePath: "05914000_20200913_RVR-Wahl_Wahlgebietseinteilungen_V0-2_20201024T191200.csv",
            stimmzettelPath: "05914000_20200913_RVR-Wahl_Stimmzettel_V0-2_20201024T191200.csv",
            ergebnisPath: "05914000_20200913_RVR-Wahl_Wahlergebnisse_V0-2_20201024T191200.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenHagenKWahl
        },
        {
            displayName: "OB-Wahl",
            name: "OB-Wahl", // todo in Daten
            parameterPath: "05914000_20200913_OB-Wahl_Wahlparameter_V0-2_20201024T191200.csv",
            gebietePath: "05914000_20200913_OB-Wahl_Wahlgebietseinteilungen_V0-2_20201024T191200.csv",
            stimmzettelPath: "05914000_20200913_OB-Wahl_Stimmzettel_V0-2_20201024T191200.csv",
            kandidatPath: "05914000_20200913_OB-Wahl_Kandidaten_V0-2_20201024T191200.csv",
            ergebnisPath: "05914000_20200913_OB-Wahl_Wahlergebnisse_V0-2_20201024T191200.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenHagenKWahl
        },
        {
            displayName: "Ratswahl",
            name: "Ratswahl", // todo in Daten
            parameterPath: "05914000_20200913_Ratswahl_Wahlparameter_V0-2_20201024T191200.csv",
            gebietePath: "05914000_20200913_Ratswahl_Wahlgebietseinteilungen_V0-2_20201024T191200.csv",
            stimmzettelPath: "05914000_20200913_Ratswahl_Stimmzettel_V0-2_20201024T191200.csv",
            kandidatPath: "05914000_20200913_Ratswahl_Kandidaten_V0-2_20201024T191200.csv",
            ergebnisPath: "05914000_20200913_Ratswahl_Wahlergebnisse_V0-2_20201024T191200.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenHagenKWahl
        },
        {
            displayName: "BV-Wahl", // todo in Daten
            name: "BV-Wahl",
            parameterPath: "05914000_20200913_BV-Wahl_Wahlparameter_V0-2_20201024T191200.csv",
            gebietePath: "05914000_20200913_BV-Wahl_Wahlgebietseinteilungen_V0-2_20201024T191200.csv",
            stimmzettelPath: "05914000_20200913_BV-Wahl_Stimmzettel_V0-2_20201024T191200.csv",
            kandidatPath: "05914000_20200913_BV-Wahl_Kandidaten_V0-2_20201024T191200.csv",
            ergebnisPath: "05914000_20200913_BV-Wahl_Wahlergebnisse_V0-2_20201024T191200.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenHagenKWahl
        },
    ]
};

/* ---------------------------------- Hagen BTW ----------------------------- */

let wahlTerminHagenBTW: WahlTerminConfigType = {
    name: "Hagen: Bundestagswahl 2021 (vorl.)",
    baseUrl: "./data/hagen-btw2021/",
    wahlDatumStr: "26.09.2021",
    defaultCenter: [51.37, 7.48],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "Bundestagswahl",
            name: "Bundestagswahl",
            parameterPath: "05914000_20210926_Bundestagswahl_Wahlparameter_V0-3_20210926T232933.csv",
            gebietePath: "05914000_20210926_Bundestagswahl_Wahlgebietseinteilungen_V0-3_20210926T232933.csv",
            stimmzettelPath: "05914000_20210926_Bundestagswahl_Stimmzettel_V0-3_20210926T232933.csv",
            ergebnisPath: "05914000_20210926_Bundestagswahl_Wahlergebnisse_V0-3_20210926T232933.csv",
            kandidatPath: "05914000_20210926_Bundestagswahl_Kandidaten_V0-3_20210926T232933.csv",
            ergebnisType: ErgebnisBundestagswahl,
            ebenen: new Map([
                ["Wahlbezirk", {
                    geoJson: "wahlbezirke_btw2021.json",
                    keyProp: "BEZIRKSNUM",
                    uniqueId: true
                }],
                ["Briefwahlbezirke", {
                    geoJson: "wahlbezirke_btw2021.json",
                    keyProp: "BEZIRKSNUM",
                    virtual: true,
                    virtualField: "BRIEFWAHLBEZIRK-NR", // custom csv field
                    dissolve: true,
                    uniqueId: true
                }],
                ["Stadtbezirk", {
                    geoJson: "stadtbezirke.geojson",
                    keyProp: "BEZEICHNUN",
                    uniqueId: true
                }],
                ["Wahlkreis", {
                    geoJson: undefined,
                    keyProp: undefined,
                    uniqueId: true
                }],
            ])
        },
    ]
};

/* ------------------------ Hagen Europawahl 2019 ---------------------- */

let wahlTerminHagenEU19: WahlTerminConfigType = {
    name: "Hagen: Europawahl 2019",
    baseUrl: "./data/hagen-eu2019/",
    wahlDatumStr: "26.05.2019",
    defaultCenter: [51.37, 7.48],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "Europawahl",
            name: "Europawahl",
            parameterPath: "05914000_20190526_Europawahl_Wahlparameter_V0-3_20210616T092400.csv",
            gebietePath: "05914000_20190526_Europawahl_Wahlgebietseinteilungen_V0-3_20210616T092400.csv",
            stimmzettelPath: "05914000_20190526_Europawahl_Stimmzettel_V0-3_20210616T092400.csv",
            ergebnisPath: "05914000_20190526_Europawahl_Wahlergebnisse_V0-3_20210616T092400.csv",
            ergebnisType: ErgebnisBuergerentscheid,
            ebenen: new Map([
                ["Wahlbezirk", {
                    geoJson: "europawahl-geojson6.geojson",
                    keyProp: "wb_bw_bezirksnummer",
                    uniqueId: true
                }],
                ["Stadtbezirk", {
                    geoJson: "stadtbezirke.geojson",
                    keyProp: "Bez_Nr",
                    uniqueId: true
                }],
            ])
        },
    ]
};

/* ------------------------ Hagen Europawahl 2024 ---------------------- */

let wahlTerminHagenEU24: WahlTerminConfigType = {
    name: "Hagen: Europawahl 2024 (vorl.)",
    baseUrl: "./data/hagen-eu2024/",
    wahlDatumStr: "09.06.2024",
    defaultCenter: [51.37, 7.48],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "Europawahl",
            name: "Europawahl",
            parameterPath: "05914000_09.06.2024_Europawahl_Wahlparameter_V0-3_07.06.2024 090325 728.csv",
            gebietePath: "05914000_09.06.2024_Europawahl_Wahlgebietseinteilungen_V0-3_09.06.2024 231651 762.csv",
            stimmzettelPath: "05914000_09.06.2024_Europawahl_Stimmzettel_V0-3_09.06.2024 231021 892.csv",
            ergebnisPath: "05914000_09.06.2024_Europawahl_Wahlergebnisse_V0-3_07.06.2024 090329 029.csv",
            ergebnisType: ErgebnisBuergerentscheid,
            ebenen: new Map([
                ["Wahlbezirk", {
                    geoJson: "hagen-ew24-geografik_ebene_6.json",
                    keyProp: "BEZIRKSNUM",
                    uniqueId: true
                }],
                /*
                = Kommunalwahlbezirk :)
                  ["Briefwahlbezirk", {
                    geoJson: "hagen-ew24-geografik_ebene_6.json",
                    keyProp: "BEZIRKSNUM",
                    virtual: true,
                    virtualField: "BRIEFWAHLBEZIRK-NR", // custom csv field
                    dissolve: true,
                    uniqueId: true
                }],
                */
                ["Kommunalwahlbezirk", {
                    geoJson: "../hagen-kommunal2020/wahlbezirke.geojson",
                    keyProp: "Wahlbezirk",
                    uniqueId: true
                }],
            ])
        },
    ]
};

/* ------------------------ Göttingen Europawahl + Radentscheide 2024 ---------------------- */

let wahlTerminGoettingenEURad24: WahlTerminConfigType = {
    name: "Göttingen: Europawahl & Radentscheide (noch ohne Briefwahl) 2024 (vorl.)",
    baseUrl: "./data/goettingen-eu-rad-2024/",
    wahlDatumStr: "09.06.2024",
    defaultCenter: [51.54, 9.92],
    defaultZoom: 13,
    wahlen: [
        {
            displayName: "Europawahl",
            name: "Europawahl",
            parameterPath: "03159016_09.06.2024_Europawahl_Wahlparameter_V0-3_09.06.2024 171212 063.csv",
            gebietePath: "03159016_09.06.2024_Europawahl_Wahlgebietseinteilungen_V0-3_09.06.2024 214437 637.csv",
            stimmzettelPath: "03159016_09.06.2024_Europawahl_Stimmzettel_V0-3_09.06.2024 192832 413.csv",
            ergebnisPath: "03159016_09.06.2024_Europawahl_Wahlergebnisse_V0-3_09.06.2024 171213 210.csv",
            ergebnisType: ErgebnisBuergerentscheid,
            ebenen: new Map([
                ["Wahlbezirke", {
                    geoJson: "goettingen-wahlbezirke-filtered.geojson",
                    keyProp: "WBEZ",
                    uniqueId: true
                }],
                ["Briefwahlbezirke", {
                    geoJson: "goettingen-wahlbezirke-filtered.geojson",
                    keyProp: "WBEZ",
                    virtual: true,
                    virtualField: "BRIEFWAHLBEZIRK-NR", // custom csv field
                    dissolve: true,
                    uniqueId: true
                }],
            ])
        },
        {
            displayName: "Radentscheid I - Allgemeine Strategien",
            name: "„Radentscheid I - Allgemeine Strategien“",
            parameterPath: "03159016_09.06.2024_„Radentscheid I - Allgemeine Strategien“_Wahlparameter_V0-3_09.06.2024 171212 095.csv",
            gebietePath: "03159016_09.06.2024_„Radentscheid I - Allgemeine Strategien“_Wahlgebietseinteilungen_V0-3_09.06.2024 214843 977.csv",
            stimmzettelPath: "03159016_09.06.2024_„Radentscheid I - Allgemeine Strategien“_Stimmzettel_V0-3_09.06.2024 195503 760.csv",
            ergebnisPath: "03159016_09.06.2024_„Radentscheid I - Allgemeine Strategien“_Wahlergebnisse_V0-3_09.06.2024 171213 210.csv",
            ergebnisType: ErgebnisBuergerentscheid,
            ebenen: new Map([
                ["Wahlbezirke", {
                    geoJson: "goettingen-wahlbezirke-filtered.geojson",
                    keyProp: "WBEZ",
                    uniqueId: true
                }]
            ])
        },
        {
            displayName: "Radentscheid II - Radverkehrsanlagen in der Kernstadt",
            name: "„Radentscheid II - Radverkehrsanlagen in der Kernstadt“",
            parameterPath: "03159016_09.06.2024_„Radentscheid II - Radverkehrsanlagen in der Kernstadt“_Wahlparameter_V0-3_09.06.2024 171212 110.csv",
            gebietePath: "03159016_09.06.2024_„Radentscheid II - Radverkehrsanlagen in der Kernstadt“_Wahlgebietseinteilungen_V0-3_09.06.2024 215039 817.csv",
            stimmzettelPath: "03159016_09.06.2024_„Radentscheid II - Radverkehrsanlagen in der Kernstadt“_Stimmzettel_V0-3_09.06.2024 202650 664.csv",
            ergebnisPath: "03159016_09.06.2024_„Radentscheid II - Radverkehrsanlagen in der Kernstadt“_Wahlergebnisse_V0-3_09.06.2024 171213 210.csv",
            ergebnisType: ErgebnisBuergerentscheid,
            ebenen: new Map([
                ["Wahlbezirke", {
                    geoJson: "goettingen-wahlbezirke-filtered.geojson",
                    keyProp: "WBEZ",
                    uniqueId: true
                }]
            ])
        },
    ]
};

/* ------------------------------- Düsseldorf ------------------------------- */

let ebenenDuesseldorf: Map<string, EbeneConfigType> = new Map([
    ["Stimmbezirk", {
        geoJson: "Stimmbezirke2020_neu_WGS84_EPSG4326.geojson",
        keyProp: "Stimmbezchar",
        uniqueId: true,
    }],
    ["Wahlbezirk", {
        geoJson: "Kommunalwahlbezirke_WGS84_4326_Stand2020_B.geojson",
        keyProp: "KommunalwahlbezirkFix", // zero padding to a length of 3!!!
        uniqueId: true,
    }],
    ["Stadtteil", {
        geoJson: "Stadtteile_WGS84_4326.geojson",
        keyProp: "Stadtteil",
        uniqueId: true,
    }],
    ["Stadtbezirk", {
        geoJson: "Stadtbezirke_WGS84_4326.geojson",
        keyProp: "STADTBEZIRK",
        uniqueId: true,
    }],
]);

let wahlTerminDuesseldorfKWahl: WahlTerminConfigType = {
    name: "Düsseldorf: Kommunalwahlen 2020",
    baseUrl: "./data/duesseldorf-kommunal2020/",
    wahlDatumStr: "13.09.2020",
    defaultCenter: [51.245, 6.793],
    defaultZoom: 11.5,
    wahlen: [
        {
            displayName: "OB-Wahl",
            name: "Oberbürgermeisterwahl NRW",
            parameterPath: "05111000_20200913_Oberbuergermeisterwahl-NRW_Wahlparameter_V0-3_20200930T111111.csv",
            gebietePath: "05111000_20200913_Oberbuergermeisterwahl-NRW_Wahlgebietseinteilungen_V0-3_20200930T111111.csv",
            stimmzettelPath: "05111000_20200913_Oberbuergermeisterwahl-NRW_Stimmzettel_V0-3_20200930T111111.csv",
            kandidatPath: "05111000_20200913_Oberbuergermeisterwahl-NRW_Kandidaten_V0-3_20200930T111111.csv",
            ergebnisPath: "05111000_20200913_Oberbuergermeisterwahl-NRW_Wahlergebnisse_V0-3_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenDuesseldorf
        },
        {
            displayName: "Ratswahl",
            name: "Ratswahl NRW",
            parameterPath: "05111000_20200913_Ratswahl-NRW_Wahlparameter_V0-3_20200930T111111.csv",
            gebietePath: "05111000_20200913_Ratswahl-NRW_Wahlgebietseinteilungen_V0-3_20200930T111111.csv",
            stimmzettelPath: "05111000_20200913_Ratswahl-NRW_Stimmzettel_V0-3_20200930T111111.csv",
            kandidatPath: "05111000_20200913_Ratswahl-NRW_Kandidaten_V0-3_20200930T111111.csv",
            ergebnisPath: "05111000_20200913_Ratswahl-NRW_Wahlergebnisse_V0-3_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenDuesseldorf
        },
        {
            displayName: "BV-Wahl",
            name: "Bezirksvertretungswahl NRW",
            parameterPath: "05111000_20200913_Bezirksvertretungswahl-NRW_Wahlparameter_V0-3_20200930T111111.csv",
            gebietePath: "05111000_20200913_Bezirksvertretungswahl-NRW_Wahlgebietseinteilungen_V0-3_20200930T111111.csv",
            stimmzettelPath: "05111000_20200913_Bezirksvertretungswahl-NRW_Stimmzettel_V0-3_20200930T111111.csv",
            kandidatPath: "05111000_20200913_Bezirksvertretungswahl-NRW_Kandidaten_V0-3_20200930T111111.csv",
            ergebnisPath: "05111000_20200913_Bezirksvertretungswahl-NRW_Wahlergebnisse_V0-3_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenDuesseldorf
        },
        {
            displayName: "OB-Stichwahl",
            name: "Oberbürgermeisterstichwahl NRW",
            parameterPath: "05111000_20200927_Oberbuergermeisterstichwahl-NRW_Wahlparameter_V0-3_20200930T111111.csv",
            gebietePath: "05111000_20200927_Oberbuergermeisterstichwahl-NRW_Wahlgebietseinteilungen_V0-3_20200930T111111.csv",
            stimmzettelPath: "05111000_20200927_Oberbuergermeisterstichwahl-NRW_Stimmzettel_V0-3_20200930T111111.csv",
            kandidatPath: "05111000_20200927_Oberbuergermeisterstichwahl-NRW_Kandidaten_V0-3_20200930T111111.csv",
            ergebnisPath: "05111000_20200927_Oberbuergermeisterstichwahl-NRW_Wahlergebnisse_V0-3_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenDuesseldorf
        },
    ]
};

/* -------------------------------- Wiesbaden ------------------------------- */

let wahlTerminWiesbadenCitybahn: WahlTerminConfigType = {
    name: "Wiesbaden: Bürgerentscheid",
    baseUrl: "./data/wiesbaden-citybahn/",
    wahlDatumStr: "01.11.2020",
    defaultCenter: [50.07, 8.25],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "Citybahn",
            name: "Citybahn", // todo in Daten
            parameterPath: "06414000_20201101_Citybahn_Wahlparameter_V0-2_20201104T113000.csv",
            gebietePath: "06414000_20201101_Citybahn_Wahlgebietseinteilungen_V0-2_20201104T113000.csv",
            stimmzettelPath: "06414000_20201101_Citybahn_Stimmzettel_V0-2_20201104T113000.csv",
            ergebnisPath: "06414000_20201101_Citybahn_Wahlergebnisse_V0-2_20201104T113000.csv",
            ergebnisType: ErgebnisBuergerentscheid,
            ebenen: new Map([
                ["Wahlbezirk", {
                    geoJson: "wiesbaden-wahlbezirke.geojson",
                    keyProp: "objectid",
                    uniqueId: true
                }],
                ["Ortsbezirk", {
                    geoJson: "wiesbaden-ortsbezirke.geojson",
                    keyProp: "gebietsname",
                    uniqueId: true
                }],
            ])
        },
    ]
};

/* ---------------------------- Kreis Euskirchen ---------------------------- */


let ebenenKreisEuskirchen: Map<string, EbeneConfigType> = new Map([
    ["Stimmbezirk", {
        geoJson: undefined,
        keyProp: undefined,
        gsProp: undefined,
        uniqueId: false
    }],
    ["Wahlbezirk", {
        geoJson: "wahlbezirke.geojson",
        keyProp: "strnr",
        gsProp: "ags",
        uniqueId: false
    }],
    ["Kreiswahlbezirk", {
        geoJson: "kreiswahlbezirke.geojson",
        keyProp: "padnr",
        uniqueId: true
    }],
]);

let wahlTerminKrEuskirchenKWahl: WahlTerminConfigType = {
    name: "Kreis Euskirchen 2020",
    baseUrl: "./data/kreis-euskirchen-2020/",
    // Info: Filter ist gerade sowieso deaktiviert!
    wahlDatumStr: "13.09.2020",
    defaultCenter: [50.565, 6.5],
    defaultZoom: 10,
    wahlen: [
        {
            displayName: "Kreistagswahl",
            name: "Kreistagswahl NRW",
            parameterPath: "05366000_20200913_Kreistagswahl-NRW_Wahlparameter_V0-2_20200913T111111.csv",
            gebietePath: "05366000_20200913_Kreistagswahl-NRW_Wahlgebietseinteilungen_V0-2_20200930T111111.csv",
            stimmzettelPath: "05366000_20200913_Kreistagswahl-NRW_Stimmzettel_V0-2_20200930T111111.csv",
            kandidatPath: "05366000_20200913_Kreistagswahl-NRW_Kandidaten_V0-2_20200930T111111.csv",
            ergebnisPath: "05366000_20200913_Kreistagswahl-NRW_Wahlergebnisse_V0-2_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenKreisEuskirchen
        },
        {
            displayName: "Landratswahl",
            name: "Landratswahl NRW",
            parameterPath: "05366000_20200913_Landratswahl-NRW_Wahlparameter_V0-2_20200913T111111.csv",
            gebietePath: "05366000_20200913_Landratswahl-NRW_Wahlgebietseinteilungen_V0-2_20200930T111111.csv",
            stimmzettelPath: "05366000_20200913_Landratswahl-NRW_Stimmzettel_V0-2_20200930T111111.csv",
            kandidatPath: "05366000_20200913_Landratswahl-NRW_Kandidaten_V0-2_20200930T111111.csv",
            ergebnisPath: "05366000_20200913_Landratswahl-NRW_Wahlergebnisse_V0-2_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenKreisEuskirchen
        },
        {
            displayName: "Landratsstichwahl",
            name: "Landratsstichwahl NRW",
            parameterPath: "05366000_20200927_Landratsstichwahl-NRW_Wahlparameter_V0-2_20200913T111111.csv",
            gebietePath: "05366000_20200927_Landratsstichwahl-NRW_Wahlgebietseinteilungen_V0-2_20200930T111111.csv",
            stimmzettelPath: "05366000_20200927_Landratsstichwahl-NRW_Stimmzettel_V0-2_20200930T111111.csv",
            kandidatPath: "05366000_20200927_Landratsstichwahl-NRW_Kandidaten_V0-2_20200930T111111.csv",
            ergebnisPath: "05366000_20200927_Landratsstichwahl-NRW_Wahlergebnisse_V0-2_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenKreisEuskirchen
        },
    ]
};

/* ---------------------------- Bad Münstereifel ---------------------------- */

let ebenenBadM: Map<string, EbeneConfigType> = new Map([
    ["Stimmbezirk", {
        geoJson: "wahlbezirke.geojson",
        keyProp: "1zu1-stimmbezirk",
        uniqueId: true
    }],
    ["Wahlbezirk", {
        geoJson: "wahlbezirke.geojson",
        keyProp: "NUMMER",
        uniqueId: true
    }],
    ["Stadtteil", {
        geoJson: "stadtteile.geojson",
        keyProp: "Stadtteil",
        uniqueId: true
    }],
]);

let wahlTerminBadMuenstereifelKWahl: WahlTerminConfigType = {
    name: "Bad Münstereifel: Kommunalwahlen 2020",
    baseUrl: "./data/badmuenstereifel-kommunal2020/",
    wahlDatumStr: "13.09.2020",
    defaultCenter: [50.54, 6.77],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "Bürgermeisterwahl",
            name: "Bürgermeisterwahl NRW",
            parameterPath: "05366004_20200913_Buergermeisterwahl-NRW_Wahlparameter_V0-2_20200913T111111.csv",
            gebietePath: "05366004_20200913_Buergermeisterwahl-NRW_Wahlgebietseinteilungen_V0-2_20200930T111111.csv",
            stimmzettelPath: "05366004_20200913_Buergermeisterwahl-NRW_Stimmzettel_V0-2_20200930T111111.csv",
            kandidatPath: "05366004_20200913_Buergermeisterwahl-NRW_Kandidaten_V0-2_20200930T111111.csv",
            ergebnisPath: "05366004_20200913_Buergermeisterwahl-NRW_Wahlergebnisse_V0-2_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenBadM
        },
        {
            displayName: "Ratswahl",
            name: "Ratswahl NRW",
            parameterPath: "05366004_20200913_Ratswahl-NRW_Wahlparameter_V0-2_20200930T111111.csv",
            gebietePath: "05366004_20200913_Ratswahl-NRW_Wahlgebietseinteilungen_V0-2_20200930T111111.csv",
            stimmzettelPath: "05366004_20200913_Ratswahl-NRW_Stimmzettel_V0-2_20200930T111111.csv",
            kandidatPath: "05366004_20200913_Ratswahl-NRW_Kandidaten_V0-2_20200930T111111.csv",
            ergebnisPath: "05366004_20200913_Ratswahl-NRW_Wahlergebnisse_V0-2_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: ebenenBadM
        },
    ]
};

/* ---------------------------------- Kall ---------------------------------- */

let wahlTerminKallKWahl: WahlTerminConfigType = {
    name: "Kall: Ratswahl 2020",
    baseUrl: "./data/kall-kommunal2020/",
    wahlDatumStr: "13.09.2020",
    defaultCenter: [50.52, 6.55],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "Ratswahl",
            name: "Ratswahl NRW",
            parameterPath: "05366024_20200913_Ratswahl-NRW_Wahlparameter_V0-2_20200930T111111.csv",
            gebietePath: "05366024_20200913_Ratswahl-NRW_Wahlgebietseinteilungen_V0-2_20200930T111111.csv",
            stimmzettelPath: "05366024_20200913_Ratswahl-NRW_Stimmzettel_V0-2_20200930T111111.csv",
            kandidatPath: "05366024_20200913_Ratswahl-NRW_Kandidaten_V0-2_20200930T111111.csv",
            ergebnisPath: "05366024_20200913_Ratswahl-NRW_Wahlergebnisse_V0-2_20200930T111111.csv",
            ergebnisType: ErgebnisKommunalwahlNRW,
            ebenen: new Map([
                ["Stimmbezirk", {
                    geoJson: undefined,
                    keyProp: undefined,
                    uniqueId: true
                }],
                ["Wahlbezirk", {
                    geoJson: "wahlbezirke.geojson",
                    keyProp: "NUMMER",
                    uniqueId: true
                }],
            ])
        },
    ]
};

/* ------------------------------- Karlsruhe ------------------------------- */

let wahlTerminKarlsruheLandtag: WahlTerminConfigType = {
    name: "Karlsruhe: Landtagswahl 2021",
    baseUrl: "./data/karlsruhe-ltw2021",
    wahlDatumStr: "14.03.2021",
    defaultCenter: [49.00844, 8.40897],
    defaultZoom: 12.8,
    wahlen: [
        {
            displayName: "Landtagswahl",
            name: "Landtagswahl BW 2021",
            parameterPath: "08212000_20210314_Landtagswahl-BW-2021_Wahlparameter_V0-3_20210427T000000.csv",
            gebietePath: "08212000_20210314_Landtagswahl-BW-2021_Wahlgebietseinteilungen_V0-3_20210427T000000.csv",
            stimmzettelPath: "08212000_20210314_Landtagswahl-BW-2021_Stimmzettel_V0-3_20210427T000000.csv",
            kandidatPath: "08212000_20210314_Landtagswahl-BW-2021_Kandidaten_V0-3_20210427T000000.csv",
            ergebnisPath: "08212000_20210314_Landtagswahl-BW-2021_Wahlergebnisse_V0-3_20210427T000000.csv",
            ergebnisType: ErgebnisLandtagswahlBW,
            ebenen: new Map([
                ["Wahlbezirk", {
                    geoJson: "WahlbezirkeLTW2021Karlsruhe.geojson",
                    keyProp: "WahlbezirkPadded",
                    uniqueId: true,
                }],
                ["Stadtteil", {
                    geoJson: "ka_stadtteile.geojson",
                    keyProp: "Stadtteilname",
                    uniqueId: true,
                }],
                ["Wahlkreis", {
                    geoJson: "WahlkreiseLTW2021Karlsruhe.geojson",
                    keyProp: "Wahlkreis",
                    uniqueId: true,
                }],
            ]),
        },
    ]
};

let wahlTerminKarlsruheBTW: WahlTerminConfigType = {
    name: "Karlsruhe: Bundestagswahl 2021 (vorl.)",
    baseUrl: "./data/karlsruhe-btw2021",
    wahlDatumStr: "26.09.2021",
    defaultCenter: [49.00844, 8.40897],
    defaultZoom: 12.8,
    wahlen: [
        {
            displayName: "Bundestagswahl",
            name: "Bundestagswahl",
            parameterPath: "08212000_20210926_Bundestagswahl_Wahlparameter_V0-3_20210926T100308.csv",
            gebietePath: "08212000_20210926_Bundestagswahl_Wahlgebietseinteilungen_V0-3_20210926T232046.csv",
            stimmzettelPath: "08212000_20210926_Bundestagswahl_Stimmzettel_V0-3_20210926T193948.csv",
            kandidatPath: "08212000_20210926_Bundestagswahl_Kandidaten_V0-3_20210926T193948.csv",
            ergebnisPath: "08212000_20210926_Bundestagswahl_Wahlergebnisse_V0-3_20210926T232046.csv",
            ergebnisType: ErgebnisBundestagswahl,
            ebenen: new Map([
                ["Wahlbezirk", {
                    geoJson: "WahlbezirkeLTW2021Karlsruhe.geojson",
                    keyProp: "WahlbezirkPadded",
                    uniqueId: true,
                }],
                ["Stadtteile", {
                    geoJson: "ka_stadtteile.geojson",
                    keyProp: "Stadtteilname",
                    uniqueId: true,
                }],
                ["Wahlkreis", {
                    geoJson: "wahlkreise.geojson",
                    keyProp: "WKR_NR",
                    uniqueId: true,
                }],
            ]),
        },
    ]
};

let wahlTerminKarlsruheEUGemeinderat24: WahlTerminConfigType = {
    name: "Karlsruhe: Europawahl + Gemeinderat 2024 (vorl.)",
    baseUrl: "./data/karlsruhe-eu-gemeinderat-2024/",
    wahlDatumStr: "09.06.2024",
    defaultCenter: [49.00844, 8.40897],
    defaultZoom: 12.8,
    wahlen: [
        {
            displayName: "Europawahl",
            name: "Europawahl 2024",
            parameterPath: "08212000_09.06.2024_Europawahl 2024_Wahlparameter_V0-3_09.06.2024 223824 770.csv",
            gebietePath: "08212000_09.06.2024_Europawahl 2024_Wahlgebietseinteilungen_V0-3_09.06.2024 213827 142.csv",
            stimmzettelPath: "08212000_09.06.2024_Europawahl 2024_Stimmzettel_V0-3_09.06.2024 202811 556.csv",
            ergebnisPath: "08212000_09.06.2024_Europawahl 2024_Wahlergebnisse_V0-3_07.06.2024 114341 521.csv",
            ergebnisType: ErgebnisBuergerentscheid,
            ebenen: new Map([
                ["Wahlbezirke", {
                    geoJson: "../karlsruhe-ltw2021/WahlbezirkeLTW2021Karlsruhe.geojson",
                    keyProp: "WahlbezirkPadded",
                    uniqueId: true
                }],
                ["Stadtteile", {
                    geoJson: "../karlsruhe-btw2021/ka_stadtteile.geojson",
                    keyProp: "Stadtteilname",
                    uniqueId: true
                }],
            ])
        },
        {
            displayName: "Gemeinderatswahl",
            name: "Gemeinderatswahl 2024 Stadt Karlsruhe",
            parameterPath: "08212000_09.06.2024_Gemeinderatswahl 2024 Stadt Karlsruhe_Wahlparameter_V0-3_11.06.2024 190331 662.csv",
            gebietePath: "08212000_09.06.2024_Gemeinderatswahl 2024 Stadt Karlsruhe_Wahlgebietseinteilungen_V0-3_11.06.2024 141608 337.csv",
            stimmzettelPath: "08212000_09.06.2024_Gemeinderatswahl 2024 Stadt Karlsruhe_Stimmzettel_V0-3_11.06.2024 121323 055.csv",
            kandidatPath: "08212000_09.06.2024_Gemeinderatswahl 2024 Stadt Karlsruhe_Kandidaten_V0-3_11.06.2024 121323 055.csv",
            ergebnisPath: "08212000_09.06.2024_Gemeinderatswahl 2024 Stadt Karlsruhe_Wahlergebnisse_V0-3_07.06.2024 114341 521.csv",
            ergebnisType: ErgebnisKommunalwahlBW,
            ebenen: new Map([
                ["Wahlbezirke", {
                    geoJson: "../karlsruhe-ltw2021/WahlbezirkeLTW2021Karlsruhe.geojson",
                    keyProp: "WahlbezirkPadded",
                    uniqueId: true
                }],
                ["Stadtteile", {
                    geoJson: "../karlsruhe-btw2021/ka_stadtteile.geojson",
                    keyProp: "Stadtteilname",
                    uniqueId: true
                }],
            ])
        },
    ]
};


/* -------------------------------------------------------------------------- */
/*                              Exported configs                              */
/* -------------------------------------------------------------------------- */

export var wahlenConfig: GesamtWahlConfigType = {
    wahltermine: [
        wahlTerminHagenEU24,
        wahlTerminGoettingenEURad24,
        wahlTerminKarlsruheEUGemeinderat24,
        wahlTerminKarlsruheBTW,
        wahlTerminHagenBTW,
        wahlTerminHagenKWahl,
        wahlTerminHagenEU19,
        wahlTerminKarlsruheLandtag,
        wahlTerminDuesseldorfKWahl,
        wahlTerminWiesbadenCitybahn,
        wahlTerminKrEuskirchenKWahl,
        wahlTerminBadMuenstereifelKWahl,
        wahlTerminKallKWahl,
    ]
};
