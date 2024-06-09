/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
//@flow
import ky from 'ky';

import L from 'leaflet';
import ErgebnisElement from './interface/wahl-ergebniselement';

import { html } from 'lit-element';
import type { TemplateResult } from 'lit-element';
import 'weightless/title';
import 'weightless/dialog';
import { showDialog } from 'weightless/dialog';

/**
 * Fetch a GeoJSON file. If the same file was already loaded, get it without a new HTTP request.
 *
 * @async
 * @param {string} geoJsonPath Path to the GeoJSON file
 * @param {string} baseUrl Base URL for the path to the GeoJSON file
 * @returns {Promise<object>} Promise that resolves to GeoJSON Object
 */
export async function fetchGeoJson(geoJsonPath: string, baseUrl: string): Promise<{ [key: string]: any }> {
    if (!window.geoJsonMap) window.geoJsonMap = new Map();
    let saved = window.geoJsonMap.get(baseUrl+geoJsonPath);
    if (saved) return saved;
    let r = await ky(geoJsonPath, { prefixUrl: baseUrl });
    let json = await r.json();
    window.geoJsonMap.set(baseUrl+geoJsonPath, json);
    return json;
}

/* -------------------------------------------------------------------------- */
/*                            Tangram interactivity                           */
/* -------------------------------------------------------------------------- */

/**
 * Function that gets called from the Tangram layer on map hover.
 * Changes cursor style, shows/hides tooltip, and highlights area.
 *
 * @param {*} selection Selection object from Tangram
 */
export function hoverGebiet(selection) {
    // https://www.mapzen.com/blog/tangram-interactivity/
    document.getElementById('map').style.cursor = selection.feature ? 'pointer' : '';
    let highlight = true;
    let wC = window.wahlController;
    let map = wC._Lmap;
    let layer = wC._layer;
    let extra_data = layer.scene.sources?.districts?.extra_data;
    if (!selection.feature) {
        if (window._tooltip) window._tooltip.remove();
        if (highlight && extra_data && Object.keys(extra_data.idHighlighted).length) {
            extra_data.idHighlighted = {};
            //if (!(layer.scene.building/* && layer.scene.building.queued*/)) {
            layer.scene.rebuild({sources: ["districts"]});
        }
        return;
    }
    // console.log("hover", selection);
    let latlng = selection.leaflet_event.latlng;
    if (selection.changed) {
        let id = selection.feature.properties[wC.activeEbene.config.keyProp];
        let gs = selection.feature.properties[wC.activeEbene.config.gsProp];
        //let gebiet = wC.activeEbene.getGebiet(id, gs);
        //console.log(gebiet);
        let content = selection.feature.properties["tooltipContent"];
        if (!window._tooltip) {
            window._tooltip = new L.Tooltip({ className: 'gebietTooltip', offset: [15, 0] }, layer).setContent(content);
        } else {
            window._tooltip.setContent(content);
        }
        let gsObj = extra_data.idHighlighted[gs];
        if (highlight && !(gsObj && Object.keys(gsObj).length === 1 && id in gsObj)) {
            extra_data.idHighlighted = { [gs]: { [id]: true }};
            //if (!(layer.scene.building/* && layer.scene.building.queued*/)) {
            layer.scene.rebuild({sources: ["districts"]});
        }
    }
    window._tooltip.setLatLng(latlng);
    if (!window._tooltip.isOpen()) window._tooltip.addTo(map);
}

/**
 * Function that gets called from the Tangram layer on map click.
 * Opens new dialog with {@link ErgebnisElement}.
 *
 * @param {*} selection Selection object from Tangram
 */
export function clickGebiet(selection) {
    if (!selection.feature) return;
    //console.log("click", selection);
    // todo: was wenn layer.gebiet undefined.
    let pElement = new ErgebnisElement();
    let wC = window.wahlController;
    let map = wC._Lmap;
    let layer = wC._layer;
    let extra_data = layer.scene.sources.districts.extra_data;
    let id = selection.feature.properties[extra_data["idProperty"]];
    let gs = selection.feature.properties[extra_data["gsProperty"]];
    let gebiet = wC.activeEbene.getGebiet(id, gs);
    let ergebnisAnalysis = gebiet.ergebnisAnalysis(wC.stimmzettelGebietFilter);
    pElement.wahl = wC.activeWahl;
    pElement.ergebnisAnalysis = ergebnisAnalysis;
    // todo: im ErgebnisElement mehr infos wie bei gesamtergebnis, sowie infos und warnings immernoch
    newDialog({
        header: gebiet.name,
        headerLevel: "4",
        size: "large",
        content: pElement,
        //footer: html`<wl-button @click=${()=>{this.loadDataDialog(); fn.call(ref)}}>Neu laden</wl-button>`,
        persistent: false});
}

/* -------------------------------------------------------------------------- */
/*                                   Dialog                                   */
/* -------------------------------------------------------------------------- */

window.dialogRefs = [];

/** Close the currently globally referenced dialogs */
export function closeDialog(): void {
    // if (window.dialogRef && window.dialogRef.overlay.open) {
    window.dialogRefs.forEach((dialogRef) => {dialogRef.overlay.hide()});
    window.dialogRefs = [];
}

type newDialogArgs = {header: string, headerLevel?: string, content?: TemplateResult, footer?: TemplateResult, size?: string, persistent?: boolean};
/**
 *  Create a new globally referenced dialog
 *
 * @async
 * @param {newDialogArgs} {} Parameters for showDialog configuration object
 * @returns {Promise<any>} .
 */
export async function newDialog({header, headerLevel = "3", content = "", footer = "", size = "auto", persistent = false}: newDialogArgs): Promise<any> {
    closeDialog();
    return showDialog({
        fixed: true,
        backdrop: true,
        blockScrolling: true,
        container: document.body,
        size: size,
        duration: 200,
        persistent: persistent,
        template: html`
            <wl-title level="${headerLevel}" slot="header">${header}</wl-title>
            <div slot="content">
                ${content}
            </div>
            <div slot="footer">
                ${footer}
            </div>`
    }).then((ref) => { window.dialogRefs.push(ref) });
}
