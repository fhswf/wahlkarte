/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow

// Tangram styling functions:
declare var feature;

import L from 'leaflet';
//$FlowIgnore[cannot-resolve-module]
import 'leaflet/dist/leaflet.css';
import Tangram from 'tangram';

import { wahlenConfig } from './config';
import WahlController from './wahl-controller';
import { clickGebiet, hoverGebiet } from './utils';

const Lmap = L.map('map', {
    minZoom: 9,
    maxZoom: 18,
    zoomControl: false,
    // zoomSnap: 1,
    // ...
});

L.control.zoom({ position: 'topright' }).addTo(Lmap);

let layer = Tangram.leafletLayer({
    scene: {
        import: [
            './static/dark_simple.yml', // based on https://cdn.protomaps.com/styles/2.0.0/tangram/light.yml
            './static/diagonal-stripes-full.yaml', // https://tangrams.github.io/blocks/polygons/diagonal-stripes-full.yaml
        ],
        global: { api_key: 'c811c8699b4dee7c' },
        styles: {
            _overlay_polygons: {
                base: "polygons",
                blend: "overlay",
                blend_order: 1,
            },
            _overlay_lines: {
                base: "lines",
                blend: "overlay",
                blend_order: 2,
            },
            _highlight_lines: {
                base: "lines",
                blend: "overlay",
                blend_order: 3,
            },
            "polygons-diagonal-opaque-stripes": { // https://github.com/tangrams/tron-style/blob/gh-pages/styles/polygons.yaml
                base: "polygons",
                blend: "overlay",
                blend_order: 1,
                mix: ["polygons-diagonal-stripes"],
                shaders: {
                    defines: {
                        BACKGROUND_COLOR: "vec3(1.)",
                        STRIPES_ALPHA: 0.2,
                        STRIPES_SCALE: 30,
                        STRIPES_WIDTH: 0.98,
                    },
                    blocks: {
                        filter: `
                            color.rgb = mix(BACKGROUND_COLOR,color.rgb, color.a);`
                            //color.a = 0.;`
                    }
                }
            },
            /*"polygons-diagonal-marked-stripes": {
                base: "polygons",
                blend: "overlay",
                blend_order: 2,
                mix: ["polygons-diagonal-stripes"],
                shaders: {
                    defines: {
                        BACKGROUND_COLOR: "vec3(1.)",
                        STRIPES_ALPHA: 0.65,
                        STRIPES_SCALE: 20,
                        STRIPES_WIDTH: 0.9,
                    },
                    blocks: {
                        filter: `
                            color.rgb = mix(BACKGROUND_COLOR,color.rgb, color.a);`
                            //color.a = 0.;`
                    }
                }
            },*/
        },
        layers: {
            districts: {
                data: { source: "districts" },
                filter: function() { return feature.color !== undefined && (feature.marked === undefined || feature.marked === true) },
                draw: {
                    _overlay_polygons: {
                        color: function() { return feature.color },
                        // doesn't even work?! some part of the docs said it would
                        // visible: function() { return feature.visible },
                        interactive: true,
                        order: 55,
                    },
                    _overlay_lines: {
                        color: [0.5, 0.5, 0.5, 0.5],
                        width: "0.8px",
                        order: 59,
                    },
                },
                nodata: {
                    filter: { nodata: [true] },
                    draw: {
                        "polygons-diagonal-opaque-stripes": {
                            color: function() { return feature.color },
                            order: 56,
                        }
                    }
                },
                /*marked: {
                    filter: { marked: [true] },
                    draw: {
                        _overlay_polygons: {
                            color: [0, 0, 0, 0.5],
                            order: 58,
                        },
                        "polygons-diagonal-marked-stripes": {
                            color: [1, 1, 0, 1],
                            order: 59,
                        },
                    },
                },*/
                highlights: {
                    filter: { highlighted: [true] },
                    draw: {
                        _highlight_lines: {
                            color: [1, 1, 0, 0.8],
                            width: "3px",
                            order: 60,
                        },
                    },
                },
            }
        }
    },
    events: {
        hover: hoverGebiet,
        click: clickGebiet
    }
}).addTo(Lmap);

document.addEventListener('DOMContentLoaded', () => {
    Lmap.invalidateSize();
});

window.wahlController = new WahlController(wahlenConfig, Lmap, layer);
