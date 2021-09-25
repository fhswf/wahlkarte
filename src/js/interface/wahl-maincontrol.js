/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import L from 'leaflet';

import { LitElement, html, css, property, customElement } from 'lit-element';
import 'weightless/button';
import 'weightless/title';
import 'weightless/tab-group';
import 'weightless/tab';

import type WahlController from '../wahl-controller';

@customElement('main-control')
class MainControlElement extends LitElement {
    @property({ type: String }) mapTitle: string;
    @property({ attribute: false }) wahlController: WahlController;

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
                font-size: 1rem;
                max-width: 85vw;
                display: flex;
                align-items: center;
            }
            @media (max-width: 500px) {
                :host {
                    flex-wrap: wrap;
                }
                wl-title {
                    max-width: 90%;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    overflow: hidden;
                }
            }
            wl-title {
                display: inline-block;
                font-size: 1.35rem;
                margin-right: 0.1em;
                flex-shrink: 0;
            }
            wl-button {
                flex-shrink: 0;
                --button-fab-size: 1.5rem;
            }
            wl-tab-group {
                display: inline-block;
                overflow: hidden;
                --tab-padding: 0.5rem 1.5rem;
            }
        `;
    }

    render() {
        return html`<wl-title level="1">${this.mapTitle ?? this.wahlController.name}</wl-title>
        <wl-button fab flat inverted @click=${()=>{ this.wahlController.wahlterminDialog() }}>&#709;</wl-button>
        <wl-tab-group id="tab-group">
            ${Array.from(this.wahlController.wahlen.values()).map((wahl)=>html`
                <wl-tab
                    .checked=${this.wahlController.activeWahl === wahl}
                    @click=${()=>{ this.wahlController.activeWahl = wahl }}
                >${wahl.displayName || wahl.name}</wl-tab>`)}
        </wl-tab-group>`;
    }
}

// https://leafletjs.com/examples/extending/extending-3-controls.html

L.control.MainControl = L.Control.extend({
    // https://github.com/Leaflet/Leaflet/blob/master/src/control/Control.js
    // https://leafletjs.com/examples/extending/extending-1-classes.html#lclassinitialize

    options: {
        // mapTitle: "Wahlergebniskarte",
    },

    initialize: function(wahlController, options) {
        L.setOptions(this, options);
        this.setWahlController(wahlController);
    },

    getWahlController() {
        return this._wahlController;
    },

    setWahlController(val) {
        this._wahlController = val;
        //this._wahlController.mainControl = this;
        if (this.getContainer()) this.getContainer().wahlController = val;
    },

    onAdd: function(map) {
        /** @type {MainControlElement} */
        var elem = L.DomUtil.create('main-control');
        elem.mapTitle = this.mapTitle;
        elem.wahlController = this._wahlController;
        elem.addEventListener('update', function(e) {
            // explicitly update the current tab indicator bar using the change event
            this.requestUpdate();
            this.updateComplete.then(() => this.shadowRoot.getElementById("tab-group").dispatchEvent(new Event("change")));
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

L.control.mainControl = function(wahlController, opts) {
    return new L.control.MainControl(wahlController, opts);
};