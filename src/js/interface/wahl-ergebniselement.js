/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
 
// @flow
import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import 'weightless/card';
import 'weightless/divider';
import 'weightless/expansion';
import 'weightless/title';

import type Wahl from '../wahl-lib/wahl';
import './wahl-ergebnischart';

import type { ErgebnisAnalysis, ConstantFieldDescription, CalculatedFieldDescription } from '../wahl-lib/ergebnis';
import type { Stimmzettel } from '../wahl-lib/wahl';

@customElement('ergebnis-element')
export default class ErgebnisElement extends LitElement {
    @property({ attribute: false }) wahl: Wahl;
    @property({ attribute: false }) ergebnisAnalysis: ErgebnisAnalysis;

    // used for table!
    @property({ attribute: false }) stimmzettelGebietFilter: ?Stimmzettel;
    @property({ type: Boolean }) isGesamt: boolean;

    constructor() {
        super();
        this.isGesamt = false;
    }

    static get styles() {
        return css`
            :host {
                pointer-events: auto;
                line-height: 1;
                font-size: 0.8rem;
                width: 35vw;
                max-height: 35vh;
                overflow: auto;
                --title-font-size-level-3: 1rem;
                --title-font-size-level-4: 0.8rem;
                --card-padding: 0.3rem;
                --expansion-margin-open: 0;
                --expansion-header-height-open: 2.2rem;
                --expansion-header-padding: 0 0.4rem;
                --expansion-content-padding: 0.4rem;
            }
            wl-divider {
                margin: 0.5rem 0rem;
            }
        `;
    }

    displayProp(prop: ConstantFieldDescription | CalculatedFieldDescription): string {
        let str = prop.name + ": ";
        let rD = this.ergebnisAnalysis[prop.propName];
        let val = rD.value;
        if (val === undefined) return str + "-";
        if (prop.isSum()) {
            str += val.toString();
        } else {
            str += (val*100).toFixed(2) + "%";
        }
        return str;
    }

    get ergebnisAnalysis() { return this._eA }
    set ergebnisAnalysis(val: ?ErgebnisAnalysis) {
        //console.log(val, this._eA);
        let oldVal = this._eA;
        this._eA = val;
        this.requestUpdate('ergebnisAnalysis', oldVal);
    }

    render() {
        if (!this.wahl) return;
        let _ergL = this.ergebnisAnalysis.ergebnisseLength;
        let _nnErgL = this.ergebnisAnalysis.notNullErgebnisseLength;
        return html`<wl-card>
            ${_ergL <= 1
                ? (_nnErgL ? "" : html`<small>Ergebnis liegt nicht vor</small><br/>`)
                : html`<small><strong>${_ergL === _nnErgL ? `Alle ${_ergL}` : `${_nnErgL}/${_ergL}`}</strong> Ergebnisse des Gebiets liegen vor</small><br/>`}
            ${[...this.ergebnisAnalysis.collectedProperties].map((prop)=>html`
                <wl-card>
                <ergebnis-chart
                    .parteiMap=${this.wahl.parteien}
                    .ergebnisAnalysis=${this.ergebnisAnalysis}
                    .prop=${prop}
                ></ergebnis-chart>
                <wl-expansion .icon=${undefined}>
                    <wl-title level="5" slot="title">Tabelle</wl-title>
                    <span slot="description">${prop.name}</span>
                    <span slot="indicator">&#709;</span>
                    <ergebnis-table
                        .wahl=${this.wahl}
                        .ergebnisAnalysis=${this.ergebnisAnalysis}
                        .prop=${prop}
                        .stimmzettelGebietFilter=${this.stimmzettelGebietFilter}
                        ?isGesamt=${this.isGesamt}
                    ></ergebnis-table>
                </wl-expansion>
                </wl-card>`)}
            <wl-divider></wl-divider>
            ${[...this.ergebnisAnalysis.constantProperties, ...this.ergebnisAnalysis.calculatedProperties].map((prop)=>html`
            ${this.displayProp(prop)}<br/>`)}
        </wl-card>`;
    }
}
