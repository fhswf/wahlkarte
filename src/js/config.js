/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import type { GesamtWahlConfigType, WahlTerminConfigType } from './wahl-controller';
import type { EbeneConfigType } from './wahl-lib/wahl';
import { ErgebnisKommunalwahlNRW, ErgebnisLandtagswahlBW, ErgebnisBuergerentscheid, ErgebnisBundestagswahl } from './wahl-lib/ergebnis';

/* -------------------------------------------------------------------------- */
/*                                 Wahltermine                                */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- Hagen --------------------------------- */

let ebenenHagen: Map<string, EbeneConfigType> = new Map([
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
            ebenen: ebenenHagen
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
            ebenen: ebenenHagen
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
            ebenen: ebenenHagen
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
            ebenen: ebenenHagen
        },
    ]
};

/* ---------------------------------- Hagen BTW ----------------------------- */

let wahlTerminHagenBTW: WahlTerminConfigType = {
    name: "Hagen: Bundestagswahl 2021",
    baseUrl: "./data/hagen-btw2021/",
    wahlDatumStr: "26.09.2021",
    defaultCenter: [51.37, 7.48],
    defaultZoom: 12,
    wahlen: [
        {
            displayName: "Bundestagswahl",
            name: "Bundestagswahl",
            parameterPath: "05914000_26.09.2021_Bundestagswahl_Wahlparameter_V0-3_15.09.2021 115820 523.csv",
            gebietePath: "05914000_26.09.2021_Bundestagswahl_Wahlgebietseinteilungen_V0-3_15.09.2021 115907 145.csv",
            stimmzettelPath: "05914000_26.09.2021_Bundestagswahl_Stimmzettel_V0-3_15.09.2021 115904 364.csv",
            ergebnisPath: "05914000_26.09.2021_Bundestagswahl_Wahlergebnisse_V0-3_15.09.2021 115824 226.csv",
            kandidatPath: "05914000_26.09.2021_Bundestagswahl_Kandidaten_V0-3_15.09.2021 115904 364.csv",
            ergebnisType: ErgebnisBundestagswahl,
            ebenen: new Map([
                ["Wahlbezirk", {
                    geoJson: "wahlbezirke_btw2021.json",
                    keyProp: "BEZIRKSNUM",
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

let ebenenKA: Map<string, EbeneConfigType> = new Map([
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
]);

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
            ebenen: ebenenKA
        },
    ]
};


/* -------------------------------------------------------------------------- */
/*                              Exported configs                              */
/* -------------------------------------------------------------------------- */

export var wahlenConfig: GesamtWahlConfigType = {
    wahltermine: [
        wahlTerminHagenBTW,
        wahlTerminHagenKWahl,
        wahlTerminDuesseldorfKWahl,
        wahlTerminWiesbadenCitybahn,
        wahlTerminKrEuskirchenKWahl,
        wahlTerminBadMuenstereifelKWahl,
        wahlTerminKallKWahl,
        wahlTerminKarlsruheLandtag,
    ]
};
