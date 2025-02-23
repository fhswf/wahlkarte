/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import 'weightless/card';
import 'weightless/title';
import { Chart, BarElement, BarController, LinearScale, CategoryScale, Tooltip } from 'chart.js';

import type { ErgebnisAnalysis, CollectedFieldDescription } from '../wahl-lib/ergebnis';
import type { Wahl } from '../wahl-lib/wahl';

Chart.register( BarElement, BarController, LinearScale, CategoryScale, Tooltip );

@customElement('ergebnis-chart')
export default class ErgebnisChartElement extends LitElement {
    @property({ attribute: false }) parteiMap: Map<string, Partei>;
    @property({ attribute: false }) ergebnisAnalysis: ErgebnisAnalysis;
    @property({ attribute: false }) prop: CollectedFieldDescription;
    @property({ attribute: false }) chart: Chart;
    @property({ type: String }) proportionName: string;

    static get styles() {
        return css`
            :host {
                --title-font-size-level-4: 0.8rem;
            }
        `;
    }

    constructor() {
        super();
        this.proportionName = "Anteil";
    }

    firstUpdated() {
        // todo: bei setter usw.
        let rD = this.resultDescription;
        if (this.chart) this.chart.destroy();
        this.chart = new Chart(this.renderRoot.querySelector(`#chart`).getContext('2d'), {
            type: 'bar',
            data: {
                labels: Array.from(rD.results.keys()),
                datasets: [{
                    label: this.proportionName,
                    data: Array.from(rD.results.values()).map(r=>r/rD.value),
                    backgroundColor: Array.from(rD.results.keys()).map(anyName=>this.parteiMap?.get(anyName).rgbWert),
                }],
            },
            options: {
                animation: {
                    duration: 0,
                    resize: {
                        duration: 0,
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            // https://www.chartjs.org/docs/latest/configuration/tooltip.html#label-callback
                            label: context => {
                                var label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += (context.parsed.y * 100).toFixed(2) + "%";
                                return label;
                            },
                            afterBody: context => `${rD.fieldDesc.name}: ${context[0].label && rD.results.get(context[0].label)}`,
                        }
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            autoSkip: false,
                            font: {
                                size: 9,
                            },
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value, index, values) => { return (value*100) + "%"},
                        }
                    }
                }
            },
        });
    }

    get resultDescription() { return this.ergebnisAnalysis[this.prop.propName] }

    render() {
        // todo: Warnungen & Informationen an der Karte oder ggf. an den einzelnen Eigenschaften
        return html`<wl-card>
        <wl-title level="4">${this.prop.name}</wl-title>
        <canvas id="chart" width=250 height=150></canvas>
        </wl-card>`;
    }
}


@customElement('ergebnis-table')
export class ErgebnisTableElement extends LitElement {
    @property({ attribute: false }) wahl: Wahl;
    @property({ attribute: false }) ergebnisAnalysis: ErgebnisAnalysis;
    @property({ attribute: false }) prop: CollectedFieldDescription;
    @property({ type: String }) proportionName: string;

    @property({ attribute: false }) stimmzettelGebietFilter: ?Stimmzettel;
    @property({ type: Boolean }) isGesamt: boolean;

    static get styles() {
        return css`
            :host {
                
            }
            table {
                display: block;
                width: 100%;
                overflow: auto;
                border-collapse: collapse;
            }
            table td:first-child {
                text-align: center;
                /*width: 4rem;*/
                /* border: none; */
            }
            table th {
                /* text-align: right; */
                vertical-align: bottom;
                text-align: center;
            }
            table td {
                /* width: 2.5rem; */
                /* border: 2px solid gray; */
                /* border-radius: 2px; */
                padding: 0.4rem;
                border-bottom: 1px solid #7774;
            }
        `;
    }

    constructor() {
        super();
        this.proportionName = "Anteil";
    }

    get resultDescription() { return this.ergebnisAnalysis[this.prop.propName] }

    render() {
        let rD = this.resultDescription;
        let parteiMap = this.wahl.parteien;
        let gesamtGKNrs = this.wahl.gesamtGebietKandidaturenNrs(this.stimmzettelGebietFilter)?.add(undefined);
        let gKNrs = this.isGesamt ? gesamtGKNrs : this.ergebnisAnalysis.gebietKandidaturenNrs;
        // if we encounter multiple candidates per partei per gebiet, assume this is like a Bezirksvertretungswahl!
        // if candidates without listenplatz are encountered later on, an error is thrown, having these 2 condititions at once is unsupported
        let probablyBV = [...rD.results.keys()].some(anyName=>{
            let partei = parteiMap.get(anyName);
            let kandidaten = partei?.kandidaten?.(gKNrs);
            if (!kandidaten) return;
            let gebietKandidaten = new Set([...kandidaten].filter(wK=>(wK["kandidat-gebiet-nr"] || isNaN(wK["kandidat-listenplatz"]))));
            let _gebietKandidatenGebNrs = [...gebietKandidaten].map(wK=>wK["kandidat-gebiet-nr"]);
            return !(_gebietKandidatenGebNrs.length === new Set(_gebietKandidatenGebNrs).size);
        });
        return html`<table>
        <thead>
        <tr><th>Partei</th><th><!--<small>(Gebiets-)Kandidierende</small>--></th><th>${this.prop.name}</th><th>${this.proportionName}</th></tr>
        </thead>
        <tbody>
        ${[...rD.results.entries()].map(([anyName, voteCount])=>{
            let partei = parteiMap.get(anyName);
            let listKandidatenContent, gebietKandidatenContent;
            let gesamtKandidaten = partei?.kandidaten?.(gesamtGKNrs); // always gesamt
            let kandidaten = partei?.kandidaten?.(gKNrs); // may also be gesamt
            // suppression of candidate output in case of erststimmen/zweitstimmen split. use a different solution in the future?
            if (this.prop.suppressCandidateOutput) {
                gesamtKandidaten = false;
                kandidaten = false;
            }
            let relevantKandidatGebiete;
            if (kandidaten) {
                let gebietKandidaten = new Set([...kandidaten].filter(wK=>(wK["kandidat-gebiet-nr"] || isNaN(wK["kandidat-listenplatz"]))));
                if (gebietKandidaten.size === 1 && !probablyBV) {
                    let wK = gebietKandidaten.values().next().value;
                    // in case theres a possibility for more candidates, explicitly show gebiet-nr for the lone candidate
                    gebietKandidatenContent = html`${wK.name}${gKNrs.size > 1 ? ` (Geb. ${wK["kandidat-gebiet-nr"]})` : ""}`;
                } else if (gebietKandidaten.size) { // more than 1 or exactly 1 and probablyBV
                    if (!probablyBV) {
                        gebietKandidatenContent = html`
                        <details>
                            <summary>${gebietKandidaten.size} Gebietskandidaturen</summary>
                            <div style="max-height: 10rem; overflow-y: auto;">
                            ${[...gebietKandidaten].sort((wKa, wKb)=>wKa["kandidat-gebiet-nr"] - wKb["kandidat-gebiet-nr"])
                                .map(wK=>{
                                    let gebNr = wK["kandidat-gebiet-nr"];
                                    return html`${wK.name} (Geb. ${gebNr})<br/>`;
                            })}</div>
                        </details>`;
                    }
                    else { // = if multiple candidates per single gebiet (BV)
                        if ([...gebietKandidaten].some(wK=>!wK["kandidat-listenplatz"])) throw new Error("unsupported: multiple candidates per partei per gebiet (\"probablyBV\") only supported if all have kandidat-listenplatz");
                        relevantKandidatGebiete = new Set([...gebietKandidaten].map(wK=>wK["kandidat-gebiet-nr"]));
                    }
                }
            }
            if (gesamtKandidaten) {
                let listKandidaten = new Set([...gesamtKandidaten].filter(wK=>wK["kandidat-listenplatz"] > 0));
                if (relevantKandidatGebiete) listKandidaten = new Set([...listKandidaten].filter(wK=>relevantKandidatGebiete.has(wK["kandidat-gebiet-nr"])));
                if (listKandidaten.size) {
                    listKandidatenContent = html`
                    <details>
                        <!-- todo: if gebietKandidatenContent is empty, show the first 3 in summary?! -->
                        <summary>${listKandidaten.size} Listenkandidaturen</summary>
                        <div style="max-height: 10rem; overflow-y: auto;">
                        ${[...listKandidaten].sort((wKa, wKb)=>wKa["kandidat-listenplatz"] - wKb["kandidat-listenplatz"])
                            .map(wK=>{
                                let gebNr = wK["kandidat-gebiet-nr"];
                                let lpl = wK["kandidat-listenplatz"];
                                return html`${wK.name} (${[lpl && `Lpl. ${lpl}`, gebNr && `Geb. ${gebNr}`].filter(v=>v).join(", ")})<br/>`;
                        })}</div>
                    </details>`;
                }
            }
            let kandidatenContent = html`${gebietKandidatenContent}${listKandidatenContent}`;
            return html`
            <tr>
                <td>
                    <div style="vertical-align: middle; display: inline-block; height: 0.7rem; width: 1rem; background-color: ${partei?.rgbWert || "#fff0"}; border: 1px solid #7774; border-radius: 2px"></div>
                    ${(partei?.langname && partei.kurzname && partei.langname !== partei.kurzname) ? html`<abbr title="${partei.langname}">${partei.kurzname}</abbr>` : html`${anyName}`}
                </td>
                <td><small>${kandidatenContent}</small></td>
                <td>${voteCount}</td>
                <td>${(voteCount / rD.value * 100).toFixed(2) + " %"}</td>
            </tr>`;})}
        </tbody>
        </table>`;
    }
}
