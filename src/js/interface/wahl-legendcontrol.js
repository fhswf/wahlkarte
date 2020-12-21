/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import L from 'leaflet';

import { LitElement, html, css, property, customElement } from 'lit-element';
// import 'weightless/divider';
import 'weightless/expansion';
import 'weightless/title';
import chroma from 'chroma-js';

@customElement('legend-control')
class LegendControlElement extends LitElement {
    @property({ attribute: false }) classColors: Map<string, Array<string>>; // 
    @property({ attribute: false }) classCounts: Map<string, Array<string>>; // 
    @property({ attribute: false }) bounds: Array<any>;
    @property({ attribute: false }) hoverCallback: ?()=>any;
    @property({ type: Boolean }) percentage: boolean;
    @property({ type: String }) sep: string;
    @property({ type: String }) desc: string;

    constructor() {
        super();
        this.sep = ' – ';
    }

    static get styles() {
        return css`
            :host {
                pointer-events: auto;
                line-height: 1;
                font-size: 0.8rem;
                max-width: 95vw;
                min-width: 30vw;
                width: min-content;
                max-height: 30vh;
                overflow: auto;
                --title-font-size-level-3: 1rem;
                --title-font-size-level-4: 0.8rem;
                --expansion-margin-open: 0;
                --expansion-header-height-open: 2.2rem;
                --expansion-header-padding: 0 0.4rem;
                --expansion-content-padding: 0.4rem;
            }
            /*wl-divider {
                margin: 0.5rem 0rem;
            }*/
            th.hoverable, td.hoverable:first-child {
                border: 2px dotted transparent;
            }
            td.hoverable {
                border: 2px solid #7774;
            }
            .hoverable:hover, .hoverable:active, td.hoverable:first-child:hover, td.hoverable:first-child:active {
                border: 2px dotted black;
            }
            .hoverable.inverted:hover, .hoverable.inverted:active {
                border-color: white;
            }
            table {
                display: block;
                max-width: 100%;
                overflow: auto;
            }
            table td:first-child {
                text-align: right;
                width: 2rem;
                border: none;
            }
            table th {
                /* text-align: right; */
                vertical-align: bottom;
            }
            table td {
                width: 2.5rem;
                /* border: 2px solid gray; */
                border-radius: 2px;
            }
        `;
    }

    get ranges(): Array<Tuple<any, any>> {
        if (!this.bounds) return [];
        [...this.classColors.values()].forEach((colorArr) => {
            if (this.bounds.length - 1 !== colorArr.length) throw new Error("bounds length should be color array length + 1");
        });
        let arr = [];
        this.bounds.forEach((value, index)=>{if(index) { arr.push([this.bounds[index-1], value]) }});
        return arr;
    }

    displayRange(range: Tuple<any, any>, displayFrom: boolean = false) {
        let left = range[0] ?? NaN;
        let right = range[1] ?? NaN;
        if (this.percentage) {
            if (!(typeof left === "number" && typeof right === "number")) throw new Error("percentage true but no numbers given");
            left = left.toFixed(2) + "%";
            right = right.toFixed(2) + "%";
        }
        return html`${displayFrom ? left : ""}${this.sep}${right}`;
    }

    render() {
        let enabled = !!(this.classColors && this.ranges);
        if (!enabled) return ""; // completely hide it for now
        let cR = [...this.classColors.entries()];
        return html`<wl-expansion
            ?disabled=${!enabled}
            ?open=${enabled}
            .icon=${undefined}
        >
            <wl-title level="3" slot="title">Legende</wl-title>
            <span slot="description">${this.desc}</span>
            <span slot="indicator">&#709;</span>
            <table @mouseleave=${()=>this.hoverCallback(undefined, undefined)}>
                <thead>
                <tr>
                    <th @mouseenter=${()=>this.hoverCallback(undefined, undefined)}></th>
                    ${this.ranges.map((range, i)=>html`
                        <th class="${this.hoverCallback ? "hoverable": ""}"
                            @mouseenter=${()=>this.hoverCallback?.(undefined, i)}
                        >${this.displayRange(range, !i)}</th>`)}
                </tr>
                </thead>
                <tbody>
                ${cR.map(([class_, colors])=>html`
                <tr>
                    <td class="${this.hoverCallback ? "hoverable": ""}"
                        @mouseenter=${()=>this.hoverCallback?.(class_, undefined)}
                    >${class_ || ""}</td>
                    ${colors.map((color, i)=>{
                        let tdContent = html`
                        <td class="${this.hoverCallback ? `hoverable${chroma(color).luminance() > 0.4 ? "" : " inverted"}`: ""}"
                            @mouseenter=${()=>this.hoverCallback?.(class_, i)}
                            style="height: 0.8rem; background-color: ${color}"
                        ></td>`;
                        if (!this.classCounts) return tdContent;
                        let tdEmpty = html`<td @mouseenter=${()=>this.hoverCallback?.(undefined, undefined)} style="height: 0.8rem"></td>`;
                        if (!this.classCounts.get(class_)) throw new Error("if classCounts is set it should contain all classes");
                        return this.classCounts.get(class_).get(i) ? tdContent : tdEmpty;
                    })}
                </tr>`)}
                </tbody>
            </table>
        </wl-expansion>`;
    }
}

// https://leafletjs.com/examples/extending/extending-3-controls.html

L.control.WahlLegendControl = L.Control.extend({
    initialize: function(options) {
        L.setOptions(this, options);
    },

    onAdd: function(map) {
        /** @type {LegendControlElement} */
        var elem = L.DomUtil.create('legend-control');
        L.DomEvent.disableScrollPropagation(elem);
        L.DomEvent.disableClickPropagation(elem);

        L.DomEvent.on(elem, 'mousemove', L.DomEvent.stopPropagation);
        L.DomEvent.on(elem, 'mouseenter', ()=>setTimeout(()=>map.fireEvent("mouseout"), 50));

        return elem;
    },

    onRemove: function(map) {
        // L.DomEvent.off(...)
    }
});

L.control.wahlLegendControl = function(wahlController, opts) {
    return new L.control.WahlLegendControl(wahlController, opts);
};