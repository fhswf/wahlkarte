/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import L from 'leaflet';

import { LitElement, html, css, property, customElement } from 'lit-element';
import 'weightless/tab-group';
import 'weightless/tab';

import type WahlController from '../wahl-controller';

@customElement('ebenen-control')
class EbenenControlElement extends LitElement {
    @property({ attribute: false }) wahlController: WahlController;
    // todo: Wahl statt WC ??

    static get styles() {
        return css`
            :host {
                margin-top: 0 !important;
                margin-left: 0 !important;
                pointer-events: auto;
                background-color: #fff;
                border-radius: 0px 0px 0.5rem 0px;
                padding: 0 0.5rem 0 0.5rem;
                line-height: 1;
                font-size: 0.8rem;
                max-width: 45vw;
                align-items: center;
                display: flex;
            }
            wl-tab-group {
                display: inline-block;
                overflow: hidden;
                --tab-padding: 0.5rem 0.75rem;
            }
            wl-tab[hasGeoPath="false"] {
                text-decoration: line-through;
            }
        `;
    }

    get renderable() {
        return (this.wahlController && this.wahlController.activeWahl);
    }

    render() {
        if (!this.renderable) return;
        return html`<wl-tab-group id="tab-group">
            ${Array.from(this.wahlController.activeWahl.ebenen.values()).map((ebene)=>html`
                <wl-tab
                    .checked=${this.wahlController.activeEbene === ebene}
                    @click=${()=>{ this.wahlController.activeEbene = ebene }}
                    hasGeoPath=${ ebene.hasGeoPath }
                >${ebene.bezeichnung}</wl-tab>`)}
        </wl-tab-group>`;
    }
}

// https://leafletjs.com/examples/extending/extending-3-controls.html

L.control.EbenenControl = L.Control.extend({
    initialize: function(wahlController, options) {
        L.setOptions(this, options);
        this.setWahlController(wahlController);
    },

    getWahlController() {
        return this._wahlController;
    },

    setWahlController(val) {
        this._wahlController = val;
        //this._wahlController.ebenenControl = this;
        if (this.getContainer()) this.getContainer().wahlController = val;
    },

    onAdd: function(map) {
        /** @type {EbenenControlElement} */
        var elem = L.DomUtil.create('ebenen-control');
        elem.wahlController = this.getWahlController();
        elem.addEventListener('update', function(e) {
            // explicitly update the current tab indicator bar using the change event
            this.requestUpdate();
            this.updateComplete.then(()=>{
                if (this.renderable) this.shadowRoot.getElementById("tab-group").dispatchEvent(new Event("change"));
            });
        });
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

L.control.ebenenControl = function(wahlController, opts) {
    return new L.control.EbenenControl(wahlController, opts);
};