/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import Wahl from './wahl-lib/wahl';
import L from 'leaflet';
import geostats from 'geostats';
//$FlowIgnore[cannot-resolve-module]
import 'geostats/lib/geostats.css';
import chroma from 'chroma-js';
import dissolve from '@turf/dissolve';
import flatten from '@turf/flatten';
import { featureEach } from '@turf/meta';

import './interface/wahl-maincontrol';
import './interface/wahl-ebenencontrol';
import './interface/wahl-ergebnissecontrol';
import './interface/wahl-legendcontrol';
import ErgebnisElement from './interface/wahl-ergebniselement';
import { html } from 'lit-element';
import 'weightless/text';
import 'weightless/title';
import 'weightless/button';
import 'weightless/card';
import 'weightless/list-item';
import 'weightless/progress-spinner';
import { fetchGeoJson, newDialog, closeDialog } from './utils';

import type { WahlConfigType, Stimmzettel, Ebene } from './wahl-lib/wahl';
import type { ErgebnisAnalysisCollection, FieldDescription, DataTypeAndArgsType } from './wahl-lib/ergebnis';

export type WahlTerminConfigType = {|
    baseUrl: string,
    name: string,
    wahlDatumStr: string,
    defaultCenter: [number, number],
    defaultZoom: number,
    wahlen: Array<WahlConfigType>
|};

export type GesamtWahlConfigType = {|
    wahltermine: Array<WahlTerminConfigType>
|};

/**
 * Main controller class for the election data visualisation web application.
 * Manages {@link Wahl} objects grouped using "Wahltermine" in the config that is provided to the controller.
 * (By default, the first "Wahltermin" of the configuration is going to be loaded)
 * The currently active Wahl object and related {@link Ebene}, {@link ErgebnisAnalysisCollection}, property and more are managed here as well.
 * A leaflet map and Tangram layer object also have to be provided. Relevant controls are added to the map on instantiation.
 *
 * @class WahlController
 */
export default class WahlController {
    _wahlenConfig: GesamtWahlConfigType;
    _wahlTerminConfig: WahlTerminConfigType;
    _activeWahl: ?Wahl;
    _activeEbene: ?Ebene;
    _activeEAC: ?ErgebnisAnalysisCollection;
    _activeProp: ?FieldDescription;
    _activeDataType: ?DataTypeAndArgsType; // relevant for collected prop
    _activeGeostats;
    _wahlen: Map<string, Wahl>;
    _mainControl: any; // todo
    _ebenenControl: any; // todo
    _ergebnisseControl: any; // todo
    _legendControl: any; // todo
    _stimmzettelGebietFilter: ?Stimmzettel;
    _Lmap;
    _layer;

    /**
     * Creates an instance of WahlController.
     * 
     * @param {GesamtWahlConfigType} wahlenConfig Configuration of possible election groups and election configs.
     * @param {*} Lmap Leaflet map reference
     * @param {*} layer Tangram layer reference
     */
    constructor(wahlenConfig: GesamtWahlConfigType, Lmap, layer) {
        if (!wahlenConfig) throw new TypeError("wahlenConfig required");
        if (!Lmap || !layer) throw new TypeError("Leaflet map object and Tangram layer required");
        this._Lmap = Lmap;
        this._layer = layer;
        this._mainControl = L.control.mainControl(this, {
            position: 'topleft',
        }).addTo(Lmap);
        this._ebenenControl = L.control.ebenenControl(this, {
            position: 'topleft',
        }).addTo(Lmap);
        this._ergebnisseControl = L.control.ergebnisseControl(this, {
            position: 'topleft',
        }).addTo(Lmap);
        this._legendControl = L.control.wahlLegendControl({
            position: 'bottomleft',
        }).addTo(Lmap);
        this._wahlenConfig = wahlenConfig;
        this._initializeWahlTermin(wahlenConfig.wahltermine[0]);
    }

    /**
     * Create new {@link Wahl} objects from a Wahltermin config (group of elections).
     * If there is only one Wahl object, it is going to be set as the active Wahl.
     * The Leaflet map view is set to the configured default center & zoom.
     *
     * @param {WahlTerminConfigType} wahlTerminConfig Configuration of possible election groups and election configs.
     * @see Wahl
     */
    _initializeWahlTermin(wahlTerminConfig: WahlTerminConfigType) {
        if (!wahlTerminConfig) throw new TypeError("undefined wahlTerminConfig provided");
        this.activeWahl = undefined;
        this._wahlTerminConfig = wahlTerminConfig;
        this._wahlen = new Map();
        for (let wahlConfig of this.wahlTerminConfig.wahlen) {
            if (this._wahlen.has(wahlConfig.name)) throw new Error(`duplicate wahl-name ${wahlConfig.name}!`);
            this._wahlen.set(wahlConfig.name, new Wahl(wahlConfig, this.baseUrl, this.handleDataSuccess.bind(this), this.handleDataError.bind(this)));
        }
        if (this._wahlen.size === 1) this.activeWahl = this._wahlen.values().next().value; // calls setter
        this._Lmap.setView(wahlTerminConfig.defaultCenter, wahlTerminConfig.defaultZoom);
        this.updateControls();
    }

    set wahlTerminConfig(wahlTerminConfig: WahlTerminConfigType) {
        this._initializeWahlTermin(wahlTerminConfig);
    }

    get wahlTerminConfig(): WahlTerminConfigType {
        return this._wahlTerminConfig;
    }

    /**
     * Load data for the currently active {@link Wahl} object.
     * Displays a dialog while the data is being loaded.
     * The Wahl object calls the data success/error callbacks of this!
     *
     * @async
     * @param {boolean} reload Whether to freshly reload in case the data was already loaded.
     * @returns {Promise<boolean>} A Promise resolving to a boolean whether the data was freshly loaded.
     * @see Wahl
     * @see handleDataSuccess
     * @see handleDataError
     */
    async loadActiveWahl(reload: boolean): Promise<boolean> {
        if (!this.activeWahl) { /* console.warn("not loading activeWahl, there is none"); */ return }
        // evtl. anders umsetzen, direkt wissen ob evtl. dialog nicht notwendig ist.
        await this.loadDataDialog();
        //$FlowIgnore[incompatible-use]
        return this.activeWahl.loadData(reload);
    }

    get activeDataType(): ?DataTypeAndArgsType { return this._activeDataType }
    /**
     * The active data type is relevant for "collected" properties and describes additional parametrized analyses based on party/placement.
     * this.applyData has to be explicitly called afterwards.
     */
    set activeDataType(obj: ?DataTypeAndArgsType) {
        // todo checks?
        this._activeDataType = obj;
        this._activeGeostats = undefined;
        this.updateLegend();
        //this.applyData();
    }

    get activeEAC(): ?ErgebnisAnalysisCollection { return this._activeEAC }
    /**
     * The active {@link ErgebnisAnalysisCollection} is used from {@link WahlController#applyData}.
     * That method is also called from this setter.
     * In case there is no set active property, it is set to the first defined property of that Ergebnis type.
     * In case the (collected) property has "defaultDataTypeAndArgsIfInitial" defined, that default data type & args is used as default.
     */
    set activeEAC(EAC: ?ErgebnisAnalysisCollection) {
        if (EAC && EAC.wahl !== this.activeWahl) throw new Error("ErgebnisAnalysisCollection not bound to active Wahl");
        this._activeEAC = EAC;
        this._activeGeostats = undefined;
        let suppressApply = false;
        if (EAC && EAC.properties.length && !this.activeProp) {
            this.activeProp = EAC.properties[0];
            let _dTA = this.activeProp.defaultDataTypeAndArgsIfInitial;
            if (_dTA) {
                if (!_dTA.args?.length) throw new Error("args should exist & at least 1");
                suppressApply = true;
                this.updateErgebnisseControl().then(()=>{this.updateErgebnisseControl()}).then(()=>{
                    let elem = this._ergebnisseControl.getContainer();
                    if (!elem) throw new TypeError("ergebnissecontrol should be rendered to apply defaults");
                    let propElem = elem.renderRoot.querySelector(`#${this.activeProp.propName}`);
                    let selectElem = propElem.renderRoot.querySelector(`#${_dTA.type.id}`);
                    selectElem.value = _dTA.args.length > 1 ? _dTA.args : _dTA.args[0];
                });
            }
        } else if (!EAC) {
            this.activeProp = undefined;
        } /*else {
            //this.applyData();
        }*/
        if (!suppressApply) {
            this.updateControls();
            this.applyData();
        }
    }

    resetData(rebuild: boolean = true) {
        let extra_data = this._layer.scene.config?.sources?.districts?.extra_data;
        if (extra_data) {
            extra_data.idColors = {};
            extra_data.idNoData = {};
            extra_data.idClassName = {};
            extra_data.idClassNr = {};
            extra_data.idHighlighted = {};
            extra_data.idTooltipContents = {};
            extra_data.markedClassName = undefined;
            extra_data.markedClassNr = undefined;
        }
        if (rebuild) {
            this.updateLegend();
            if (extra_data) this._layer.scene.rebuild({sources: ["districts"]});
        }
    }

    /**
     * Get data values, classes, colors for every district of the active {@link ErgebnisAnalysisCollection}.
     * For representing the data in bins on a choropleth map.
     * Updates legend and extra_data, including tooltip contents (+rebuilds the scene to update the visual representation).
     * 
     * This method does not need any parameters and only relies on the currently set "active" properties of this, especially activeEAC, activeProp & activeDataType!
     */
    applyData() {
        if (!this.activeEAC || !this.activeProp) {
            this.resetData();
            return;
        }
        console.log(this.activeProp.propName, this.activeDataType?.type.id, this.activeDataType?.args);
        let result = this.activeEAC[this.activeProp.propName][this.activeDataType?.type.id];
        if (!result) {
            console.warn("no result");
            this.resetData();
            return;
        }
        let data;
        if (result.fn) {
            if (!this.activeDataType) throw new TypeError("Result with function, activeDataType required in WahlController");
            if (!(this.activeDataType.args && this.activeDataType.args.length)) return; // ..?
            data = result.fn(...this.activeDataType.args);
        } else data = result;
        if (!data || !data.data || !data.data.length || data.data.every(v=>isNaN(v))) {
            console.warn("no data");
            this.resetData();
            return;
        }
        let defaultBinNum = 7;
        let defaultColor = "#8c2d04"; // used if class has no colors
        let defaultNoDataColor = [0.1, 0.1, 0.1, 0.1]; // alternatively: undefined, so the no-data polygons will not be selectable at all.
        let baseColor = "#fff";
        let baseMixProportion = 0.15; // how much to mix the class color and the "start"/base color, so the lowest values aren't all e. g. the same white but tinted a bit
        let _clSet = data.classes && new Set(data.classes);
        if (_clSet && _clSet.size && !(data.classColors && data.classColors.size === _clSet.size)) {
            throw new Error("there are classes but no or the wrong amount of classColors");
        }
        let gs = new geostats();
        this._activeGeostats = gs;
        gs._originalDataObj = data;
        gs.serie = [...data.data];
        let _dataValues = data.data.reduce((p, v) => p+!!v, 0);
        // console.log(gs.serie, _dataValues);
        // reduce bin amount in some cases to avoid errors
        let binNum = Math.min(Math.max(1, Math.min(Math.floor(_dataValues/2), defaultBinNum)), new Set(gs.serie).size);
        gs.getClassJenks(binNum);
        let singleColor = (data.classColors?.size <= 1 && data.classColors.values().next().value) || defaultColor;
        let defaultRange = chroma.scale([chroma.mix(baseColor, singleColor, baseMixProportion), singleColor]).domain([gs.min(), gs.max()]).correctLightness().colors(binNum);
        let colorRanges = new Map();
        let classCounts;
        let _classAmount = (classArr, class_) => { return classArr.reduce((sum, currentClass)=>sum+(currentClass===class_), 0) };
        if (data.classColors) {
            classCounts = new Map();
            for (let [class_, color] of
                // sort by occurrence
                [...data.classColors.entries()]
                    .sort(
                        ([ka, va], [kb, vb])=>(
                            _classAmount(data.classes, kb)-_classAmount(data.classes, ka))
                    )) {
                // using complete gs domain!!
                colorRanges.set(class_, chroma.scale([chroma.mix(baseColor, color, baseMixProportion), color]).domain([gs.min(), gs.max()]).correctLightness().colors(binNum));
                classCounts.set(class_, new Map());
            }
            for (let _i = 0; _i < data.data.length; _i++) {
                let _classCountMap = classCounts.get(data.classes[_i]);
                let _classNr = gs.getClass(data.data[_i]);
                if (!_classCountMap.has(_classNr)) _classCountMap.set(_classNr, 0);
                _classCountMap.set(_classNr, _classCountMap.get(_classNr) + 1);
            }
        }
        if (!colorRanges.size) colorRanges.set(undefined, defaultRange);
        gs.colors = defaultRange; // not actually used anymore
        gs._colorRanges = colorRanges;
        gs._classCounts = classCounts;
        this.updateLegend();
        // properties by gs (may be undefined, depends on 'uniqueId'!) and id, nested.
        let cObj = {}; // color
        let cNaObj = {}; // class name
        let cNrObj = {}; // bin number
        let nDObj = {}; // no data
        let tObj = {}; // tooltip content
        for (let [g, eA] of this.activeEAC.entries()) {
            let gemS = this.activeEbene.uniqueId ? undefined : g.gs;
            if (!cObj[gemS]) cObj[gemS] = {};
            if (!cNaObj[gemS]) cNaObj[gemS] = {};
            if (!cNrObj[gemS]) cNrObj[gemS] = {};
            if (!nDObj[gemS]) nDObj[gemS] = {};
            if (!tObj[gemS]) tObj[gemS] = {};
            let gs = this._activeGeostats;
            let index = gs._originalDataObj.gebiete.indexOf(g);
            let indexData;
            let class_ = gs._originalDataObj?.classes?.[index];
            let classNo;
            let color = defaultNoDataColor;
            if (index >= 0) {
                indexData = gs._originalDataObj.data[index];
                classNo = gs.getClass(indexData);
                // TODO "Unable to get value's class.", also wenn string!
                color = colorRanges.get(class_)[classNo];
            }
            cObj[gemS][g.nr] = color;
            cNaObj[gemS][g.nr] = class_;
            cNrObj[gemS][g.nr] = classNo;
            nDObj[gemS][g.nr] = index === -1;
            let _strArgs = this.activeDataType?.args?.join(', ');
            let parteiMap = this.activeWahl.parteien;
            let _nnErgL = eA.notNullErgebnisseLength;
            let _ergL = eA.ergebnisseLength;
            tObj[gemS][g.nr] = `<h3 style="margin: 0.3rem 0">${g.name}</h3>`
                + `<em style="white-space: normal;"><strong>${this.activeProp.name}</strong>`
                + `${result.fn ? ` &ndash; ${this.activeDataType.type.name} &ndash; <strong>${_strArgs}</strong>` : ""}`
                // if the args list equals the class, don't repeat it. useful for proportion results
                + `</em>${(class_ && (!_strArgs || class_ !== _strArgs)) ? `<br/><strong>${class_}</strong>: `: ': '}`
                + `<strong>${(indexData === undefined)
                    ? "-"
                    : (typeof indexData === "number" && !(this.activeProp.isSum(this.activeDataType?.type.id)))
                        ? indexData.toFixed(2)+"%"
                        : indexData
                }</strong>`
                + `<hr/>${eA.collectedProperties.filter(prop=>prop.displayInTooltip).map(prop=>{
                    let rD = eA[prop.propName];
                    // horizontal proportional bar graph not ordered by value!
                    return `<h4 style="margin: 0.2rem 0">${prop.name} (${rD.value})</h4>`
                        + `<div style="height: 0.8rem; width: 100%">`
                        + `${[...rD.results.entries()].map(
                            ([anyName, votes])=>
                                `<div style="display: inline-block; height: 100%; width: ${(votes/rD.value*100).toFixed(3)}%; background-color: ${parteiMap.get(anyName)?.rgbWert}"></div>`
                        ).join("")}</div>`;
                }).join("")}`
                + `${[...eA.constantProperties, ...eA.calculatedProperties].filter(prop=>prop.displayInTooltip).map((prop)=>{
                    let val = eA[prop.propName].value;
                    let str = prop.name + ": " + (val === undefined
                        ? "-"
                        : (prop.isSum(this.activeDataType?.type.id)
                            ? val.toString()
                            : ((val*100).toFixed(2) + "%")));
                    return `${str}<br/>`;}).join("")}`
                + `${_ergL <= 1
                    ? (_nnErgL ? "" : "<small>Ergebnis liegt nicht vor</small>")
                    : `<small><strong>${_ergL === _nnErgL ? `Alle ${_ergL}` : `${_nnErgL}/${_ergL}`}</strong> Ergebnisse des Gebiets liegen vor</small>`}`;
        }
        console.log(data, this._activeGeostats);
        let extra_data = this._layer.scene.config.sources.districts.extra_data;
        extra_data.idColors = cObj;
        extra_data.idClassName = cNaObj;
        extra_data.idClassNr = cNrObj;
        extra_data.idNoData = nDObj;
        extra_data.idHighlighted = {}; // resets
        extra_data.idTooltipContents = tObj;
        extra_data.markedClassName = undefined; // resets
        extra_data.markedClassNr = undefined; // resets
        this._layer.scene.rebuild({sources: ["districts"]});
    }

    get activeProp(): ?FieldDescription { return this._activeProp }
    /**
     * The active {@link FieldDescription} describes the property that is currently going to be used for displaying the data.
     * It should also be part of the currently active {@link ErgebnisAnalysisCollection}.
     * this.applyData has to be explicitly called afterwards (or after additionally changing the activeDataType!)
     *
     * @see activeEAC
     * @see activeDataType
     */
    set activeProp(prop: ?FieldDescription) {
        if (prop && !this.activeEAC) throw new Error("won't set activeProp without an active ErgebnisAnalysisCollection");
        if (prop && !this.activeEAC.properties.includes(prop)) throw new Error("prop not included in active ErgebnisAnalysisCollection");
        this._activeProp = prop;
        this.activeDataType = undefined;
        this.updateControls(); // for updating the 'active' status
        //this.applyData();
    }

    /**
     * Loading the GeoJSON data is the responsibility of this and is not part of the data loading in {@link Wahl}.
     * GeoJSON data is loaded for the currently active {@link Ebene}.
     * Displays a dialog while the data is being loaded (unless another dialog already exists, e. g. on initial loading).
     *
     * @async
     * @returns {Promise<object>} Promise that resolves to the GeoJSON object.
     */
    async loadGeoJson(): Promise<Object> {
        if (!this.activeEbene) throw new Error("can't load GeoJSON for no active Ebene");
        if (!this.activeEbene.config.geoJson) return;
        if (!(window.dialogRefs.length && window.dialogRefs.some((dialogRef) => { return dialogRef.overlay.open } ))) await this.loadDataDialog();
        try {
            let result = await fetchGeoJson(this.activeEbene.config.geoJson, this.activeWahl.baseUrl);
            return result;
        }
        catch (err) {
            this.handleDataError(err, this, this.loadGeoJson);
        }
    }

    /**
     * Fit Leaflet map view to bounds of currently active GeoJSON data.
     * Currently not implemented!
     *
     * @todo
     */
    fitGeoBounds() {
        /*
        let bounds = this._activeGeoJsonLayer.getBounds();
        // todo ersatz
        this._Lmap.fitBounds(
            bounds,
            {
                paddingTopLeft: [100, 10],
                paddingBottomRight: [0, 5]
            }
        );
        */
    }

    /** Remove current districts layer and call updateConfig on the Tangram scene. */
    removeGeoLayer() {
        if (this._layer.scene.config?.sources?.districts?.url) {
            if (delete this._layer.scene.config.sources.districts) 
                this._layer.scene.updateConfig();
        }
    }

    /**
     * Call an async function and add a .then with scene.rebuild in case the scene was currently dirty/building.
     * Initially, the idea was to use a view_complete handler and to unsubscribe inside of it
     * This seems good enough for the situation on page loads.
     * Displaying the district data this way does not cause a map that's left rendered incompletely.
     *
     * @async
     * @param {Function} fn Function that returns a Promise
     * @returns {Promise<any>} .
     */
    async carefulFunction(fn: (...any)=>any): Promise<any> {
        let scene = this._layer.scene;
        if (scene.dirty || scene.building) {
            return fn().then(()=>{scene.rebuild()});
        } else {
            return fn();
        }
    }

    /**
     * Set a given GeoJSON data object as the data source for the Tangram scene `districts` source.
     * The property extra_data and the transform function are essential for coloring the map and showing tooltips.
     *
     * @async
     * @param {object} geoJson GeoJSON data object.
     * @returns {Promise<any>} .
     */
    async _setGeoJsonSource(geoJson: Object): Promise<any> {
        return this._layer.scene.setDataSource("districts", {
            type: "GeoJSON",
            data: geoJson,
            extra_data: {
                idProperty: this.activeEbene.config.keyProp,
                gsProperty: this.activeEbene.config.gsProp,
                idColors: {},
                idNoData: {},
                idClassName: {},
                idClassNr: {},
                idHighlighted: {},
                idTooltipContents: {},
                markedClassName: undefined,
                markedClassNr: undefined,
            },
            transform: function(data, extra_data) {
                if (data) {
                    data.features.forEach(function(feature) {
                        let p = feature.properties;
                        let pGs = p[extra_data.gsProperty];
                        let pId = p[extra_data.idProperty];
                        p.color = extra_data.idColors[pGs]?.[pId];
                        p.nodata = extra_data.idNoData[pGs]?.[pId];
                        p.className = extra_data.idClassName[pGs]?.[pId];
                        p.classNr = extra_data.idClassNr[pGs]?.[pId];
                        p.highlighted = extra_data.idHighlighted[pGs]?.[pId];
                        p.tooltipContent = extra_data.idTooltipContents[pGs]?.[pId];
                        if (extra_data.markedClassName !== undefined && extra_data.markedClassNr !== undefined) {
                            p.marked = p.className === extra_data.markedClassName && p.classNr === extra_data.markedClassNr;
                        } else if (extra_data.markedClassName !== undefined) {
                            p.marked = p.className === extra_data.markedClassName;
                        } else if (extra_data.markedClassNr !== undefined) {
                            p.marked = p.classNr === extra_data.markedClassNr;
                        } else p.marked = undefined;
                    });
                }
                return data;
            }
        });
    }

    get activeEbene(): ?Ebene { return this._activeEbene }
    /**
     * Sets an {@link Ebene} as the active Ebene and tries to load GeoJSON data for it.
     * Also creates an {@link ErgebnisAnalysisCollection} for it.
     */
    set activeEbene(ebene: ?Ebene) {
        if (ebene && ebene.wahl !== this.activeWahl) throw new Error("Ebene to be activated is not part of active Wahl!");
        this._activeEbene = ebene;
        if (ebene) {
            this._activeEAC = undefined; // does not call setter
            let warnings = [];
            this.loadGeoJson().then((geoJson)=>{
                if (!geoJson) {
                    console.warn("no geodata for this Ebene", ebene);
                    this.activeEAC = undefined; // calls setter
                    this.removeGeoLayer();
                    return;
                }

                if (ebene.config.dissolve) {
                    let dissolveField = ebene.config.keyProp;
                    if (ebene.isVirtual) {
                        featureEach(geoJson, feature => {
                            let wG = this.activeWahl.wahlEbene.getGebiet(feature.properties[ebene.config.keyProp], !ebene.uniqueId && feature.properties[ebene.config.gsProp] );
                            let pO = wG.partOf.get(ebene);
                            if (pO.size !== 1) throw new Error(`Could not find 1 virtual Gebiet for ${feature}`);
                            feature.properties[ebene.config.virtualField] = pO.values().next().value.nr;
                        });
                        dissolveField = ebene.config.virtualField;
                    }
                    geoJson = dissolve(flatten(geoJson), {propertyName: dissolveField});
                    if (ebene.isVirtual) featureEach(geoJson, feature => { feature.properties[ebene.config.keyProp] = feature.properties[dissolveField]});
                }

                // let gebieteLayers = new Map();
                featureEach(geoJson, (feature, featureIndex) => {
                    let keyId = feature.properties[ebene.config.keyProp];
                    let gs = ebene.uniqueId ? undefined : feature.properties[ebene.config.gsProp];
                    let gebiet;
                    let featureIdentifier;
                    if (!keyId) {
                        let anyId = feature.properties["id"] ?? feature.id;
                        featureIdentifier = anyId ? ("id " + anyId) : ("index " + featureIndex);
                        let warningText = `keyId empty for feature ${featureIdentifier}`;
                        warnings.push(warningText);
                        console.warn(warningText, feature);
                    } else {
                        featureIdentifier = `key ${keyId} gs ${gs}`;
                        gebiet = ebene.getGebiet(keyId, gs);
                        if (!gebiet) {
                            let warningText = `GeoJSON Feature ${featureIdentifier} not found in Ebene`;
                            warnings.push(warningText);
                            console.warn(warningText, feature, ebene);
                        } else {
                            gebiet._feature = feature;
                        }
                        // the following is acceptable because of cases where one would otherwise expect a multipolygon
                        // if (gebieteLayers.has(gebiet)) throw new Error(`duplicate GeoJSON Feature for key ${keyId} gs ${gs}`);
                    }
                    // feature.gebiet = gebiet;
                    // if (gebiet) gebieteLayers.set(gebiet, feature);
                });

                ebene.flat.forEach(gebiet => {
                    if (gebiet.geoExpected && !gebiet._feature) {
                        let warningText = `Expected geodata for Gebiet ${gebiet.nr} (${gebiet.name}), not provided`;
                        warnings.push(warningText);
                        console.warn(warningText, gebiet);
                    }
                });

                // Tangram calls updateConfig if source is new, otherwise we'll do it ourselves
                let load = (this._layer.scene.config.sources["districts"] == null);
                this.carefulFunction(async ()=>{
                    return this._setGeoJsonSource(geoJson).then(()=>{
                        if (!load) this._layer.scene.updateConfig();
                        this.fitGeoBounds();
                        this.activeEAC = ebene.ergebnisAnalysisCollection(this.stimmzettelGebietFilter);
                        if (warnings.length) {
                            newDialog({
                                header: "Es liegen Warnungen vor:",
                                headerLevel: "3",
                                content: html`<ul>${warnings.map(x => html`<li>${x}</li>`)}</ul>`,
                                persistent: false});
                        }
                        else {
                            closeDialog();
                        }
                    });
                });
            }).catch((reason) => {
                console.log(reason);
                this.handleDataError(reason, this, () => { this.activeEbene = ebene });
                this.activeEAC = undefined;
                this.removeGeoLayer();
            });
        } else {
            this.activeEAC = undefined;
            this.removeGeoLayer();
        }
    }

    get activeWahl(): ?Wahl { return this._activeWahl }
    /** Set the active {@link Wahl}. In case it is already the currently set active Wahl, it cues a fresh data reload. */
    set activeWahl(wahl: ?Wahl) {
        this.activeEbene = undefined;
        this._stimmzettelGebietFilter = undefined;
        this.activeProp = undefined;
        // experimental idea
        let reload = this.activeWahl === wahl;
        this._activeWahl = wahl;
        this.loadActiveWahl(reload).then(()=>{
            this.updateControls();
        });
    }

    get wahlen(): Map<string, Wahl> {
        return this._wahlen;
    }

    get stimmzettelGebietFilter(): ?Stimmzettel { return this._stimmzettelGebietFilter }
    /**
     * Set the currently active filter based on a {@link Stimmzettel} object.
     * Changes the currently active {@link ErgebnisAnalysisCollection} to a filtered one.
     */
    set stimmzettelGebietFilter(val: ?Stimmzettel) {
        if (val && val.wahl !== this.activeWahl) throw new Error("Stimmzettel to filter by not part of active Wahl");
        this._stimmzettelGebietFilter = val;
        if (!this.activeEbene) return;
        this.activeEAC = this.activeEbene.ergebnisAnalysisCollection(val);
        // in eac setter: this.applyData();
    }

    set mainControl(val: any) { // type Todo
        this._mainControl = val;
        this.updateControls();
    }

    get mainControl(): any { // type Todo
        return this._mainControl;
    }

    set ebenenControl(val: any) { // type Todo
        this._ebenenControl = val;
        this.updateControls();
    }

    get ebenenControl(): any { // type Todo
        return this._ebenenControl;
    }

    set ergebnisseControl(val: any) { // type Todo
        this._ergebnisseControl = val;
        this.updateControls();
    }

    get ergebnisseControl(): any { // type Todo
        return this._ergebnisseControl;
    }

    set legendControl(val: any) { // type Todo
        this._legendControl = val;
        this.updateControls();
    }

    get legendControl(): any { // type Todo
        return this._legendControl;
    }

    get name(): string { return this._wahlTerminConfig.name }
    // get wahlBehoerdeGs(): string { return this._wahlTerminConfig.wahlBehoerdeGs }
    get wahlDatumStr(): string { return this._wahlTerminConfig.wahlDatumStr }
    get baseUrl(): string { return this._wahlTerminConfig.baseUrl }

    /**
     * Set properties related to marking a specific class and/or bin and cue a rebuild of the districts layer.
     * Currently, this causes only the relevant districts to be shown and others are fully hidden.
     *
     * @param {?string} className Data class name
     * @param {?number} classNr Data class class/bin number
     * @returns {undefined} 
     */
    markClass(className: ?string, classNr: ?number) {
        let extra_data = this._layer.scene.config.sources.districts.extra_data;
        if (extra_data.markedClassName === className && extra_data.markedClassNr === classNr) return;
        extra_data.markedClassName = className;
        extra_data.markedClassNr = classNr;
        this._layer.scene.rebuild({sources: ["districts"]});
    }

    /**
     * Request update on the {@link ErgebnisseControlElement} and also cue updates for the {@link ErgebnisPropElement}.
     * Also resets the args select elements of the props that aren't currently active
     *
     * @returns {Promise<any>} .
     */
    async updateErgebnisseControl() {
        let elem = this._ergebnisseControl?.getContainer();
        if (!elem) return;
        elem.requestUpdate();
        return elem.updateComplete.then(()=>{
            elem.renderRoot.querySelectorAll("ergebnis-prop").forEach(eP=>{
                if(eP.prop !== elem.wahlController.activeProp) eP.resetArgsSelectElements();
                eP.requestUpdateAndHandle();
            });
        });
    }

    /**
     * Update properties of the {@link LegendControlElement}.
     *
     * @returns {undefined} 
     */
    updateLegend() {
        let legendElement = this._legendControl?.getContainer();
        if (!legendElement) return;
        let gs = this._activeGeostats;
        legendElement.bounds = gs?.bounds;
        legendElement.classColors = gs?._colorRanges;
        legendElement.classCounts = gs?._classCounts;
        legendElement.percentage = !(this.activeProp?.isSum(this.activeDataType?.type.id));
        legendElement.hoverCallback = this.markClass.bind(this);
        legendElement.desc = `${this.activeProp?.name}`
            + `${this.activeDataType ? ` – ${this.activeDataType.type.name} – ${this.activeDataType.args?.join(', ')}` : ""}`;
    }

    /** Cue updates for all controls. */
    updateControls() {
        let mCC: EventTarget = this._mainControl && this._mainControl.getContainer();
        if (mCC) mCC.dispatchEvent(new Event('update'));
        let eCC: EventTarget = this._ebenenControl && this._ebenenControl.getContainer();
        if (eCC) eCC.dispatchEvent(new Event('update'));
        this.updateErgebnisseControl().then(()=>{this.updateLegend()});
    }

    /**
     * Show a new dialog containing the (potentially filtered) total result of the currently active {@link Wahl}.
     *
     * @async
     * @see ErgebnisElement
     */
    async gesamtErgebnisDialog() {
        let gEA = this.activeWahl?.gesamtErgebnisAnalysis(this.stimmzettelGebietFilter);
        if (!gEA) throw new Error("no gesamtErgebnisAnalysis");
        let pElement = new ErgebnisElement();
        pElement.wahl = this.activeWahl;
        pElement.ergebnisAnalysis = gEA;
        pElement.stimmzettelGebietFilter = this.stimmzettelGebietFilter;
        pElement.isGesamt = true;
        await newDialog({
            header: `Gesamtergebnis${this.stimmzettelGebietFilter ? ` (${this.stimmzettelGebietFilter.nr})`: ""}`,
            headerLevel: "3",
            size: "large",
            content: pElement,
            persistent: false
        });
    }

    /**
     * Show a new dialog with the possible election ballot areas to filter everything with.
     *
     * @async
     * @see Stimmzettel
     */
    async gebietFilterDialog() {
        if (this.activeWahl.stimmzettel.has(undefined)) throw new Error("can't filter with undefined value in stimmzettel (there's probably nothing to filter)");
        await newDialog({
            header: "Nach Stimmzettelgebiet filtern",
            headerLevel: "3",
            content: html`<wl-card>
            ${[undefined, ...this.activeWahl.stimmzettel.values()].map((stimmzettel)=>html`
            <wl-list-item type="button" clickable       
                @click=${()=>{
                    if (stimmzettel !== this.stimmzettelGebietFilter) this.stimmzettelGebietFilter = stimmzettel;
                    closeDialog();
                }}
            > <i slot="before">${this.stimmzettelGebietFilter === stimmzettel ? html`&check;`: ""}</i>
                <!--<span slot="after"></span>-->
                <wl-title level="4" style="margin: 0">${stimmzettel?.nr || "kein Filter"}</wl-title>
                <i style="font-size: smaller; text-overflow: ellipsis">${stimmzettel?.bezeichnung}</i>
            </wl-list-item>`)}
            </wl-card>`,
            persistent: false
        });
    }

    /**
     * Show a new dialog with the possible other groups of elections (Wahltermine, see config).
     * On clicking a list item, the {@link WahlController#wahlTerminConfig} of this is changed.
     * 
     * @async
     */
    async wahlterminDialog() {
        await newDialog({
            header: "Wahltermin auswählen",
            headerLevel: "3",
            content: html`<wl-card>
            ${Array.from(this._wahlenConfig.wahltermine).map((wahlTerminConfig)=>html`
            <wl-list-item type="button" clickable       
                @click=${()=>{
                    if (wahlTerminConfig !== this.wahlTerminConfig) this.wahlTerminConfig = wahlTerminConfig;
                    closeDialog();
                }}
            > <i slot="before">${this.wahlTerminConfig === wahlTerminConfig ? html`&check;`: ""}</i>
                <span slot="after">${wahlTerminConfig.wahlDatumStr}</span>
                <wl-title level="4" style="margin: 0">${wahlTerminConfig.name}</wl-title>
                <span style="display: flex">${wahlTerminConfig.wahlen.map((wahlConfig)=>html`<i style="margin-right: 0.4em; font-size: smaller;">${wahlConfig.displayName || wahlConfig.name}</i>`)}</span>
            </wl-list-item>`)}
            </wl-card>`,
            persistent: false
        });
    }

    /**
     * Show a new dialog for data loading.
     *
     * @async
     */
    async loadDataDialog() {
        await newDialog({
            header: "Daten werden geladen . . .",
            headerLevel: "3",
            content: html`<wl-progress-spinner></wl-progress-spinner>`,
            persistent: true
        });
    }

    /**
     * Close data loading dialog, set active {@link Ebene} to the first Ebene.
     *
     * @async
     * @param {boolean} reloaded  Whether the data was freshly loaded.
     * @returns {undefined}
     */
    handleDataSuccess(reloaded: boolean) {
        this.updateControls();
        console.info((reloaded ? "freshly" : "") + " loaded Wahl", this.activeWahl);
        // select an ebene as default
        this.activeEbene = this.activeWahl.ebenen.values().next().value;
    }

    /**
     * Show a new dialog in case there was an error loading the data. Error is rethrown
     *
     * @async
     * @param {Error} err Error object
     * @param {object} ref Object to call the given fn on
     * @param {Function} fn Function to call on clicking the reload button
     * @returns {undefined}
     */
    handleDataError(err: Error, ref: Object, fn: ()=>any): any {
        newDialog({
            header: "Fehler bei Datenabruf",
            headerLevel: "3",
            content: html`<wl-text>${err.toString()}</wl-text>`,
            footer: html`<wl-button @click=${()=>{this.loadDataDialog(); fn.call(ref)}}>Neu laden</wl-button>`,
            persistent: false});
    }
}
