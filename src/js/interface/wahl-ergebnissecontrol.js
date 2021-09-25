/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import L from 'leaflet';

import { LitElement, html, css, property, customElement } from 'lit-element';
import 'weightless/button';
import 'weightless/card';
import 'weightless/expansion';
import 'weightless/title';
import 'weightless/select';
import { Select } from 'weightless/select';

import type { TemplateResult } from 'lit-element';
import type WahlController from '../wahl-controller';
import { CollectedFieldDescription } from '../wahl-lib/ergebnis';
import type { FieldDescription, DataTypeType } from '../wahl-lib/ergebnis';

/*
// this shouldn't be required but somehow there are no more change events coming when an option gets removed and the value gets reset . . .
// note: there were problems with another custom implementation so it was replaced by an implementation very similar to abstand-select!
// test everything using this:
// // select proportion
// // select placement
// // switch ebene: should change without problems
// // switch back
// // switch to another, normal, prop: should be cleared
// // select distance prop with anything that could be invalid after filtering
// // filter to a valid region
// // filter to an invalid region: legend should disappear
// // (can repeat a similar filtering using proportion prop or so)
*/
@customElement('wl-c-select')
class CustomSelectElement extends LitElement {
    @property({ type: String }) label: string;            
    @property({ type: String }) labelTo: string;
    @property({ attribute: false }) value: ?any;

    static get styles() {
        return css`
            :host {
                
            }
            wl-select {
                min-width: 5rem;
                --input-font-size: 0.8rem;
            }
        `;
    }

    constructor() {
        super();
        this._value = undefined;
    }
    
    get select(): Select { return this.renderRoot.querySelector("#select") }

    get value(): ?any { return this._value }
    set value(val: ?any) {
        let oldVal = this._value;
        this._value = val;
        if (this.select) {
            this.select.value = val;
            if (oldVal !== val) this._noChangeEventYet = true;
        }
        this.requestUpdateAndHandle('value', oldVal);
    }

    firstUpdated() {
        this.requestUpdateAndHandle();
    }
    
    async requestUpdateAndHandle(name, oldValue){
        this.requestUpdate(name, oldValue);
        return this.updateComplete.then(()=>{this._handleChange()});
    }

    _handleChange(/*e*/) {
        if (!this._noChangeEventYet && (this.select?.value === this._value)
            ||(!this.select?.value && this._value === undefined)) return;
        // internally adjusting _value to the select value
        if (this.select?.value) {
            this._value = this.select.value;
        } else {
            this._value = undefined;
        }
        this.dispatchEvent(new Event('change'));
        this._noChangeEventYet = false;
    }

    get _slotNodes() {
        return this.shadowRoot.querySelector('slot').assignedNodes();
    }

    render() {
        return html`
            <wl-select id="select" label="${this.label}" @change=${(e) => { this._handleChange(e) }}>
                <option value disabled selected></option>
                ${this.shadowRoot.querySelector('slot') ? this._slotNodes.map(sE=>sE.cloneNode(true)) : ""}
            </wl-select>
            <div style="display: none"><slot @slotchange=${()=>{ this.requestUpdateAndHandle() }}></slot></div>`;
    }
}

@customElement('abstand-select')
class AbstandSelectElement extends LitElement {
    @property({ type: String }) label: string;            
    @property({ type: String }) labelTo: string;
    @property({ attribute: false }) value: Array<?any, ?any>;

    static get styles() {
        return css`
            :host {
                
            }
            wl-select {
                min-width: 5rem;
                --input-font-size: 0.8rem;
            }
        `;
    }

    constructor() {
        super();
        this._value = [undefined, undefined];
        this.labelTo = "→";
    }
    
    get select(): Select { return this.renderRoot.querySelector("#select") }
    get selectTo(): Select { return this.renderRoot.querySelector("#selectTo") }

    get value(): Array<?any, ?any> { return this._value }
    set value(val: ?Array<?any, ?any>) {
        let oldVal = [...this._value];
        this.value[0] = val?.[0];
        this.value[1] = val?.[1];
        if (this.select) {
            this.select.value = val?.[0];
            this.selectTo.value = val?.[1];
            if (oldVal[0] !== val?.[0] || oldVal[1] !== val?.[1]) this._noChangeEventYet = true;
        }
        this.requestUpdateAndHandle('value', oldVal);
    }

    firstUpdated() {
        this.requestUpdateAndHandle();
    }
    
    async requestUpdateAndHandle(name, oldValue){
        this.requestUpdate(name, oldValue);
        return this.updateComplete.then(()=>{this._handleChange()});
    }

    _handleChange(/*e*/) {
        if (!this._noChangeEventYet && (this.select?.value === this.value[0] && this.selectTo?.value === this.value[1])
            ||(!this.select?.value && !this.selectTo?.value && this.value[0] === undefined && this.value[1] === undefined)) return;
        // internally adjusting _value to the select value
        if (this.select?.value && this.selectTo?.value) {
            this.value[0] = this.select.value;
            this.value[1] = this.selectTo.value;
        } else {
            this.value[0] = undefined;
            this.value[1] = undefined;
        }
        this.dispatchEvent(new Event('change'));
        this._noChangeEventYet = false;
    }

    get _slotNodes() {
        return this.shadowRoot.querySelector('slot').assignedNodes();
    }

    render() {
        return html`
            <wl-select id="select" label="${this.label}" @change=${(e) => { this._handleChange(e) }}>
                <option value disabled selected></option>
                ${this.shadowRoot.querySelector('slot') ? this._slotNodes.map(sE=>sE.cloneNode(true)) : ""}
            </wl-select>
            <wl-select id="selectTo" label="${this.labelTo}" @change=${(e) => { this._handleChange(e) }}>
                <option value disabled selected></option>
                <option value='1./2.'>1./2.</option>
                ${this.shadowRoot.querySelector('slot') ? this._slotNodes.map(sE=>sE.cloneNode(true)) : ""}
            </wl-select>
            <div style="display: none"><slot @slotchange=${()=>{ this.requestUpdateAndHandle() }}></slot></div>`;
    }
}

@customElement('ergebnis-prop')
class ErgebnisPropElement extends LitElement {
    @property({ attribute: false }) wahlController: WahlController;
    @property({ attribute: false }) prop: FieldDescription;

    static get styles() {
        return css`
            :host {
                
            }
            :host([active]) > wl-card {
                border-left: 2px solid hsl(var(--primary-300,var(--primary-hue,224),var(--primary-saturation,47%),var(--primary-lightness,38%)));
            }
            wl-c-select {
                min-width: 10rem;
                --input-font-size: 0.8rem;
            }
            wl-card {
                margin-bottom: 0.2rem;
            }
            wl-title {
                cursor: pointer;
            }
        `;
    }

    get isCollected(): boolean { return this.prop.constructor === CollectedFieldDescription }

    setActive(final: boolean) {
        if (this.wahlController.activeProp !== this.prop) {
            this.wahlController.activeProp = this.prop;
        }
        if (final) { // for setting active this "main" prop, not any sub data type of it
            this.resetArgsSelectElements();
            this.wahlController.activeDataType = undefined;
            this.wahlController.applyData();
        }
    }

    resetArgsSelectElements(type?: DataTypeType) {
        this._resetting = true;
        let qS =`.args-select-element${type ? `:not(#${type.id})` : ""}`;
        this.renderRoot.querySelectorAll(qS).forEach(sE=>{sE.value=undefined});
        this._resetting = false;
    }

    applyArgs(type: DataTypeType, argValue: any) {
        // todo checks
        if (this._resetting) return;
        this.resetArgsSelectElements(type);
        this.setActive();
        this.wahlController.activeDataType = { type: type, args: (type.argsFn ? type.argsFn(argValue) : argValue) };
        this.wahlController.applyData();
    }

    keysFor(type: ?DataTypeType): Array<string> {
        if (!type || !this.wahlController.activeEAC) return [];
        return this.wahlController.activeEAC[this.prop.propName][type.id].keys;
    }

    async requestUpdateAndHandle(name, oldValue) {
        this.requestUpdate(name, oldValue);
        return this.updateComplete.then(this.renderRoot.querySelectorAll('.args-select-element').forEach(sE=>{sE.requestUpdateAndHandle()}));
    }

    renderDataType(dT: DataTypeType): TemplateResult {
        let inner = html`
            ${this.keysFor(dT).map(key=>html`<option value="${key}">${dT.keyFn ? dT.keyFn(key) : key}</option>`)}`;
        // it seems there's no good way to do this with varying tag names..
        if (dT.tagName === "wl-c-select") {
            return html`<wl-c-select
                id="${dT.id}"
                class="args-select-element"
                @change=${(e)=>{this.applyArgs(dT, e.target.value)}}
                label=${dT.name}>
                ${inner}
            </wl-c-select>`;
        } else if (dT.tagName === "abstand-select") {
            return html`<abstand-select
                id="${dT.id}"
                class="args-select-element"
                @change=${(e)=>this.applyArgs(dT, e.target.value)}
                label=${dT.name}>
                ${inner}
            </abstand-select>`;
        } else throw new Error(`unexpected data type tag name ${dT.tagName}`);
    }

    render() {
        let opts;
        if (this.isCollected) {
            opts = this.prop.dataTypes.map(dT=>html`
            <wl-card>
                ${this.renderDataType(dT)}
            </wl-card>`);
        }
        return html`<wl-card>
            <wl-title level="4" @click=${()=>this.setActive(true)}>${this.prop.name}${this.isCollected ? ` (${this.prop.validText})` : ""}</wl-title>
            ${opts}
        </wl-card>`;
    }
}

@customElement('ergebnisse-control')
class ErgebnisseControlElement extends LitElement {
    @property({ attribute: false }) wahlController: WahlController;

    static get styles() {
        return css`
            :host {
                pointer-events: auto;
                line-height: 1;
                font-size: 0.8rem;
                width: min-content;
                max-height: 55vh;
                overflow: auto;
                --card-padding: 0.3rem;
                --title-font-size-level-3: 1rem;
                --title-font-size-level-4: 0.8rem;
                --expansion-margin-open: 0;
                --expansion-header-height-open: 2.2rem;
                --expansion-header-padding: 0 0.4rem;
                --expansion-content-padding: 0.4rem;
            }
            wl-card {
                margin-bottom: 0.2rem;
            }
            wl-button {
                display: inline-block;
                --button-fab-size: 1rem;
                --button-padding: 0.4rem;
                --button-font-size: smaller;
                text-transform: none;
                --button-letter-spacing: none;
                margin-bottom: 0.3rem;
            }
        `;
    }

    get renderable() {
        return this.wahlController?.activeWahl?.loaded && this.wahlController.activeEAC;
    }

    render() {
        if (!this.renderable) return;
        let filterHtml, gesamtButton, ergebnisProperties;
        if (this.wahlController.activeWahl.stimmzettel.size > 1) {
            filterHtml = html`<wl-button inverted outlined @click=${()=>{ this.wahlController.gebietFilterDialog() }}>
            Filter nach Stimmzettel &#709;
            </wl-button>`;
        }
        gesamtButton = html`<wl-button inverted outlined @click=${()=>{ this.wahlController.gesamtErgebnisDialog() }}>Gesamtergebnis</wl-button>`;
        ergebnisProperties = html`${Array.from(this.wahlController.activeWahl.ergebnisType.properties).map((propDesc)=>html`
            <ergebnis-prop id=${propDesc.propName} ?active=${this.wahlController.activeProp === propDesc} .wahlController=${this.wahlController} .prop=${propDesc}></ergebnis-prop>`)}`;
        return html`<wl-expansion open .icon=${undefined}>
        <wl-title level="3" slot="title">Ergebnisse</wl-title>
        <span slot="description">${this.wahlController.stimmzettelGebietFilter ? html`(${this.wahlController.stimmzettelGebietFilter.nr})` : "" }</span>
        <span slot="indicator">&#709;</span>
            ${filterHtml}
            ${gesamtButton}
            ${ergebnisProperties}
        </wl-expansion>`;
    }
}

// https://leafletjs.com/examples/extending/extending-3-controls.html

L.control.ErgebnisseControl = L.Control.extend({
    initialize: function(wahlController, options) {
        L.setOptions(this, options);
        this.setWahlController(wahlController);
    },

    getWahlController() {
        return this._wahlController;
    },

    setWahlController(val) {
        this._wahlController = val;
        //this._wahlController.ergebnisseControl = this;
        if (this.getContainer()) this.getContainer().wahlController = val;
    },

    onAdd: function(map) {
        /** @type {ErgebnisseControlElement} */
        var elem = L.DomUtil.create('ergebnisse-control');
        elem.wahlController = this.getWahlController();
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

L.control.ergebnisseControl = function(wahlController, opts) {
    return new L.control.ErgebnisseControl(wahlController, opts);
};