/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import { ErgebnisAnalysisCollection } from './analysis-collection';
import type { WahlGebiet, WahlErgebnis } from '../model';
import type Wahl from '../wahl';

// can't use class and subclasses because of class field (proposal) behaviour in subclasses
export interface FieldDescription {
    /** Human readable name of property. */
    name: string;
    /** Optional human readable description of property. */
    description: ?string;
    /** Whether it would make sense to divide by amount for an average. !isSum: it is probably a percentage. */
    +isSum: () => ?boolean;
    /** Machine readable name that is used as property name in objects. */
    propName: string;
    ergebnisType: Class<Ergebnis>;
    displayInTooltip: ?boolean;
}

/**
 * Describes an analysable property for a simple constant field value.
 *
 * @class ConstantFieldDescription
 * @implements {FieldDescription}
 */
export class ConstantFieldDescription implements FieldDescription {
    name: string;
    description: ?string;
    isSum: () => ?boolean = () => true;
    propName: string;
    ergebnisType: Class<Ergebnis>;
    displayInTooltip: ?boolean;
    /**
     * Creates an instance of ConstantFieldDescription.
     * 
     * @param {object} opts Options that will be set as properties, see interface & class definitions.
     */
    constructor(opts: Object) {
        if (!opts || !Object.keys(opts).length) throw new Error("non-empty opts Object is required");
        // todo check name, propname, ergebnistype NN & target != FieldDescription!
        for (let [key, val] of Object.entries(opts)) {
            if (val !== undefined) this[key] = val;
        }
    }
}

/**
 * These data types are part of {@link CollectedFieldDescription} definitions and define possible analyses
 * 
 * @todo convert to class?
 */
export type DataTypeType = {|
    id: string,
    /** Human readable name of this analysis type */
    name: string,
    /** HTML tagName used in the user interface, only specific values are supported */
    tagName: "wl-c-select" | "abstand-select",
    /** calculate function */
    fn: (FieldDescription) => DataTypeFnResultType,
    /** function that processes arguments, for example to convert a single value to the required args array */
    argsFn: ?(any) => Array<any>,
    /** function that processes allowed inputs to display in the user interface, for example to add "." to numbers for placements */
    keyFn: ?(any) => string,
|};

/** Used in the main application, type defined here for {@link CollectedFieldDescription#defaultDataTypeAndArgsIfInitial}. */
export type DataTypeAndArgsType = {| type: ?DataTypeType, args?: Array<any> |};

/**
 * Describes an analysable property for a group of values with a common base as their field name.
 * Usually something like D1, D2, D3, .. in the result csv files for votes by party
 *
 * @class CollectedFieldDescription
 * @implements {FieldDescription}
 */
export class CollectedFieldDescription implements FieldDescription {
    name: string;
    description: ?string;
    propName: string;
    ergebnisType: Class<Ergebnis>;
    displayInTooltip: ?boolean;

    validText: string = "gültig";
    /** In case this property is used as the default, this {@link DataTypeType} (with given args) will be preselected. */
    defaultDataTypeAndArgsIfInitial: ?DataTypeAndArgsType;
    dataTypes: Array<DataTypeType>;
    displayInTooltip: ?boolean = true;
    isSum: (?string) => boolean = (type) => type ? false : true; // could be customized
    /** Base string at the start of the field name. Only integers supported, no kumulieren & panaschieren etc. */
    base: string;
    /** Field name of invalid vote count */
    invalid: string;
    /** Property name (defined in {@link Ergebnis#constantProperties}) of total (invalid + valid) vote count */
    votesumProp: string;
    /**
     * Creates an instance of CollectedFieldDescription.
     * 
     * @param {object} opts Options that will be set as properties, see interface & class definitions.
     */
    constructor(opts: Object) {
        // todo check name, propname, ergebnistype NN & target != FieldDescription!
        for (let [key, val] of Object.entries(opts)) {
            if (val !== undefined) this[key] = val;
        }
    }
}

/**
 * Describes an analysable property for values calculated using values of other (constant) properties.
 *
 * @class CalculatedFieldDescription
 * @implements {FieldDescription}
 */
export class CalculatedFieldDescription implements FieldDescription {
    name: string;
    description: ?string;
    isSum: () => ?boolean;
    propName: string;
    ergebnisType: Class<Ergebnis>;
    displayInTooltip: ?boolean;

    fn: (...any) => any;
    args: Array<string>;
    /**
     * Creates an instance of CalculatedFieldDescription.
     * 
     * @param {object} opts Options that will be set as properties, see interface & class definitions.
     */
    constructor(opts: Object) {
        // todo check issum, fn, args NN
        // todo check name, propname, ergebnistype NN & target != FieldDescription!
        for (let [key, val] of Object.entries(opts)) {
            if (val !== undefined) this[key] = val;
        }
    }
}

/**
 * In subclasses it is statically described, which properties this can have, and instances have specific constant, calculated, or collected values based on a {@link WahlErgebnis}.
 *
 * @abstract
 * @class Ergebnis
 * @see WahlErgebnis
 */
export class Ergebnis {
    /**
     * Simple basic constant properties with property name and original field name
     * These are not used for analyses by default, they have to be referred to in a {@type FieldDescription} of a derived class.
     *
     * @static
     */
    static constantProperties: { [key: string]: string };

    static properties: Array<FieldDescription>;
    static checks: { [key: string]: (o: Ergebnis) => boolean };

    static get displayConstantProperties(): Array<ConstantFieldDescription> { return this.properties.filter(p=>p.constructor === ConstantFieldDescription) }
    static get collectedProperties(): Array<CollectedFieldDescription> { return this.properties.filter(p=>p.constructor === CollectedFieldDescription) }
    static get calculatedProperties(): Array<CollectedFieldDescription> { return this.properties.filter(p=>p.constructor === CalculatedFieldDescription) }

    _wahlErgebnis: WahlErgebnis;

    /**
     * Only to be used from subclasses.
     * 
     * @abstract
     * @param {WahlErgebnis} wE The WahlErgebnis instance that provides the raw result values
     */
    constructor(wE: WahlErgebnis): Ergebnis {
        // https://stackoverflow.com/a/30560792
        //$FlowIssue[unsupported-syntax]: https://github.com/facebook/flow/issues/1152
        if (new.target === Ergebnis) {
            throw new TypeError("Cannot construct Ergebnis instances directly");
        }

        this._setWahlErgebnis(wE);

        for (let propName of Object.keys(new.target.constantProperties)) {
            Object.defineProperty(this, propName, {
                get: function () { return this["_"+propName] }  
            });
        }

        // todo checken dass es keine duplicate propNames gibt

        for (let fieldDesc of new.target.properties) {
            switch (fieldDesc.constructor) {
            case ConstantFieldDescription:
                break;
            case CollectedFieldDescription:
                Object.defineProperty(this, fieldDesc.propName, {
                    get: function () { return this["_"+fieldDesc.propName] }  
                });
                break;
            case CalculatedFieldDescription:
                Object.defineProperty(this, fieldDesc.propName, {
                    get: function () {
                        let vals = [];
                        for (let arg of fieldDesc.args) {
                            vals.push(this[arg]);
                        }
                        return fieldDesc.fn(...vals);
                    }  
                });
                break;
            default:
                throw new TypeError(`Unexpected field type ${fieldDesc.constructor}`);
            }
        }
        this.update();
    }

    /**
     * Shared function to be used from constructor and setter.
     *
     * @param {WahlErgebnis} wE The WahlErgebnis instance that provides the raw result values
     */
    _setWahlErgebnis(wE: WahlErgebnis) {
        if (!wE) throw new TypeError("WahlErgebnis object required!");
        if (!wE.wahl) throw new Error("WahlErgebnis object not bound to Wahl object!");
        this._wahlErgebnis = wE;
    }
    
    get wahlErgebnis(): WahlErgebnis { return this._wahlErgebnis }
    /** Sets WahlErgebnis and calls {@link Ergebnis#update}. @see _setWahlErgebnis */
    set wahlErgebnis(wE: WahlErgebnis) { this._setWahlErgebnis(wE); this.update() }

    /** @returns {ErgebnisAnalysis} Create an analysis with only this as input. */
    get ergebnisAnalysis(): ErgebnisAnalysis {
        return new ErgebnisAnalysis([this], this.constructor);
    }

    /** Runs statically predefined checks and also checks vote sums for collected properties. */
    check() {
        for (let [checkName, checkFn] of Object.entries(this.constructor.checks)) {
            if (!checkFn(this)) throw new Error(`Check function ${checkName} failed`);
        }
        // check collected fields
        for (let fieldDesc of this.constructor.collectedProperties) {
            let propValue = this[fieldDesc.propName];
            if (!(
                propValue.valid + propValue.invalid === this[fieldDesc.votesumProp]
            )) throw new Error(`Sum of valid and invalid votes for collected field ${fieldDesc.propName} does not match`);
            if (!(
                Array.from(propValue.votes.values())
                    .filter(v=>!isNaN(v))
                    .reduce((a, b) => a + b, 0)
                === propValue.valid)) throw new Error(`Total sum for collected field ${fieldDesc.propName} does not match`);
        }
    }

    static get propertyMap(): Map<string, FieldDescription> {
        let _map = new Map();
        for (let fieldDesc of this.properties) {
            _map.set(fieldDesc.propName, fieldDesc);
        }
        return _map;
    }

    /**
     * Called when the {@link WahlErgebnis} value of this is set.
     * Sets internal values for every property, to be retrieved using getters defined with Object.defineProperty in the constructor.
     */
    update() {
        for (let [propName, sourceName] of Object.entries(this.constructor.constantProperties)) {
            this["_"+propName] = parseInt(this.wahlErgebnis[sourceName]);
        }
        for (let fieldDesc of this.constructor.collectedProperties) {
            let _obj = {
                valid: parseInt(this.wahlErgebnis[fieldDesc.base]),
                invalid: parseInt(this.wahlErgebnis[fieldDesc.invalid]),
                votes: new Map(),
            };
            this["_"+fieldDesc.propName] = _obj;
            for (let [sourceName, sourceValue] of Object.entries(this.wahlErgebnis)) {
                if (!(sourceName.startsWith(fieldDesc.base) && sourceName !== fieldDesc.base)) continue;
                // only integers supported, no kumulieren & panaschieren etc.
                let sourceNumber = parseInt(sourceName.replace(fieldDesc.base, ""));
                let stimmzettelPartei = this.stimmzettel.get(sourceNumber);
                if (!stimmzettelPartei) {
                    if (typeof sourceValue === "string" && sourceValue !== "") throw new TypeError(`value ${sourceValue} exists but partei for ${sourceNumber} (${sourceName}) not found`);
                    continue;
                }
                _obj.votes.set(
                    stimmzettelPartei.anyName,
                    parseInt(sourceValue)
                );
            }
        }
        this.check();
    }

    get wahl(): Wahl { return this.wahlErgebnis.wahl }
    //get wahlBehoerdeGs(): string { return this.wahlErgebnis["wahl-behoerde-gs"] }
    //get bezirkId(): string { return this.wahlErgebnis["bezirk-nr"] }
    get wahlGebiet(): WahlGebiet { return this.wahlErgebnis.wahlGebiet }
    get gebietKandidaturen(): ?GebietKandidaturen { return this.wahlErgebnis.gebietKandidaturen }
    get gebietKandidaturenNrs(): ?Set<?string> { return this.wahlErgebnis.gebietKandidaturenNrs }
    get stimmzettel(): Stimmzettel { return this.wahlErgebnis.stimmzettel }
    get timestamp(): ?Date {
        if (!this.wahlErgebnis["zeitstempel-erfassung"]) { return undefined }
        return undefined; // TODO 
    }
}

let collectedDataTypes: Array<DataTypeType> = [
    {
        id: "proportion",
        name: "Anteil",
        tagName: "wl-c-select",
        fn: ErgebnisAnalysisCollection.prototype.calculateCollectedProportions,
        argsFn: (value) => [value],
    },
    {
        id: "place",
        name: "Platzierung",
        tagName: "wl-c-select",
        fn: ErgebnisAnalysisCollection.prototype.calculateCollectedPlacements,
        argsFn: (value) => [parseInt(value)],
        keyFn: (key) => `${key}.`,
    },
    {
        id: "distance",
        name: "Abstand/Vorsprung",
        tagName: "abstand-select",
        fn: ErgebnisAnalysisCollection.prototype.calculateCollectedDistances,
    },
];

/**
 * Defines static properties relevant for {@link WahlErgebnis} objects for elections with data in the style of "Kommunalwahl NRW".
 * Probably usable for other election types, maybe with very little changes.
 * For now, documentation based on {@link offenewahldaten.de} exists only for this style, and styles for other election types should be provided later on.
 *
 * @class ErgebnisKommunalwahlNRW
 * @augments {Ergebnis}
 */
export class ErgebnisKommunalwahlNRW extends Ergebnis {
    static constantProperties: { [key: string]: string } = {
        wahlberechtigteOhneWahlschein: "A1",
        wahlberechtigteMitWahlschein: "A2",
        wahlberechtigteNichtImWaehlerverzeichnis: "A3",
        wahlberechtigteGesamt: "A",
        waehlendeGesamt: "B",
        waehlendeMitWahlschein: "B2",
    }

    static properties: Array<FieldDescription> = [
        new CollectedFieldDescription({
            name: "Stimmen",
            base: "D",
            invalid: "C",
            votesumProp: "waehlendeGesamt",
            propName: "stimmen",
            ergebnisType: this,
            displayInTooltip: true,
            defaultDataTypeAndArgsIfInitial: { type: collectedDataTypes[1], args: [1] },
            dataTypes: collectedDataTypes,
        }),
        new CalculatedFieldDescription({
            name: "Wahlbeteiligung",
            isSum: () => false,
            fn: (_1, _2) => _1 / _2,
            args: ["waehlendeGesamt", "wahlberechtigteGesamt"],
            propName: "wahlbeteiligung",
            ergebnisType: this,
            displayInTooltip: true,
        }),
        new CalculatedFieldDescription({
            name: "Wahlscheinanteil",
            description: "Stellt den geschätzten Anteil an Briefwählenden dar.",
            isSum: () => false,
            fn: (_1, _2) => _1 / _2,
            args: ["wahlberechtigteMitWahlschein", "wahlberechtigteGesamt"],
            propName: "wahlscheinAnteil",
            ergebnisType: this,
        }),
        new ConstantFieldDescription({
            name: "Wahlberechtigte",
            propName: "wahlberechtigteGesamt",
            ergebnisType: this,
        }),
    ];

    static checks: { [key: string]: (o: ErgebnisKommunalwahlNRW) => boolean } = {
        "checkWahlberechtigte": (o) => (
            o.wahlberechtigteOhneWahlschein
            + o.wahlberechtigteMitWahlschein
            + o.wahlberechtigteNichtImWaehlerverzeichnis
        ) === o.wahlberechtigteGesamt,
    }
}

/**
 * Defines static properties relevant for {@link WahlErgebnis} objects for elections with data in the style of "Landtagswahl BW 2021".
 * ...
 *
 * @class ErgebnisLandtagswahlBW
 * @see ErgebnisKommunalwahlNRW
 * @augments {Ergebnis}
 */
export class ErgebnisLandtagswahlBW extends Ergebnis {
    static constantProperties: { [key: string]: string } = {
        wahlberechtigteOhneWahlschein: "A1",
        wahlberechtigteMitWahlschein: "A2",
        wahlberechtigteNichtImWaehlerverzeichnis: "A3",
        wahlberechtigteGesamt: "A",
        waehlendeGesamt: "B",
        waehlendeMitWahlschein: "B1",
    }

    static properties: Array<FieldDescription> = [
        new CollectedFieldDescription({
            name: "Stimmen",
            base: "D",
            invalid: "C",
            votesumProp: "waehlendeGesamt",
            propName: "stimmen",
            ergebnisType: this,
            displayInTooltip: true,
            defaultDataTypeAndArgsIfInitial: { type: collectedDataTypes[1], args: [1] },
            dataTypes: collectedDataTypes,
        }),
        new CalculatedFieldDescription({
            name: "Wahlbeteiligung",
            isSum: () => false,
            fn: (_1, _2) => _1 / _2,
            args: ["waehlendeGesamt", "wahlberechtigteGesamt"],
            propName: "wahlbeteiligung",
            ergebnisType: this,
            displayInTooltip: true,
        }),
        new CalculatedFieldDescription({
            name: "Wahlscheinanteil",
            description: "Stellt den geschätzten Anteil an Briefwählenden dar.",
            isSum: () => false,
            fn: (_1, _2) => _1 / _2,
            args: ["wahlberechtigteMitWahlschein", "wahlberechtigteGesamt"],
            propName: "wahlscheinAnteil",
            ergebnisType: this,
        }),
        new ConstantFieldDescription({
            name: "Wahlberechtigte",
            propName: "wahlberechtigteGesamt",
            ergebnisType: this,
        }),
    ];

    static checks: { [key: string]: (o: ErgebnisLandtagswahlBW) => boolean } = {
        "checkWahlberechtigte": (o) => (
            o.wahlberechtigteOhneWahlschein
            + o.wahlberechtigteMitWahlschein
            + o.wahlberechtigteNichtImWaehlerverzeichnis
        ) === o.wahlberechtigteGesamt,
    }
}

/**
 * Defines static properties relevant for {@link WahlErgebnis} objects for elections with data in the style of "Bürgerentscheid" based on real data from Wiesbaden.
 * Not based on officially provided documentation. Very similar to {@link ErgebnisKommunalwahlNRW}. Only difference: "B1" instead of "B2". It has the same meaning. No difference in "B" values.
 * 
 * @class ErgebnisBuergerentscheid
 * @see ErgebnisKommunalwahlNRW
 * @augments {Ergebnis}
 */
export class ErgebnisBuergerentscheid extends Ergebnis {
    static constantProperties: { [key: string]: string } = {
        wahlberechtigteOhneWahlschein: "A1",
        wahlberechtigteMitWahlschein: "A2",
        wahlberechtigteNichtImWaehlerverzeichnis: "A3",
        wahlberechtigteGesamt: "A",
        waehlendeGesamt: "B",
        waehlendeMitWahlschein: "B1",
    }

    static properties: Array<FieldDescription> = [
        new CollectedFieldDescription({
            name: "Stimmen",
            base: "D",
            invalid: "C",
            votesumProp: "waehlendeGesamt",
            propName: "stimmen",
            ergebnisType: this,
            displayInTooltip: true,
            defaultDataTypeAndArgsIfInitial: { type: collectedDataTypes[1], args: [1] },
            dataTypes: collectedDataTypes,
        }),
        new CalculatedFieldDescription({
            name: "Wahlbeteiligung",
            isSum: () => false,
            fn: (_1, _2) => _1 / _2,
            args: ["waehlendeGesamt", "wahlberechtigteGesamt"],
            propName: "wahlbeteiligung",
            ergebnisType: this,
            displayInTooltip: true,
        }),
        new CalculatedFieldDescription({
            name: "Wahlscheinanteil",
            description: "Stellt den geschätzten Anteil an Briefwählenden dar.",
            isSum: () => false,
            fn: (_1, _2) => _1 / _2,
            args: ["wahlberechtigteMitWahlschein", "wahlberechtigteGesamt"],
            propName: "wahlscheinAnteil",
            ergebnisType: this,
        }),
        new ConstantFieldDescription({
            name: "Wahlberechtigte",
            propName: "wahlberechtigteGesamt",
            ergebnisType: this,
        }),
    ];

    static checks: { [key: string]: (o: ErgebnisBuergerentscheid) => boolean } = {
        "checkWahlberechtigte": (o) => (
            o.wahlberechtigteOhneWahlschein
            + o.wahlberechtigteMitWahlschein
            + o.wahlberechtigteNichtImWaehlerverzeichnis
        ) === o.wahlberechtigteGesamt,
    }
}
