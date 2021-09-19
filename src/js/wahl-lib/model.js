/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
/* eslint-disable jsdoc/require-param */
import type { Stimmzettel, Gebiet, GebietInterface, Ebene, default as Wahl, GebietKandidaturen } from './wahl';
import { ErgebnisAnalysis } from './ergebnis';

/** Array with string or alternatively tuples of string and default value */
export type ParamType =  Array<string | [string, any]>;

/**
 * Base class to be used with property values coming from Objects with specific field names.
 * Fields common for every OffeneWahlDaten format file are defined here.
 *
 * @abstract
 * @class WahlModel
 */
export class WahlModel {
    /* ["version"]: string; */
    /* ["wahl-behoerde-gs"]: string; */
    /* ["wahl-datum"]: string; */
    /* ["wahl-name"]: string; */

    /**
     * Properties for this model class.
     * There can be any amount of subclasses and their statically defined parameters are going to be all merged together and don't need to be repeated
     *
     * @static
     * @type {ParamType}
     * @see allParams
     */
    static params: ParamType = [
        "version",
        "wahl-behoerde-gs",
        "wahl-datum",
        "wahl-name",
    ]

    /**
     * Strings defined here can be the start of keys with any content after that start, there won't be an error for unknown keys.
     *
     * @static
     * @type {Array<string>}
     * @see {WahlErgebnis}
     */
    static allowAnyFieldStarts: Array<string> = [];

    /**
     * Merges all properties defined in {@link WahlModel.params} from all classes in the prototype chain.
     *
     * @readonly
     * @static
     * @type {object}
     */
    static get allParams(): Object {
        /* own solution, because
         - class fields & usage of these properties not helpful as defaults can't be included
         - https://github.com/tc39/proposal-class-fields#execution-of-initializer-expressions
         - https://github.com/alexeyraspopov/dataclass not usable for inheritance
        */
        let _p = this;
        let _allParams: Object = {};
        //$FlowIssue[prop-missing]
        while (_p != Object.prototype) {
            //$FlowIgnore[incompatible-type]
            let _params: ParamType = _p.params || [];
            // strings -> arrays with undefined as default
            _params.forEach((e, i) => {
                if (!e) throw new TypeError(`invalid key ${e}`);
                if (typeof e === 'string')
                    _params[i] = [e, undefined];
            });
            // if key not previously seen, save default value
            for (const [key, defval] of _params) {
                if (!(key in _allParams)) _allParams[key] = defval;
            }
            // get prototype for next iteration
            //$FlowIgnore[incompatible-use]
            _p = Object.getPrototypeOf(_p);
        }
        return _allParams;
    }

    wahl: ?Wahl;

    /**
     * To be used from subclasses.
     * 
     * @abstract
     * @param {object} [values={}] Object that provides values to fill the model object with
     * @param {?Wahl} wahl Wahl object to be bound to, used in some helpers/getters in model classes
     */
    constructor(values: Object = {}, wahl: ?Wahl) {
        // https://stackoverflow.com/a/30560792
        //$FlowIssue[unsupported-syntax]: https://github.com/facebook/flow/issues/1152
        if (new.target === WahlModel) {
            throw new TypeError("Cannot construct WahlModel instances directly");
        }

        this.wahl = wahl;

        // https://stackoverflow.com/a/34913701
        //$FlowIssue[unsupported-syntax]: https://github.com/facebook/flow/issues/1152
        let _allParams = new.target.allParams;
        for (const [key, defval] of Object.entries(_allParams)) {
            //$FlowIgnore[prop-missing]
            this[key] = values[key] || defval;
            // if (!values[key]) console.debug(`no value given for ${key}${defval ? `, using default value ${defval}` : ""}`);
        }

        // only allow defined keys here at time of instantiation, except for ones that start with any of allowAnyFieldStarts
        //$FlowIssue[unsupported-syntax]: https://github.com/facebook/flow/issues/1152
        let _allowAnyFieldStarts = new.target.allowAnyFieldStarts;
        Object.keys(values).forEach((key) => {
            if (!(key in _allParams)) {
                if (_allowAnyFieldStarts.some(start=>key.startsWith(start))) {
                    this[key] = values[key];
                } else throw new TypeError(`Key ${key} invalid`);
            }
        });

        if (!this["wahl-datum"]) throw new TypeError("wahl-datum required!");
        if (!this["wahl-name"]) throw new TypeError("wahl-name required!");
    }
}

/**
 * Class for OffeneWahlDaten format "Parameter" objects
 *
 * @class WahlParameter
 * @see Wahl
 * @augments {WahlModel}
 */
export class WahlParameter extends WahlModel {
    /* ["wahl-behoerde-name"]: string; */
    /* ["wahl-bezeichnung"]: string; */
    /* ["kandidat-gebiet-bezeichnung"]: ?string; */
    /* ["gebiet-ebene-5-bezeichnung"]: ?string; */
    /* ["gebiet-ebene-4-bezeichnung"]: ?string; */
    /* ["gebiet-ebene-3-bezeichnung"]: ?string; */
    /* ["gebiet-ebene-2-bezeichnung"]: ?string; */
    /* ["bezirk-bezeichnung"]: string; */
    /** @see WahlModel.params */
    static params: ParamType = [
        "wahl-behoerde-name",
        "wahl-bezeichnung",
        "kandidat-gebiet-bezeichnung",
        "gebiet-ebene-5-bezeichnung",
        "gebiet-ebene-4-bezeichnung",
        "gebiet-ebene-3-bezeichnung",
        "gebiet-ebene-2-bezeichnung",
        "bezirk-bezeichnung",
    ];

    /** @see WahlModel.constructor */
    constructor(values: Object = {}, wahl: ?Wahl) {
        super(values, wahl);
        if (!this["bezirk-bezeichnung"]) throw new TypeError("bezirk-bezeichnung required!");
    }
}

/**
 * Class for OffeneWahlDaten format "Gebiet" objects
 *
 * @class WahlGebiet
 * @augments {WahlModel}
 * @see Gebiet
 * @see Ebene
 * @implements {GebietInterface}
 */
export class WahlGebiet extends WahlModel implements GebietInterface {
    /* ["wahl-leiter-gs"]: string; */
    /* ["wahl-leiter-name"]: string; */
    /* ["gebiet-ebene-5-nr"]: string; */
    /* ["gebiet-ebene-5-name"]: string; */
    /* ["gebiet-ebene-4-nr"]: string; */
    /* ["gebiet-ebene-4-name"]: string; */
    /* ["gebiet-ebene-3-nr"]: string; */
    /* ["gebiet-ebene-3-name"]: string; */
    /* ["gebiet-ebene-2-nr"]: string; */
    /* ["gebiet-ebene-2-name"]: string; */
    /* ["bezirk-nr"]: string; */
    /* ["bezirk-name"]: string; */
    /* ["bezirk-art"]: "W" | "B"; */
    /* ["bezirk-repräsentativ"]: "J" | "N"; */
    /* ["kandidat-gebiet-nr"]: ?string; */
    /* ["kandidat-gebiet-bezeichnung"]: ?string; */
    /* ["stimmzettel-gebiet-nr"]: ?string; */
    /* ["stimmzettel-gebiet-bezeichnung"]: ?string; */
    /** @see WahlModel.params */
    static params: ParamType = [
        "wahl-leiter-gs",
        "wahl-leiter-name",
        "gebiet-ebene-5-nr",
        "gebiet-ebene-5-name",
        "gebiet-ebene-4-nr",
        "gebiet-ebene-4-name",
        "gebiet-ebene-3-nr",
        "gebiet-ebene-3-name",
        "gebiet-ebene-2-nr",
        "gebiet-ebene-2-name",
        "bezirk-nr",
        "bezirk-name",
        "BRIEFWAHLBEZIRK-NR", // eigenes
        "bezirk-art",
        "bezirk-repräsentativ",
        "kandidat-gebiet-nr",
        "kandidat-gebiet-bezeichnung",
        "stimmzettel-gebiet-nr",
        "stimmzettel-gebiet-bezeichnung",
    ];

    get nr(): string { return this["bezirk-nr"] }
    get name(): string { return this["bezirk-name"] }
    get gs(): string { return this["wahl-behoerde-gs"] }

    _ebeneNr: number = 1;
    get ebene(): ?Ebene {
        if (!this.wahl) return undefined;
        if (!this._ebeneNr === 1) throw new Error(`WahlGebiet ebeneNr should be 1, not ${this._ebeneNr}`);
        return this.wahl.ebenen.get(this._ebeneNr);
    }

    /** Get a Map of all higher level districts this is in, with the Ebene as key and a single item Set containing the Gebiet on that Ebene */
    get partOf(): ?Map<Ebene, Set<Gebiet>> {
        if (!this.wahl) return undefined;
        let map = new Map();
        for (let ebene of this.wahl.ebenen.values()) {
            if (ebene === this.ebene) continue;
            for (let gebiet of ebene.flat) {
                let values = gebiet.values?.();
                if (!values) continue;
                if ([...values].includes(this)) {
                    if (map.has(ebene)) throw new Error("WahlGebiet should only be part of one Gebiet per Ebene");
                    map.set(ebene, new Set([gebiet]));
                }
            }
        }
        return map;
    }

    get gebietKandidaturen(): ?GebietKandidaturen {
        if (!this.wahl) return undefined;
        return this.wahl.kandidaten.get(this["kandidat-gebiet-nr"]);
    }

    get gebietKandidaturenNrs(): ?Set<?string> {
        if (!this.wahl) return undefined;
        return this.wahl.hasKandidaten ? new Set([this["kandidat-gebiet-nr"]]) : undefined;
    }

    get stimmzettel(): ?Stimmzettel {
        if (!this.wahl) return undefined;
        return this.wahl.stimmzettel.get(this["stimmzettel-gebiet-nr"]);
    }

    get stimmzettelNrs(): Set<?string> {
        return new Set([this["stimmzettel-gebiet-nr"]]);
    }

    get geoExpected(): boolean {
        return this["bezirk-art"] === "W";
    }

    /**
     * Get ErgebnisAnalysis via the associated {@link Wahl} object.
     *
     * @param {?Stimmzettel} stimmzettel In case a Stimmzettel is provided, don't return something in case it doesn't match this Stimmzettel
     * @returns {?ErgebnisAnalysis} ErgebnisAnalysis for the Ergebnis associated with this.
     * @see WahlErgebnis
     */
    ergebnisAnalysis(stimmzettel: ?Stimmzettel): ?ErgebnisAnalysis {
        let erg = this.wahl.ergebnisse.get(this);
        if (stimmzettel && this.stimmzettel !== stimmzettel) return;
        return new ErgebnisAnalysis([erg], this.wahl.ergebnisType);
    }

    /** @see WahlModel.constructor */
    constructor(values: Object = {}, wahl: ?Wahl) {
        super(values, wahl);
        if (!this["bezirk-nr"]) throw new TypeError("bezirk-nr required!");
        if (!(this["bezirk-art"] === "W" || this["bezirk-art"] === "B")) throw new Error("bezirk-art W or B required");
    }
}

/**
 * Class for OffeneWahlDaten format "Stimmzettel" objects.
 * A single party as a ballot entry.
 *
 * @class WahlStimmzettelPartei
 * @see Partei
 * @augments {WahlModel}
 */
export class WahlStimmzettelPartei extends WahlModel {
    /* ["stimmzettel-gebiet-nr"]: ?string; */
    /* ["stimmzettel-gebiet-bezeichnung"]: ?string; */
    /* ["stimmzettel-position"]: string; */
    /* ["partei-kurzname"]: string; */
    /* ["partei-langname"]: string; */
    /* ["partei-rgb-wert"]: string; */
    /* ["partei-typ"]: "P" | "E"; */
    /** @see WahlModel.params */
    static params: ParamType = [
        "stimmzettel-gebiet-nr",
        "stimmzettel-gebiet-bezeichnung",
        "stimmzettel-position",
        "partei-kurzname",
        "partei-langname",
        "partei-rgb-wert",
        "partei-typ",
    ];

    get anyName(): ?string { return this["partei-kurzname"] || this["partei-langname"] }

    /** @see WahlModel.constructor */
    constructor(values: Object = {}, wahl: ?Wahl) {
        super(values, wahl);
        if (!this["stimmzettel-position"]) throw new TypeError("stimmzettel-position required!");
        if (!(this["partei-kurzname"] || this["partei-langname"])) throw new TypeError("partei-kurzname or -langname required!");
        if (!this["partei-rgb-wert"]) throw new TypeError("partei-rgb-wert required!");
    }
}


/**
 * Class for OffeneWahlDaten format "Kandidaten" objects.
 * A candidate for a specific party in a specific candidature district (or none).
 *
 * @class WahlKandidat
 * @see GebietKandidaturen
 * @augments {WahlModel}
 */
export class WahlKandidat extends WahlModel {
    /* ["partei-kurzname"]: string; */
    /* ["partei-langname"]: ?string; */
    /* ["kandidat-name"]: string; */
    /* ["kandidat-namensvorsatz"]: string; */
    /* ["kandidat-vorname"]: string; */
    /* ["kandidat-akadgrad"]: string; */
    /* ["kandidat-geburtsjahr"]: ?number; */
    /* ["kandidat-geschlecht"]: ?string; */
    /* ["kandidat-beruf"]: ?string; */
    /* ["kandidat-gebiet-nr"]: ?string; */
    /* ["kandidat-gebiet-bezeichnung"]: ?string; */
    /* ["kandidat-listenplatz"]: ?number; */
    /** @see WahlModel.params */
    static params: ParamType = [
        "partei-kurzname",
        "partei-langname",
        "kandidat-name",
        ["kandidat-namensvorsatz", ""],
        "kandidat-vorname",
        ["kandidat-akadgrad", ""],
        "kandidat-geburtsjahr",
        "kandidat-geschlecht",
        "kandidat-beruf",
        "kandidat-gebiet-nr",
        "kandidat-gebiet-bezeichnung",
        "kandidat-listenplatz", // 0 = nur über Gebiet zur Wahl stehend
    ];

    get name(): string {
        let str = "";
        if (this["kandidat-akadgrad"]) str += this["kandidat-akadgrad"] + " ";
        str += this["kandidat-vorname"] + " ";
        if (this["kandidat-namensvorsatz"]) str += this["kandidat-namensvorsatz"] + " ";
        str += this["kandidat-name"];
        return str;
    }

    get parteiAnyName(): ?string { return this["partei-kurzname"] || this["partei-langname"] }

    get gebietKandidaturen(): ?GebietKandidaturen {
        if (!this.wahl) return undefined;
        return this.wahl.kandidaten.get(this["kandidat-gebiet-nr"]);
    }

    /** @see WahlModel.constructor */
    constructor(values: Object = {}, wahl: ?Wahl) {
        super(values, wahl);
        if (!(this["partei-kurzname"] || this["partei-langname"])) throw new TypeError("partei-kurzname or -langname required!");
        this["kandidat-geburtsjahr"] = parseInt(this["kandidat-geburtsjahr"]);
        this["kandidat-listenplatz"] = parseInt(this["kandidat-listenplatz"]);
    }
}


/**
 * Class for OffeneWahlDaten format "Ergebnis" objects
 *
 * @class WahlErgebnis
 * @see Ergebnis
 * @augments {WahlModel}
 */
export class WahlErgebnis extends WahlModel {
    /* ["bezirk-nr"]: string; */
    /* ["bezirk-name"]: ?string; */
    /* ["zeitstempel-erfassung"]: ?string */
    /** @see WahlModel.params */
    static params: ParamType = [
        "bezirk-nr",
        "bezirk-name",
        "zeitstempel-erfassung", // DD.MM.YYYY hh:mm:ss
    ];

    static allowAnyFieldStarts: Array<string> = [
        "A", "B", "C", "D", "E", "F"
    ];

    get wahlGebiet(): ?WahlGebiet {
        if (!this.wahl) return undefined;
        return this.wahl.wahlEbene.getGebiet(this["bezirk-nr"], this["wahl-behoerde-gs"]);
    }

    get gebietKandidaturen(): ?GebietKandidaturen {
        return this.wahlGebiet?.gebietKandidaturen;
    }

    get gebietKandidaturenNrs(): ?Set<?string> {
        return this.wahlGebiet?.gebietKandidaturenNrs;
    }

    get stimmzettel(): ?Stimmzettel {
        return this.wahlGebiet?.stimmzettel;
    }

    /** @see WahlModel.constructor */
    constructor(values: Object = {}, wahl: ?Wahl) {
        super(values, wahl);
        if (!this["bezirk-nr"]) throw new TypeError("bezirk-nr required!");
        // if (!this["zeitstempel-erfassung"]) throw new TypeError("zeitstempel-erfassung required!");
    }
}
