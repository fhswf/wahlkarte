/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import type { Ergebnis, CollectedFieldDescription } from './ergebnis';
import type { ErgebnisAnalysis } from './ergebnis-analysis';
import type { default as Wahl, GebietInterface } from '../wahl';

/**
 * Returned by calculate functions in {@link ErgebnisAnalysisCollection}.
 * "Collected" here refers to the way it is based on many {@link GebietInterface} objects, not that this is for a {@link CollectedFieldDescription}!
 */
export type CollectedResultType = {|
    gebiete: Array<GebietInterface>,
    // labels: 
    data: Array<any>,
    classes: ?Array<any>,
    classColors?: Map<any, any>;
|};

/**
 * Returned by parametrized calculate functions in {@link ErgebnisAnalysisCollection}.
 * keys: Array of possible inputs
 * fn: function that returns {@link CollectedResultType} like a normal calculate function.
 */
export type DataTypeFnResultType = {|
    keys: Array<any>,
    fn: (...any) => CollectedResultType,
|};

/**
 * Used to provide analyses over multiple {@link GebietInterface} objects with each an own {@link ErgebnisAnalysis}.
 *
 * @class ErgebnisAnalysisCollection
 * @augments {Map<GebietInterface, ErgebnisAnalysis>}
 */
export class ErgebnisAnalysisCollection extends Map<GebietInterface, ErgebnisAnalysis> {
    wahl: Wahl;
    get ergebnisType(): Class<Ergebnis> { return this.wahl.ergebnisType }
    get properties(): Array<FieldDescription> { return this.ergebnisType.properties }

    /**
     * Creates an instance of ErgebnisAnalysisCollection.
     * 
     * @param {Wahl} wahl Wahl object this is bound to
     * @param {*} iterable Used for initializing using the {@link Map} constructor
     */
    constructor(wahl: Wahl, iterable) {
        if (!wahl) throw new TypeError("wahl required");
        super(iterable);
        Object.defineProperty(this, "wahl", { enumerable: false, value: wahl });
        for (let fieldDesc of this.properties) {
            Object.defineProperty(this, fieldDesc.propName, { enumerable: true, get: () => this.propFn(fieldDesc) });
        }
        // todo checks u. a. check dass alle values auch ergebnisType sind
        // todo applyData-Dinge hierhin verlagerbar?! viele Parameter ..
    }

    /**
     * Collect values of a property for every {@type GebietInterface} object of this.
     *
     * @param {FieldDescription} fieldDesc Which associated FieldDescription this is for.
     * @returns {CollectedResultType} .
     */
    calculate(fieldDesc: FieldDescription): CollectedResultType {
        //let _map = new Map();
        let gebieteArr = [];
        let dataArr = [];
        for (let [gebiet, ergebnisAnalysis] of this.entries()) {
            let rD = ergebnisAnalysis[fieldDesc.propName];
            if (isNaN(rD.value) || !isFinite(rD.value)) continue;
            gebieteArr.push(gebiet);
            dataArr.push(rD.value*(fieldDesc.isSum() ? 1 : 100));
        }
        return {
            gebiete: gebieteArr,
            //labels: labelArr,
            data: dataArr,
            classes: undefined,
        };
    }

    orderedAnyNameMap(fieldDesc: CollectedFieldDescription) {
        let unorderedResults = new Map();
        let placeOccurrences = new Map();
        let ergebnisse = new Set();
        for (let eA of this.values()) for (let erg of eA.ergebnisse) ergebnisse.add(erg);
        for (let erg of ergebnisse) {
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
        }
        // result map sorted by average placement
        // it shouldn't be required to do this here
        // (the amount of different placement combinations is lower than e. g. the amount of districts of the full election -- hagen, bv wahl: 5 combinations, 156 ergebnisse)
        // BUT! this gives results exactly like votemanager does.. using only the 5 different BV combinations here would cause 1 little difference using this simple algorithm
        let placeArrAvg = placeArr => placeArr.reduce((sum, place) => sum + place, 0) / placeArr.length;
        return new Map(
            [...placeOccurrences.entries()]
                .sort(([ka, va], [kb, vb]) => (
                    // if avg placement is equal, compare using vote count. alternatively it would be possible to compare alphabetically?
                    (placeArrAvg(va) - placeArrAvg(vb)) || (unorderedResults.get(kb) - unorderedResults.get(ka))
                )).map(([anyName, placeArr])=>[anyName, unorderedResults.get(anyName)]));
    }

    orderedAnyNameKeys(fieldDesc: CollectedFieldDescription) {
        return [...this.orderedAnyNameMap(fieldDesc).keys()];
    }

    /**
     * Provide a function to collect proportions for a specific party of a {@type CollectedFieldDescription} for every {@type GebietInterface} object of this.
     *
     * @param {CollectedFieldDescription} fieldDesc Which associated CollectedFieldDescription this is for.
     * @returns {DataTypeFnResultType} .
     */
    calculateCollectedProportions(fieldDesc: CollectedFieldDescription): DataTypeFnResultType {
        return {
            keys: this.orderedAnyNameKeys(fieldDesc),
            fn: (key) => {
                if (key === undefined) return;
                let gebieteArr = [];
                let dataArr = [];
                let classArr = [];
                let colors = new Map([[key, this.wahl.parteien.get(key)?.rgbWert]]);
                for (let [gebiet, ergebnisAnalysis] of this.entries()) {
                    let rD = ergebnisAnalysis[fieldDesc.propName];
                    let votes = rD.results.get(key);
                    if (isNaN(votes) || !isFinite(votes)) continue;
                    let totalValid = rD.value;
                    let percentage = totalValid ? (votes / totalValid)*100 : 0;
                    gebieteArr.push(gebiet);
                    dataArr.push(percentage);
                    classArr.push(key);
                }
                return {
                    gebiete: gebieteArr,
                    //labels: labelArr,
                    data: dataArr,
                    classes: classArr,
                    classColors: colors,
                };
            }
        };
    }

    /**
     * Provide a function to collect proportion value and party for a specific placement of a {@type CollectedFieldDescription} for every {@type GebietInterface} object of this.
     *
     * @param {CollectedFieldDescription} fieldDesc Which associated CollectedFieldDescription this is for.
     * @returns {DataTypeFnResultType} .
     */
    calculateCollectedPlacements(fieldDesc: CollectedFieldDescription): DataTypeFnResultType {
        let max = 0;
        for (let eA of this.values()) {
            let rD = eA[fieldDesc.propName];
            //if (!rD)   . . .
            if (rD.results.size > max) max = rD.results.size;
        }
        let keys = [...Array(max).keys()].map(v=>v+1);
        return {
            keys: keys,
            fn: (key) => {
                if (key === undefined) return;
                let gebieteArr = [];
                let dataArr = [];
                let classArr = [];
                let colors = new Map();
                for (let [gebiet, ergebnisAnalysis] of this.entries()) {
                    let placement = ergebnisAnalysis.collectedPropPlace(fieldDesc, key);
                    if (!placement) continue;
                    let class_ = placement.keys.join("=");
                    let votes = placement.votes;
                    // checking for NaN here shouldn't be required anymore
                    let totalValid = placement.totalValid;
                    let percentage = totalValid ? (votes / totalValid)*100 : 0;
                    let color = this.wahl.parteien.get(class_)?.rgbWert || "white"; // ggf. error falls kein = und trotzdem keine farbe in der map?
                    gebieteArr.push(gebiet);
                    dataArr.push(percentage);
                    classArr.push(class_);
                    colors.set(class_, color);
                }
                return {
                    gebiete: gebieteArr,
                    //labels: labelArr,
                    data: dataArr,
                    classes: classArr,
                    classColors: colors,
                };
            }
        };
    }
    
    /**
     * Provide a function to collect distances between a specific party and another one of a {@type CollectedFieldDescription} for every {@type GebietInterface} object of this.
     * Instead of a second party, the special key value "1./2." can be provided to compare the party to the first place, or in case it is the first place itself, compare it to the second place.
     *
     * @param {CollectedFieldDescription} fieldDesc Which associated CollectedFieldDescription this is for.
     * @returns {DataTypeFnResultType} .
     */
    calculateCollectedDistances(fieldDesc: CollectedFieldDescription): DataTypeFnResultType {
        return {
            keys: this.orderedAnyNameKeys(fieldDesc),
            fn: (key1, key2) => {
                if (key1 === undefined || key2 === undefined || key1 === key2) return;
                let compare_1_2 = key2 === "1./2."; // tmp?!
                let gebieteArr = [];
                let dataArr = [];
                let classArr = [];
                let typeMap = new Map([["lead", "#4d9221"], ["behind", "#c51b7d"], ["equal", "white"]]); // lead/behind from colorbrewer2 7-class PiYG
                let colors = new Map();
                for (let [gebiet, ergebnisAnalysis] of this.entries()) {
                    let distanceResult = ergebnisAnalysis.collectedPropDistance(fieldDesc, key1, key2, compare_1_2);
                    if (!distanceResult) continue;
                    let type = distanceResult.type;
                    if (!typeMap.has(type)) throw new Error(`unexpected type ${type} of distance result`);
                    let class_ = distanceResult.desc; // class human readable
                    colors.set(class_, typeMap.get(type));
                    let totalValid = distanceResult.totalValid;
                    let prop1 = distanceResult.votes1 / totalValid * 100;
                    let prop2 = distanceResult.votes2 / totalValid * 100;
                    let value = 0;
                    if (type === "lead") value = prop1 - prop2;
                    else if (type === "behind") value = prop2 - prop1;
                    gebieteArr.push(gebiet);
                    dataArr.push(value);
                    classArr.push(class_);
                }
                return {
                    gebiete: gebieteArr,
                    //labels: labelArr,
                    data: dataArr,
                    classes: classArr,
                    classColors: colors,
                };
            }
        };
    }

    /**
     * Provide an object with results (or result functions) of calculate function(s) for an associated {@link FieldDescription}.
     *
     * @param {FieldDescription} fieldDesc Which associated FieldDescription this is for.
     * @returns {*} Object with optional data type id as key and as value a {@link CollectedResultType} or {@link DataTypeFnResultType}
     */
    propFn(fieldDesc: FieldDescription) {
        let retObj = {
            undefined: this.calculate(fieldDesc),
        };
        for (let dT of fieldDesc.dataTypes || []) {
            retObj[dT.id] = dT.fn.call(this, fieldDesc);
        }
        return retObj;
    }
}
