/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import { ConstantFieldDescription, CollectedFieldDescription, CalculatedFieldDescription } from './ergebnis';
import type { Ergebnis } from './ergebnis';

/**
 * Used in {@link ErgebnisAnalysis} to represent a combined value based on an array of (optional) {@link Ergebnis} instances.
 *
 * @class ResultDescription
 */
export class ResultDescription {
    value: number;
    /** Amount of {@link Ergebnis} the value is based on */
    count: number;
    /** Possible amount of {@link Ergebnis} that could have been used if they would not be undefined */
    possibleCount: number;
    // ...
    warnings: Array<string> = [];
    fieldDesc: FieldDescription; // ~ name, description, isSum
}

/**
 * Additionally has a `results` Map. {@link ResultDescription#value} represents the total amount of votes.
 *
 * @class CollectedResultDescription
 * @augments {ResultDescription}
 */
export class CollectedResultDescription extends ResultDescription {
    /**
     * Map key is a {@link Partei#anyName}, value an optional amount of votes.
     *
     * @type {Map<string, ?number>}
     */
    results: Map<string, ?number>;
}

/**
 * Used to group multiple (optional) {@link Ergebnis} objects to represent combined values.
 *
 * @see ResultDescription
 * @class ErgebnisAnalysis
 */
export class ErgebnisAnalysis {
    /**
     * Creates an instance of ErgebnisAnalysis.
     * 
     * @param {Array<?Ergebnis>} ergebnisse Array of optional Ergebnis objects. An undefined value is used to represent a missing Ergebnis.
     * @param {Function<Ergebnis>} ergebnisType Which class the Ergebnis objects should be an instance of
     */
    constructor(ergebnisse: Array<?Ergebnis>, ergebnisType: Class<Ergebnis>) {
        if (!ergebnisse || !ergebnisse.length || !ergebnisType) throw new TypeError("non-empty ergebnisse and ergebnisType required");
        for (let erg of ergebnisse) {
            if (!erg) continue; // it's ok to have an undefined Ergebnis (real life = it hasn't been counted yet)
            if (!(erg.constructor === ergebnisType)) throw new TypeError("Types of ergebnisse-entries have to be exactly ergebnisType");
        }
        Object.defineProperty(this, "ergebnisType", { value: ergebnisType });
        Object.defineProperty(this, "ergebnisse", { value: ergebnisse });
        let propFunctions = new Map([
            [ConstantFieldDescription, this.constantProp],
            [CollectedFieldDescription, this.collectedProp],
            [CalculatedFieldDescription, this.calculatedProp],
        ]);
        for (let fieldDesc of this.properties) {
            let propFn = propFunctions.get(fieldDesc.constructor);
            if (!propFn) throw new TypeError(`Unexpected field type ${fieldDesc.constructor}`);
            Object.defineProperty(this, fieldDesc.propName, { enumerable: true, get: () => propFn.call(this, fieldDesc) });
        }
    }

    // todo docs
    get gebietKandidaturenNrs(): Set<?string> {
        let resultSet = new Set();
        for (let erg of this.ergebnisse) {
            if (!erg) continue;
            let gKN = erg.gebietKandidaturenNrs;
            if (!gKN) continue;
            for (let gKNr of gKN) resultSet.add(gKNr);
        }
        return resultSet;
    }

    get properties(): Array<FieldDescription> { return this.ergebnisType.properties }
    get constantProperties(): Array<ConstantFieldDescription> { return this.ergebnisType.displayConstantProperties }
    get collectedProperties(): Array<CollectedFieldDescription> { return this.ergebnisType.collectedProperties }
    get calculatedProperties(): Array<CalculatedFieldDescription> { return this.ergebnisType.calculatedProperties }

    // evtl. explizit Warnungen und Meta-Info (Zeitstempel, X/Y Ergebnisse vorhanden, Warnung bei gemischten Stimmzetteln usw.)

    /**
     * Represent a combined value based on the {@link Ergebnis} instances of this.
     *
     * @param {ConstantFieldDescription} fieldDesc Which associated ConstantFieldDescription this is for.
     * @returns {ResultDescription} .
     */
    constantProp(fieldDesc: ConstantFieldDescription): ResultDescription {
        let calc;
        let count = 0;
        for (let erg of this.ergebnisse) {
            if (!erg) continue;
            let _v = erg[fieldDesc.propName];
            if (isNaN(_v)) continue;
            count += 1;
            if (calc === undefined) calc = 0;
            calc += _v;
        }
        let rD = new ResultDescription();
        Object.assign(rD, { value: calc, count: count, possibleCount: this.ergebnisse.length, fieldDesc: fieldDesc });
        return rD;
    }

    /**
     * Represent a combined value based on the {@link Ergebnis} instances of this.
     *
     * @param {CalculatedFieldDescription} fieldDesc Which associated CalculatedFieldDescription this is for.
     * @returns {ResultDescription} .
     */
    calculatedProp(fieldDesc: CalculatedFieldDescription): ResultDescription {
        let count = 0;
        let sums = new Map();
        for (let arg of fieldDesc.args) {
            sums.set(arg, 0);
        }
        for (let erg of this.ergebnisse) {
            if (!erg) continue;
            for (let arg of sums.keys()) {
                let _v = erg[arg];
                // TODO UMGANG MIT NAN/UNDEF
                sums.set(arg, sums.get(arg)+_v);
            }
            count += 1;
        }
        let calc = fieldDesc.fn(...sums.values());
        let rD = new ResultDescription();
        Object.assign(rD, { value: calc, count: count, possibleCount: this.ergebnisse.length, fieldDesc: fieldDesc });
        return rD;
    }

    /**
     * Represent a combined total value and party values based on the {@link Ergebnis} instances of this.
     *
     * @param {CollectedFieldDescription} fieldDesc Which associated CollectedFieldDescription this is for.
     * @returns {CollectedResultDescription} .
     */
    collectedProp(fieldDesc: CollectedFieldDescription): CollectedResultDescription {
        let count = 0;
        let total;
        let unorderedResults = new Map();
        let placeOccurrences = new Map();
        for (let erg of this.ergebnisse) {
            if (!erg) continue;
            let _obj = erg[fieldDesc.propName];
            if (!_obj) continue; // ??
            let i = 1;
            for (let [anyName, votes] of _obj.votes.entries()) {
                if (isNaN(votes)) continue; // ??
                if (!unorderedResults.has(anyName)) {
                    unorderedResults.set(anyName, 0);
                    placeOccurrences.set(anyName, []);
                }
                unorderedResults.set(anyName, unorderedResults.get(anyName) + votes);
                placeOccurrences.get(anyName).push(i);
                i += 1;
            }
            if (total === undefined) total = 0;
            total += _obj.valid;
            count += 1;
        }
        // result map sorted by average placement
        // it shouldn't be required to do this here
        // (the amount of different placement combinations is lower than e. g. the amount of districts of the full election -- hagen, bv wahl: 5 combinations, 156 ergebnisse)
        // BUT! this gives results exactly like votemanager does.. using only the 5 different BV combinations here would cause 1 little difference using this simple algorithm
        let placeArrAvg = placeArr => placeArr.reduce((sum, place) => sum + place, 0) / placeArr.length;
        let results = new Map(
            [...placeOccurrences.entries()]
                .sort(([ka, va], [kb, vb]) => (
                    // if avg placement is equal, compare using vote count. alternatively it would be possible to compare alphabetically?
                    (placeArrAvg(va) - placeArrAvg(vb)) || (unorderedResults.get(kb) - unorderedResults.get(ka))
                )).map(([anyName, placeArr])=>[anyName, unorderedResults.get(anyName)]));
        let rD = new CollectedResultDescription();
        Object.assign(rD, {
            value: total,
            results: results,
            count: count,
            possibleCount: this.ergebnisse.length,
            // ... warnings ?!?
            fieldDesc: fieldDesc
        });
        return rD;
    }

    get notNullErgebnisseLength() { return this.ergebnisse.reduce((count, current)=>count + !!current, 0) }
    get ergebnisseLength() { return this.ergebnisse.length }

    /**
     * Map with placement, which anyNames are on that place, and with what amount of votes.
     *
     * @param {CollectedFieldDescription} fieldDesc Which associated CollectedFieldDescription this is for.
     * @returns {Map<number, *>} Map with placement as keys and Object with relevant values as values
     * @todo return type (doc)
     * @see {ErgebnisAnalysis#collectedPropPlaceMap}
     */
    collectedPropPlaceMap(fieldDesc: CollectedFieldDescription): Map<number, ?{| keys: Array<string>, votes: number, totalValid: number |}> {
        let rD: CollectedResultDescription = this.collectedProp(fieldDesc);
        let voteMap = new Map();
        let placeMap = new Map();

        [...rD.results.entries()]
            .filter(([k, v])=>!isNaN(v))
            .sort(([ka, va], [kb, vb])=>vb - va)
            .forEach(([anyName, voteCount], i) => {
                if (!voteMap.has(voteCount)) {
                    voteMap.set(voteCount, [anyName]);
                    if (placeMap.has(i+1)) throw new Error("this shouldn't happen");
                    placeMap.set(i+1, voteCount);
                } else {
                    voteMap.get(voteCount).push(anyName);
                    placeMap.set(i+1, undefined);
                }
            });

        return new Map([...placeMap.entries()]
            .map(([place, votes])=>[place, isNaN(votes) ? undefined : { keys: voteMap.get(votes), votes: votes, totalValid: rD.value }]));
    }

    /**
     * Get information for a specific place value out of the placement Map.
     *
     * @param {CollectedFieldDescription} fieldDesc Which associated CollectedFieldDescription this is for.
     * @param {number} place .
     * @returns {*} Object with relevant values
     * @todo return type (doc)
     * @see {ErgebnisAnalysis#collectedPropPlaceMap}
     */
    collectedPropPlace(fieldDesc: CollectedFieldDescription, place: number): ?{| keys: Array<string>, votes: number, totalValid: number |} {
        if (!place || place < 1) throw new Error("place should be at least 1");
        let placementMap = this.collectedPropPlaceMap(fieldDesc);
        return placementMap.get(place);
    }

    /**
     * Calculate distance between a specific party and another one of a {@type CollectedFieldDescription} for this.
     * Instead of a second party, a party can be compared to the first place, or in case it is the first place itself, compare it to the second place.
     *
     * @param {CollectedFieldDescription} fieldDesc Which associated CollectedFieldDescription this is for.
     * @param {string} key1 First party anyName.
     * @param {?string} key2 Second party anyName. Can be undefined in case compare_1_2 is true
     * @param {boolean} compare_1_2 Default false. Whether to compare to first or second place instead of a specific second party.
     * @returns {*} Object with relevant values
     * @todo return type (doc)
     */
    collectedPropDistance(fieldDesc: CollectedFieldDescription, key1: string, key2: ?string, compare_1_2: boolean = false): ?{| type: string, desc: string, votes1: number, votes2: number, totalValid: number |} {
        if (!compare_1_2 && !key2) throw new Error("key2 required if not compare_1_2!");
        let rD: CollectedResultDescription = this.collectedProp(fieldDesc);
        let votes1 = rD.results.get(key1);
        if (votes1 === undefined) return;
        let votes2;
        if (compare_1_2) {
            let placementMap = this.collectedPropPlaceMap(fieldDesc);
            if (placementMap.get(1)?.keys?.includes(key1)) {
                if (placementMap.get(1).keys.length > 1) {
                    votes2 = votes1;
                } else votes2 = placementMap.get(2)?.votes;
            } else {
                votes2 = placementMap.get(1)?.votes;
            }
        } else votes2 = rD.results.get(key2);
        if (votes2 === undefined) return;
        let type = votes1 === votes2 ? "equal" : (votes1 > votes2 ? "lead" : "behind");
        let sign = type === "equal" ? "=" : (type === "lead" ? ">" : "<");
        return {
            type: type,
            desc: `${key1} ${sign} ${compare_1_2 && type !== "equal" ? (type === "lead" ? "2." : "1.") : key2}`,
            votes1: votes1,
            votes2: votes2,
            totalValid: rD.value,
        };
    }
}
