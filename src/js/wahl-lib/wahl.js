/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import { fetchCsvToJson } from './utils';
import type { WahlModel } from './model';
import { WahlParameter, WahlGebiet, WahlStimmzettelPartei, WahlKandidat, WahlErgebnis } from './model';
import { ErgebnisAnalysis, ErgebnisAnalysisCollection } from './ergebnis';
import type { Ergebnis } from './ergebnis';

export type EbeneConfigType = {|
    geoJson: ?string,
    keyProp?: string,
    gsProp?: string, // required if not unique id
    uniqueId: boolean,
    virtual?: boolean,
    virtualField?: string, // e. g. custom csv field
    dissolve?: boolean,
|};

export type WahlConfigType = {|
    displayName?: string,
    name: string,
    parameterPath: string,
    gebietePath: string,
    stimmzettelPath: string,
    kandidatPath?: string,
    ergebnisPath: string,
    ergebnisType: Class<Ergebnis>,
    ebenen: Map<string, EbeneConfigType>
|};

/**
 * Used to collect all districts on the same level.
 * In case district ids aren't unique (!uniqueId), the keys of the internally used Map are municipality ids and values are Maps.
 * Otherwise, the keys and values are just the district ids and district objects.
 * 
 * Use the provided properties and methods instead of the native Map methods!
 *
 * @class Ebene
 * @augments {(Map<?string, Map<string, GebietInterface> | GebietInterface>)}
 */
export class Ebene extends Map<?string, Map<string, GebietInterface> | GebietInterface> {
    ebene: number;
    bezeichnung: string;
    config: EbeneConfigType;
    wahl: Wahl;
    get uniqueId(): boolean { return this.config.uniqueId }
    get hasGeoPath(): boolean { return !!this.config.geoJson }
    get isWahlEbene(): boolean { return this.ebene === 1}
    get isVirtual(): boolean { return this.config.virtual }

    /**
     * Creates an instance of Ebene.
     * 
     * @param {number} ebene numeric level
     * @param {string} bezeichnung Name of this level
     * @param {EbeneConfigType} config Used for additional geodata and id information
     * @param {Wahl} wahl Wahl object this is bound to
     */
    constructor(ebene: number, bezeichnung: string, config: EbeneConfigType, wahl: Wahl) {
        super();
        if (!ebene || !bezeichnung || !wahl || !config) throw new TypeError("Ebene: ebene _and_ bezeichnung _and_ wahl _and_ config required!");
        this.ebene = ebene;
        this.bezeichnung = bezeichnung;
        // todo config checks und getters
        this.config = config;
        if (this.isVirtual && this.ebene <= 5) throw new TypeError("Ebene can't be virtual and at or below level 5");
        if (this.isVirtual && !this.config.virtualField) throw new TypeError("Ebene config: virtualField required for virtual Ebene");
        this.wahl = wahl;
    }

    /**
     * @param {string} id District id
     * @param {?string} gs Municipality id, only used in case of !uniqueId
     * @returns {boolean} Whether that Gebiet exists in this Ebene.
     */
    hasGebiet(id: string, gs: ?string): boolean {
        if (!this.uniqueId && !gs) throw new TypeError("gs required");
        if (!this.uniqueId) {
            return this.get(gs)?.has(id);
        } else return this.has(id);
    }

    /**
     * @param {string} id District id
     * @param {?string} gs Municipality id, only used in case of !uniqueId
     * @returns {?GebietInterface} The requested GebietInterface object, in case it exists
     */
    getGebiet(id: string, gs: ?string): ?GebietInterface {
        if (!this.uniqueId && !gs) throw new TypeError("gs required");
        if (!id) throw new TypeError("getGebiet: id required");
        id = id.toString();
        if (!this.uniqueId) {
            return this.get(gs)?.get(id);
        } else return this.get(id);
    }

    /**
     * Creates new {@link Gebiet} object and adds it to this.
     *
     * Previously, there was a workaround to allow empty id and use name as id, but it was removed, 
     * because such a workaround would have been required in many more situations and the data should just be fixed.
     *
     * @param {string} id District id
     * @param {?string} name District name
     * @param {?string} gs Municipality id, only used in case of !uniqueId
     * @returns {undefined} no return
     */
    addGebiet(id: string, name: ?string, gs: ?string) {
        if (this.isWahlEbene) throw new Error("will not add a Gebiet to an Ebene of level 1");
        if (!this.uniqueId && !gs) throw new TypeError("gs required");
        if (!id) throw new Error(`no id given for gebiet with name "${name}" on ebene ${this.ebene}, gs "${gs}"`);
        // todo some more checks?
        if (!this.hasGebiet(id, gs)) {
            let gebiet = new Gebiet(id, name, this, gs);
            if (!this.uniqueId) {
                if (!this.has(gs)) this.set(gs, new Map());
                this.get(gs).set(id, gebiet);
            } else this.set(id, gebiet);
        } else if (this.getGebiet(id, gs).name != name) console.warn(`Different gebiet-..-name given for id ${id}! gs ${gs}`);
    }

    /**
     * Adds given WahlGebiet object to this.
     *
     * @param {WahlGebiet} wG WahlGebiet object to be added to this level (level 1)
     */
    addWahlGebiet(wG: WahlGebiet) {
        if (!this.isWahlEbene) throw new Error("will not add a WahlGebiet to an Ebene that is not level 1");
        if (!wG) throw new TypeError("WahlGebiet required");
        let _bezirk_id = wG["bezirk-nr"];
        let _gs = wG["wahl-behoerde-gs"];
        let _map = this;
        if (!this.uniqueId) {
            if (!this.has(_gs)) this.set(_gs, new Map());
            _map = this.get(_gs);
        }
        if (_map.has(_bezirk_id)) throw new Error(`Duplicate bezirk-nr ${_bezirk_id}! gs ${_gs}`);
        _map.set(_bezirk_id, wG);
    }

    /**
     * Use this to get all the {@link GebietInterface} objects without having to worry about possible duplicate ids due to multiple municipalities!
     *
     * @readonly
     * @type {Array<GebietInterface>}
     */
    get flat(): Array<GebietInterface> {
        if (this.uniqueId) return Array.from(this.values());
        let arr = [];
        for (let gsMap of this.values()) {
            for (let geb of gsMap.values()) arr.push(geb);
        }
        return arr;
    }

    /**
     * Use this to get all the {@link GebietInterface} objects like with the flat getter while filtering by a Stimmzettel.
     * In case this is level 1, filter directly using the {@link WahlGebiet}'s property.
     * Otherwise, filter by whether any of the {@link WahlGebiet} objects of the {@link Gebiet} has the Stimmzettel to be filtered by.
     *
     * @param {?Stimmzettel} stimmzettel Stimmzettel to filter with.
     * @returns {Array<GebietInterface>} The {@link GebietInterface} objects of this.
     * @see flat
     */
    filtered(stimmzettel: ?Stimmzettel): Array<GebietInterface> {
        if (!stimmzettel) return this.flat;
        if (this.isWahlEbene) return this.flat.filter(wG=>wG["stimmzettel-gebiet-nr"]===stimmzettel.nr);
        return this.flat.filter(geb=>geb.stimmzettelNrs.has(stimmzettel.nr));
    }

    /**
     * Create an {@link ErgebnisAnalysisCollection}, optionally filtered, for this.
     * Note: This only uses {@link Gebiet} objects with `geoExpected`!!
     *
     * @param {?Stimmzettel} stimmzettel Stimmzettel to filter with.
     * @returns {ErgebnisAnalysisCollection} An ErgebnisAnalysisCollection, optionally filtered, of all Gebiete with geoExpected of this.
     * @todo possibly split this up for a variant that does not filter using geoExpected
     */
    ergebnisAnalysisCollection(stimmzettel: ?Stimmzettel): ErgebnisAnalysisCollection {
        return new ErgebnisAnalysisCollection(this.wahl, this.filtered(stimmzettel).filter(g=>g.geoExpected).map(g=>[g, g.ergebnisAnalysis(stimmzettel)]));
    }

    /** @returns {string} String representation of this. */
    toString(): string { return `Ebene(${this.ebene}, name: ${this.bezeichnung}, size${this.uniqueId ? "" : " (flat)"}: ${this.uniqueId ? this.size : this.flat.length})` }
}

/** For common properties of {@link WahlGebiet} and {@link Gebiet} objects */
export type GebietInterface = {
    +nr: string;
    +name: string;
    +gs: string;
    +ebene: Ebene;
    +partOf: ?Map<Ebene, Set<Gebiet>>;

    +gebietKandidaturenNrs: Set<?string>;
    +stimmzettelNrs: Set<?string>;
    +geoExpected: boolean;
    +ergebnisAnalysis: (stimmzettel: ?Stimmzettel) => ?ErgebnisAnalysis;
}

/**
 * A district on a higher level than {@link WahlGebiet} type districts in which the election actually takes place.
 * This is a group of one or more WahlGebiet objects.
 *
 * @class Gebiet
 * @augments {Map<string, WahlGebiet>}
 * @see WahlGebiet
 * @see Ebene
 * @implements {GebietInterface}
 */
export class Gebiet extends Map<string, WahlGebiet> implements GebietInterface {
    nr: string;
    name: string;
    gs: string;
    ebene: Ebene;

    /**
     * Creates an instance of Gebiet.
     * 
     * @param {string} nr District id
     * @param {string} name District name
     * @param {Ebene} ebene Ebene object this district is part of
     * @param {string} gs Municipality id, only used in case of Ebene !uniqueId
     */
    constructor(nr: string, name: string, ebene: Ebene, gs: string) {
        super();
        if (!nr || !name || !ebene) throw new TypeError("Gebiet: nr _and_ name _and_ ebene required!");
        this.nr = nr;
        this.name = name;
        this.ebene = ebene;
        this.gs = gs; // only to be used if not uniqueId
    }

    get wahl(): Wahl { return this.ebene.wahl }

    /** Get ErgebnisAnalysis for all {@link WahlGebiete} of this together via the associated {@link Wahl} object. */
    ergebnisAnalysis(stimmzettel: ?Stimmzettel): ErgebnisAnalysis {
        let ergebnisse = [];
        for (let wG of this.values()) if (!stimmzettel || wG.stimmzettel === stimmzettel) ergebnisse.push(this.wahl.ergebnisse.get(wG));
        return new ErgebnisAnalysis(ergebnisse, this.wahl.ergebnisType);
    }

    /** Get a Map of all districts the {@link WahlGebiet} objects of this are inside, with the Ebene as key and a Set containing the Gebiet objects of that Ebene (there may be multiple, careful!) */
    get partOf(): ?Map<Ebene, Set<Gebiet>> {
        let map = new Map();
        for (let ebene of this.wahl.ebenen.values()) {
            if (ebene === this.ebene) continue;
            for (let gebiet of ebene.flat) {
                let values = gebiet.values?.();
                if (!values) continue;
                for (let wahlGebiet of values) {
                    if ([...this.values()].includes(wahlGebiet)) {
                        if (!map.has(ebene)) map.set(ebene, new Set());
                        map.get(ebene).add(gebiet);
                    }
                }
            }
        }
        return map;
    }

    get gebietKandidaturenNrs(): Set<?string> {
        return new Set(Array.from(this.values()).map(wG=>wG["kandidat-gebiet-nr"]));
    }

    get stimmzettelNrs(): Set<?string> {
        return new Set(Array.from(this.values()).map(wG=>wG["stimmzettel-gebiet-nr"]));
    }

    get geoExpected(): boolean {
        return Array.from(this.values()).some(wG=>wG.geoExpected);
    }
    
    /** @returns {string} String representation of this. */
    toString(): string { return `Gebiet(${this.ebene.ebene}, ${this.nr}, size: ${this.size})` }
}

/**
 * A Map to represent candidates for a party for one candidature district.
 * Candidates not part of the candidate list (only with a district candidature or if there are no districts/lists) are part of noListKandidaten set.
 *
 * @class GebietKandidaturenParteiMap
 * @augments {Map<?number, WahlKandidat>}
 */
class GebietKandidaturenParteiMap extends Map<?number, WahlKandidat> {
    parteiAnyName: string;
    gebietKandidaturen: GebietKandidaturen;

    noListKandidaten: Set<WahlKandidat>;

    get allKandidaten(): Set<WahlKandidat> {
        return new Set([...this.noListKandidaten, ...this.values()]);
    }

    /**
     * Creates an instance of GebietKandidaturenParteiMap.
     * 
     * @param {string} parteiAnyName anyName of the Partei this is for
     * @param {GebietKandidaturen} gebietKandidaturen "Parent" map that collects all the candidatures for each party of a candidature district
     */
    constructor(parteiAnyName: string, gebietKandidaturen: GebietKandidaturen) {
        super();
        if (!parteiAnyName || !gebietKandidaturen) throw new TypeError("parteiAnyName & gebietKandidaturen reference required");
        this.parteiAnyName = parteiAnyName;
        this.gebietKandidaturen = gebietKandidaturen;
        this.noListKandidaten = new Set();
    }

    /**
     * Add a candidate to this party candidature map
     *
     * @param {WahlKandidat} wK Candidate model object to add
     */
    addKandidat(wK: WahlKandidat) {
        if (wK.parteiAnyName !== this.parteiAnyName) throw new Error(`given ${wK.parteiAnyName} doesn't match parteiAnyName ${this.parteiAnyName}`);
        let num = wK["kandidat-listenplatz"];
        if (num === 0 || isNaN(num)) {
            this.noListKandidaten.add(wK);
        } else {
            if (this.has(num)) throw new Error(`kandidat-listenplatz value ${num} already encountered for partei ${this.parteiAnyName} in ${this.gebietKandidaturen.nr} ${this.gebietKandidaturen.bezeichnung}`);
            this.set(num, wK);
        }
    }
}

/**
 * A map to collect all candidatures per party for a single candidature district.
 * In case there are no candidature districts, there is just one of this with an undefined nr, there's no other class to be used.
 * 
 * The handling of these entities is very similar to the handling of {@link Stimmzettel}.
 * Note that the ids and names are not in any way related to the ids and names known from Ebene/Gebiete etc., even though they usually match.
 * The data model does not really allow easy association, it is always required to go via optionally aggregated {@link WahlGebiet} properties.
 *
 * @class GebietKandidaturen
 * @augments {Map<string, GebietKandidaturenParteiMap>}
 */
export class GebietKandidaturen extends Map<string, GebietKandidaturenParteiMap> {
    nr: ?string;
    bezeichnung: ?string;
    wahl: Wahl;

    /**
     * Creates an instance of GebietKandidaturen.
     * 
     * @param {?string} nr Optional candidature district number
     * @param {?string} bezeichnung Optional candidature district number (this is provided too often in the data, it will NOT be used as a key!)
     * @param {Wahl} wahl Wahl object this is bound to.
     */
    constructor(nr: ?string, bezeichnung: ?string, wahl: Wahl) {
        super();
        if (!wahl) throw new TypeError("GebietKandidaturen: wahl required!");
        this.nr = nr;
        this.bezeichnung = bezeichnung;
        this.wahl = wahl;
    }

    /**
     * Add a candidate in this district (it is going to be added to the relevant {@link GebietKandidaturenparteiMap}).
     *
     * @param {WahlKandidat} wK Candidate model object to add
     */
    addKandidat(wK: WahlKandidat) {
        let anyName = wK.parteiAnyName;
        if (!anyName) throw new TypeError("WahlKandidat should have partei-kurzname or partei-langname");
        if (!this.has(anyName)) this.set(anyName, new GebietKandidaturenParteiMap(anyName, this));
        let parteiKandidatenMap = this.get(anyName);
        parteiKandidatenMap.addKandidat(wK);
    }

    /** @returns {string} String representation of this. */
    toString(): string { return `GebietKandidaturen(${this.nr}, ${this.bezeichnung}, size: ${this.size})` }
}

/**
 * A map to collect all parties for a single election ballot area.
 * In case there are no differing election ballots, there is just one of this with an undefined nr, there's no other class to be used.
 * 
 * Election ballots differ e. g. for Bezirksvertretungswahlen. There are 5 different sets of parties with their own order per ballot, and separate committees are to be elected.
 * This is not the case for Ratswahlen, because the ballots only differ in candidate names or whether party even appears, but not in order or in another way. Just one committee/city council is elected.
 * 
 * The handling of these entities is very similar to the handling of {@link GebietKandidaturen}.
 * Note that the ids and names are not in any way related to the ids and names known from Ebene/Gebiete etc., even though they usually match.
 * The data model does not really allow easy association, it is always required to go via optionally aggregated {@link WahlGebiet} properties.
 *
 * @class Stimmzettel
 * @augments {Map<number, WahlStimmzettelPartei>}
 */
export class Stimmzettel extends Map<number, WahlStimmzettelPartei> {
    nr: ?string;
    bezeichnung: ?string;
    wahl: Wahl;

    /**
     * Creates an instance of Stimmzettel.
     * 
     * @param {?string} nr Optional election ballot area number
     * @param {?string} bezeichnung Optional election ballot area number (this is provided too often in the data, it will NOT be used as a key!)
     * @param {Wahl} wahl Wahl object this is bound to.
     */
    constructor(nr: ?string, bezeichnung: ?string, wahl: Wahl) {
        super();
        if (!wahl) throw new TypeError("Stimmzettel: wahl required!");
        this.nr = nr;
        this.bezeichnung = bezeichnung;
        this.wahl = wahl;
    }

    /**
     * Add a party in this election ballot area.
     *
     * @param {WahlStimmzettelPartei} wSP Ballot entry object to add
     */
    addPartei(wSP: WahlStimmzettelPartei) {
        let _intPos = parseInt(wSP["stimmzettel-position"]);
        if ([...this.values()].some(eintrag=>eintrag.anyName === wSP.anyName)) {
            throw new Error(`Partei.anyName ${wSP.anyName} duplicate for stimmzettel-gebiet-nr ${this.nr}`);
        }
        if (this.has(_intPos)) throw new Error(`duplicate position ${_intPos}`);
        this.set(_intPos, wSP);
    }

    /** @returns {string} String representation of this. */
    toString(): string { return `Stimmzettel(${this.nr}, ${this.bezeichnung}, size: ${this.size})` }
}

/**
 * Represents a specific party across all the occurrences on ballots of a single election
 *
 * The OffeneWahlDaten format does not have a separate "party" model type, so a lot of information is repeated on every ballot entry.
 * That makes it more complicated to do some things related to parties, like getting the color of a party when representing potentially more than a single ballot area.
 * This class is used to merge all the occurrences and throw errors in case something didn't match.
 *
 * @class Partei
 * @augments {Map<Stimmzettel, WahlStimmzettelPartei>}
 */
export class Partei extends Map<Stimmzettel, WahlStimmzettelPartei> {
    wahl: Wahl;
    /**
     * Creates an instance of Partei.
     * 
     * @param {Wahl} wahl Wahl object this is bound to.
     */
    constructor(wahl: Wahl) {
        super();
        if (!wahl) throw new TypeError("Stimmzettel: wahl required!");
        this.wahl = wahl;
    }

    /**
     * Add a party ballot entry object to also be grouped here.
     *
     * @param {Stimmzettel} key Stimmzettel the party ballot entry comes from
     * @param {WahlStimmzettelPartei} value Ballot entry object
     * @override
     */
    set(key: Stimmzettel, value: WahlStimmzettelPartei) {
        if (value) {
            if (this.kurzname && value["partei-kurzname"] !== this.kurzname) throw new Error(`kurzname mismatch: ${value["partei-kurzname"]}, other entries have ${this.kurzname}`);
            if (this.langname && value["partei-langname"] !== this.langname) throw new Error(`langname mismatch: ${value["partei-langname"]}, other entries have ${this.langname}`);
            if (this.rgbWert && value["partei-rgb-wert"] !== this.rgbWert) throw new Error(`rgb-wert mismatch: ${value["partei-rgb-wert"]}, other entries have ${this.rgbWert}`);
            if (this.typ && value["partei-typ"] !== this.typ) throw new Error(`typ mismatch: ${value["partei-typ"]}, other entries have ${this.typ}`);
        }
        super.set(key, value);
    }

    get positions(): Map<Stimmzettel, number> {
        return new Map(Array.from(this.entries()).map(([st, wSP])=>[st, parseInt(wSP["stimmzettel-position"])]));
    }

    /**
     * This is used as a key throughout the whole application.
     * In case theres a partei-kurzname, it is that. Otherwise, it is the partei-langname.
     *
     * @readonly
     * @type {?string}
     */
    get anyName(): ?string {
        return this.values().next().value?.anyName;
    }
    
    get kurzname(): ?string {
        return this.values().next().value?.["partei-kurzname"];
    }
    get langname(): ?string {
        return this.values().next().value?.["partei-langname"];
    }
    get rgbWert(): ?string {
        return this.values().next().value?.["partei-rgb-wert"];
    }
    get typ(): ?("P" | "E") {
        return this.values().next().value?.["partei-typ"];
    }

    /**
     * Get a Set with all candidates across all candidature districts and ballot types associated with this party.
     *
     * @param {Set<?string>} [gebietKandidaturenNrs] Optional set of candidature district ids to filter with.
     * @returns {Set<WahlKandidat>} Candidate set
     */
    kandidaten(gebietKandidaturenNrs?: Set<?string>): Set<WahlKandidat> {
        // more of a responsibility outside?
        //if (gebietKandidaturenNrs && gebietKandidaturenNrs.has(undefined) && gebietKandidaturenNrs.size > 1) {
        //    throw new Error("if gebietKandidaturenNrs set has undefined, it should be the only contained value");
        //}
        let resultSet = new Set();
        for (let gKNr of (gebietKandidaturenNrs || this.wahl.kandidaten.keys())) {
            let gK = this.wahl.kandidaten.get(gKNr);
            if (!gK) {
                if (gKNr === undefined) continue;
                throw new Error(`kandidat-gebiet-nr ${gKNr} not valid`);
            }
            let parteiKandidatenMap = gK.get(this.anyName);
            if (!parteiKandidatenMap) continue;
            for (let wK of parteiKandidatenMap.allKandidaten) resultSet.add(wK);
        }
        return resultSet;
    }

    /** @returns {string} String representation of this. */
    toString(): string { return `Partei(${this.nr}, ${this.anyName}, size: ${this.size})` }
}

/**
 * Represents a single election of a specific commitee or person.
 * This does not represent a group of elections that may occur at the same time.
 *
 * @class Wahl
 */
export default class Wahl {
    config: WahlConfigType;
    baseUrl: string;

    _loaded: boolean = false;
    parameter: ?WahlParameter;

    stimmzettel: Map<?string, Stimmzettel>;
    get parteien(): Map<string, Partei> {
        let parteiMap = new Map();
        for (let gebietStimmzettel of this.stimmzettel.values()) {
            for (let eintrag of gebietStimmzettel.values()) {
                let _pName = eintrag.anyName;
                if (!parteiMap.has(_pName)) parteiMap.set(_pName, new Partei(this));
                parteiMap.get(_pName).set(gebietStimmzettel, eintrag);
            }
        }
        return parteiMap;
    }

    ebenen: Map<number, Ebene>;
    get virtualEbenen(): Map<number, Ebene> {
        return new Map([...this.ebenen].filter(([_, e]) => e.isVirtual));
    }

    kandidaten: Map<?string, GebietKandidaturen>;
    get hasKandidaten(): boolean {
        return !!this.kandidaten.size;
    }
    get kandidatGebietBezeichnung(): ?string { return this.parameter?.["kandidat-gebiet-bezeichnung"] }

    get wahlEbene(): ?Ebene { return this.ebenen.get(1) }

    // todo: funktion, die die wahlorganisatorische Besonderheit erkennt??? zumindest um damit umgehen zu koennen, vorsichtig

    ergebnisse: Map<WahlGebiet, Ergebnis>;

    /**
     * Get all relevant candidature district ids, optionally filtered.
     *
     * @param {?Stimmzettel} stimmzettelGebietFilter Optional Stimmzettel to filter with.
     * @returns {?Set<?string>} Result set. undefined if there are no candidates in this election
     */
    gesamtGebietKandidaturenNrs(stimmzettelGebietFilter: ?Stimmzettel): ?Set<?string> {
        if (!this.hasKandidaten) return;
        let resultSet = new Set();
        for (let wG of this.wahlEbene.filtered(stimmzettelGebietFilter)) {
            let gKN = wG.gebietKandidaturenNrs;
            // if (!gKN) continue; -- shouldn't be undefined because this.hasKandidaten is true
            for (let gKNr of gKN) resultSet.add(gKNr);
        }
        return resultSet;
    }

    /**
     * Get an {@link ErgebnisAnalysis} of all election districts of this election, can be used to get the total result.
     *
     * @param {?Stimmzettel} stimmzettelGebietFilter Optional Stimmzettel to filter with.
     * @returns {?ErgebnisAnalysis} ErgebnisAnalysis object. undefined if the data isn't loaded.
     */
    gesamtErgebnisAnalysis(stimmzettelGebietFilter: ?Stimmzettel): ?ErgebnisAnalysis {
        if (!this._loaded) return;
        let ergsEntries = [...this.ergebnisse.entries()];
        if (stimmzettelGebietFilter) ergsEntries = ergsEntries.filter(([wG, wE])=>wG.stimmzettel === stimmzettelGebietFilter);
        return new ErgebnisAnalysis([...new Map(ergsEntries).values()], this.ergebnisType);
    }

    /**
     * Creates an instance of Wahl.
     * 
     * @param {WahlConfigType} config Configuration object with relevant information for this election.
     * @param {?string} baseUrl Base URL for data loading
     * @param {Function} [dataSuccessCallback] Function to call on data success
     * @param {Function} [dataErrorCallback] Function to call on data error
     */
    constructor(config: WahlConfigType, baseUrl: ?string, dataSuccessCallback: (?boolean)=>any, dataErrorCallback?: (err: Error, ref: Object, fn: ()=>any)=>any) {
        if (!config) throw new TypeError("config required!");
        this.config = config;
        this.baseUrl = baseUrl;
        this.dataErrorCallback = dataErrorCallback;
        this.successCallback = dataSuccessCallback;

        this.ebenen = new Map();
        this.stimmzettel = new Map();
        this.kandidaten = new Map();
        this.ergebnisse = new Map();
    }

    get loaded(): boolean { return this._loaded }
    get name(): string { return this.config.name }
    get parameterPath(): string { return this.config.parameterPath }
    get gebietePath(): string { return this.config.gebietePath }
    get stimmzettelPath(): string { return this.config.stimmzettelPath }
    get kandidatPath(): ?string { return this.config.kandidatPath }
    get ergebnisPath(): string { return this.config.ergebnisPath }
    get ergebnisType(): Class<Ergebnis> { return this.config.ergebnisType }
    get ebenenConfigs(): Map<string, EbeneConfigType> { return this.config.ebenen }

    get wahlBehoerdeGs(): ?string { return this.parameter?.["wahl-behoerde-gs"] }
    get wahlBehoerdeName(): ?string { return this.parameter?.["wahl-behoerde-name"] }
    get datumStr(): ?string { return this.parameter?.["wahl-datum"] }
    get datum(): ?Date {
        if (!this.datumStr) return undefined;
        // dd.mm.yyyy ...
        try {
            let _s = this.datumStr.split(".").map(v=>parseInt(v));
            if (!(_s.length === 3)) throw new Error("2 dots required");
            return new Date(_s[2], _s[1] - 1, _s[0]);
        }
        catch (err) {
            throw new TypeError(`wahl-datum ${this.datumStr} invalid! ${err}`);
        }
    }
    get displayName(): ?string { return this.config.displayName }
    get bezeichnung(): ?string { return this.parameter?.["wahl-bezeichnung"] }

    /**
     * Handle a potential data loading error.
     *
     * @param {Error} err The error object
     * @param {Function} fn Currently unused. Instead of calling a specific load function, for now the whole loading process is started again.
     */
    _handleDataError(err: Error, fn: ()=>any): any {
        if (this.dataErrorCallback) {
            this.dataErrorCallback(err, this, /* fn */ this.loadData);
        } else throw err;
    }

    /** Reset the properties/maps containing loaded model data. */
    resetData() {
        this.parameter = undefined;
        this.ebenen.clear();
        this.stimmzettel.clear();
        this.kandidaten.clear();
        this.ergebnisse.clear();
        this._loaded = false;
    }

    /**
     * (internally used) Load model data for all types.
     * 
     * @async
     * @param {boolean} [reload=false] Whether to freshly reload in case the data was already loaded.
     * @returns {Promise<boolean>} A Promise resolving to a boolean whether the data was freshly loaded.
     */
    async _loadData(reload: boolean = false): Promise<boolean> {
        if (this.loaded) {
            if (reload) this.resetData();
            else return false;
        }
        // can't fully be processed in parallel for now, the order matters
        try {
            await this.loadParameterData();
            await this.loadGebieteData();
            await this.loadStimmzettelData();
            await this.loadKandidatData();
            await this.loadErgebnisData();
        } catch (err) {
            this._handleDataError(err);
            throw err;
        }
        this._loaded = true;
        return true;
    }

    /**
     * Load model data for all types.
     * 
     * @async
     * @param {boolean} [reload=false] Whether to freshly reload in case the data was already loaded.
     * @see _loadData
     * @returns {Promise<boolean>} A Promise resolving to a boolean whether the data was freshly loaded.
     */
    async loadData(reload: boolean = false): Promise<boolean> {
        return this._loadData(reload).then(this.successCallback);
    }

    /**
     * Load JSON parameter data.
     *
     * @async
     * @returns {Promise<any>} .
     * @see WahlParameter
     */
    async loadParameterData(): Promise<any> {
        return fetchCsvToJson(this.parameterPath, this.baseUrl)
            .then(jsonObj => this._handleParameterData(jsonObj));
    }

    /**
     * Handle JSON parameter data. Creates {@link Ebene} objects.
     *
     * @param {object} jsonObj JSON parameter data.
     * @see WahlParameter
     */
    _handleParameterData(jsonObj: Object) {
        this.parameter = undefined;
        this.ebenen.clear();
        for (let csvRow of jsonObj) {
            if (csvRow["wahl-name"] != this.name) continue;
            // todo: expected only one for specific wahl-behoerde?????
            if (this.parameter) throw new Error("expected only one WahlParameter row!");
            this.parameter = new WahlParameter(csvRow, this);
        }
        if (!this.parameter) throw new Error("no valid parameter data provided");

        this.ebenen.set(1, new Ebene(1, this.parameter["bezirk-bezeichnung"], this.ebenenConfigs.get(this.parameter["bezirk-bezeichnung"]), this));
        let _knownNames = new Set([this.parameter["bezirk-bezeichnung"]]);
        for (let _level = 2; _level <= 5; _level++) {
            let _bez = this.parameter[`gebiet-ebene-${_level}-bezeichnung`];
            if (!_bez) continue;
            if (_knownNames.has(_bez)) throw new Error(`duplicate gebiet-ebene-${_level}-bezeichnung ${_bez}!`);
            this.ebenen.set(_level, new Ebene(_level, _bez, this.ebenenConfigs.get(_bez), this));
            _knownNames.add(_bez);
        }

        let _level = 90;
        this.ebenenConfigs.forEach((eC, _bez) => {
            if (!eC.virtual) return;
            if (_knownNames?.has(_bez)) throw new Error(`duplicate Ebene bezeichnung ${_bez} while creating virtual Ebene`);
            this.ebenen.set(_level, new Ebene(_level, _bez, eC, this));
            _level++;
        });
    }

    /**
     * Repeatedly called on WahlModel objects to check that basic data matches this election.
     *
     * @param {WahlModel} modelObj Model object
     */
    checkBaseData(modelObj: WahlModel) {
        if (modelObj["wahl-name"] !== this.name) throw new Error(`unexpected wahl-name ${modelObj["wahl-name"]}`);
        // if (modelObj["wahl-behoerde-gs"] !== this.wahlBehoerdeGs) throw new Error(`unexpected wahl-behoerde-gs ${modelObj["wahl-behoerde-gs"]}`);
        // if (modelObj["wahl-datum"] !== this.datumStr) throw new Error(`Gebiete: unexpected wahl-datum ${modelObj["wahl-datum"]}`);
    }

    /**
     * Load JSON district data.
     *
     * @async
     * @returns {Promise<any>} .
     * @see WahlGebiet
     */
    async loadGebieteData(): Promise<any> {
        return fetchCsvToJson(this.gebietePath, this.baseUrl)
            .then(jsonObj => this._handleGebieteData(jsonObj));
    }

    /**
     * Handle JSON district data. Calls {@link Wahl#addWahlGebiet} on each object.
     * Previously loaded data is cleared.
     *
     * @param {object} jsonObj JSON district data.
     * @see WahlGebiet
     */
    _handleGebieteData(jsonObj: Object) {
        for (let _e of this.ebenen.values()) {
            _e.clear();
        }
        for (let csvRow of jsonObj) {
            let wG = new WahlGebiet(csvRow, this);
            this.checkBaseData(wG);
            this.addWahlGebiet(wG);
        }
    }

    /**
     * Load JSON ballot data.
     * 
     * @async
     * @returns {Promise<any>} .
     * @see WahlStimmzettelPartei
     */
    async loadStimmzettelData(): Promise<any> {
        return fetchCsvToJson(this.stimmzettelPath, this.baseUrl)
            .then(jsonObj => this._handleStimmzettelData(jsonObj));
    }

    /**
     * Handle JSON ballot data. Calls {@link Wahl#addStimmzettelPartei} on each object.
     * Previously loaded data is cleared.
     *
     * @param {object} jsonObj JSON ballot data.
     * @see WahlStimmzettelPartei
     */
    _handleStimmzettelData(jsonObj: Object) {
        this.stimmzettel.clear();
        for (let csvRow of jsonObj) {
            let wSP = new WahlStimmzettelPartei(csvRow, this);
            this.checkBaseData(wSP);
            this.addStimmzettelPartei(wSP);
        }
        let _ = this.parteien; // checks for errors indirectly
    }

    /**
     * Load JSON candidate data.
     *
     * @async
     * @returns {Promise<any>} .
     * @see WahlKandidat
     */
    async loadKandidatData(): Promise<any> {
        if (!this.kandidatPath) return;
        return fetchCsvToJson(this.kandidatPath, this.baseUrl)
            .then(jsonObj => this._handleKandidatData(jsonObj));
    }

    /**
     * Handle JSON candidate data. Calls {@link Wahl#addKandidat} on each object.
     * Previously loaded data is cleared.
     *
     * @param {object} jsonObj JSON candidate data.
     * @see WahlKandidat
     */
    _handleKandidatData(jsonObj: Object) {
        this.kandidaten.clear();
        let validAnyKeys;
        if (this.stimmzettel.size) validAnyKeys = new Set([...this.parteien.keys()]);
        for (let csvRow of jsonObj) {
            let wK = new WahlKandidat(csvRow, this);
            this.checkBaseData(wK);
            this.addKandidat(wK, validAnyKeys);
        }
    }

    /**
     * Load JSON result data.
     *
     * @async
     * @returns {Promise<any>} .
     * @see WahlErgebnis
     */
    async loadErgebnisData(): Promise<any> {
        return fetchCsvToJson(this.ergebnisPath, this.baseUrl)
            .then(jsonObj => this._handleErgebnisData(jsonObj));
    }

    /**
     * Handle JSON result data. Calls {@link Wahl#addErgebnis} on each object.
     * Previously loaded data is cleared.
     *
     * @param {object} jsonObj JSON result data.
     * @see WahlErgebnis
     */
    _handleErgebnisData(jsonObj: Object) {
        this.ergebnisse.clear();
        // otherwise an incomplete amount of Ergebnisse would not be noticeable inside ErgebnisAnalysis
        this.wahlEbene.flat.forEach(wG=>{this.ergebnisse.set(wG, undefined)});
        for (let csvRow of jsonObj) {
            let wE = new WahlErgebnis(csvRow, this);
            this.checkBaseData(wE);
            this.addErgebnis(wE);
        }
    }

    /**
     * Adds a WahlGebiet object to the relevant {@link Ebene} objects of this.
     *
     * @param {WahlGebiet} wG WahlGebiet object to add.
     */
    addWahlGebiet(wG: WahlGebiet) {
        if (!wG) return;
        let _gs = wG["wahl-behoerde-gs"];
        let _bezirk_id = wG["bezirk-nr"];
        let _ebene;
        for (let _level = 5; _level > 1; _level--) {
            let _id = wG[`gebiet-ebene-${_level}-nr`];
            let _gebiet_name = wG[`gebiet-ebene-${_level}-name`];
            // assumption: it's ok to have _some_ bezirke part of an ebene while others are not part of this ebene
            // otherwise: throw error in case ebene already has gebiete and this bezirk is not part of this ebene
            if (!_id && !_gebiet_name) continue; // error if no id gets thrown later. previously, there was a workaround applying name as id but let's not make this our responsibility

            _ebene = this.ebenen.get(_level); // Ebene (> 1)
            if (!_ebene) throw new Error(`unexpected gebiet-ebene-${_level}-nr with value (${_id}) -- Ebene not defined in WahlParameter!`);

            _ebene.addGebiet(_id, _gebiet_name, _gs);
            let _gebiet: Gebiet = _ebene.getGebiet(_id, _gs);
            _gebiet.set(_bezirk_id, wG);
        }
        this.ebenen.get(1).addWahlGebiet(wG);
        this.virtualEbenen.forEach((_ebene) => {
            let _id = wG[_ebene.config.virtualField];
            if (!_id) return; // ? or make this an error?
            // no separate name for now
            _ebene.addGebiet(_id, _id, _gs);
            let _gebiet: Gebiet = _ebene.getGebiet(_id, _gs);
            _gebiet.set(_bezirk_id, wG);
        });
    }

    /**
     * Adds a WahlStimmzettelPartei object to the relevant {@link Stimmzettel} object of this.
     *
     * @param {WahlStimmzettelPartei} wSP WahlStimmzettelPartei object to add.
     */
    addStimmzettelPartei(wSP: WahlStimmzettelPartei) {
        if (!wSP) return;
        let _gebiet_nr = wSP["stimmzettel-gebiet-nr"];
        if (!this.stimmzettel.has(_gebiet_nr)) {
            this.stimmzettel.set(_gebiet_nr, new Stimmzettel(_gebiet_nr, wSP["stimmzettel-gebiet-bezeichnung"], this));
        }
        this.stimmzettel.get(_gebiet_nr).addPartei(wSP);
    }

    /**
     * Adds a WahlKandidat object to the relevant {@link GebietKandidaturen} object of this.
     *
     * @param {WahlKandidat} wK WahlKandidat object to add.
     * @param {?Set<string>} validAnyKeys If provided, used to check whether the party anyName of the candidate is valid.
     */
    addKandidat(wK: WahlKandidat, validAnyKeys: ?Set<string>) {
        if (!wK) return;
        // similar to stimmzettel . . .
        // ignoring kandidat ebene bezeichnung!
        // checks?
        if (validAnyKeys && !validAnyKeys.has(wK.parteiAnyName)) throw new Error(`invalid partei anyName ${wK.parteiAnyName}`);
        let _gebiet_nr = wK["kandidat-gebiet-nr"];
        if (!this.kandidaten.has(_gebiet_nr)) {
            this.kandidaten.set(_gebiet_nr, new GebietKandidaturen(_gebiet_nr, wK["kandidat-gebiet-bezeichnung"], this));
        }
        this.kandidaten.get(_gebiet_nr).addKandidat(wK);
    }

    /**
     * Adds a WahlErgebnis object to the ergebnisse Map of this.
     *
     * @param {WahlErgebnis} wE WahlErgebnis object to add.
     */
    addErgebnis(wE: WahlErgebnis) {
        if (!wE) return;
        if (!this.wahlEbene) throw new Error("can't add Ergebnis, Ebenen not loaded");
        let _wahlGebiet = this.wahlEbene.getGebiet(wE["bezirk-nr"], wE["wahl-behoerde-gs"]);
        if (!_wahlGebiet) throw new Error(`unknown bezirk-nr ${wE["bezirk-nr"]} for ${wE["wahl-behoerde-gs"]}, can't add ergebnis`);
        if (!(_wahlGebiet instanceof WahlGebiet)) throw new TypeError("Gebiet on wahlEbene has to be WahlGebiet (level 1)");
        if (wE["bezirk-name"] && wE["bezirk-name"] !== _wahlGebiet["bezirk-name"]) console.warn(`Ergebnis: bezirk-name differs for ${wE["bezirk-nr"]}`);
        if (this.ergebnisse.get(_wahlGebiet)) throw new Error(`Ergebnis already exists for ${wE["bezirk-nr"]} in ${wE["wahl-behoerde-gs"]}`);
        else this.ergebnisse.set(_wahlGebiet, new this.ergebnisType(wE, this));
    }
}
