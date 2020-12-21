/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// @flow
import * as csv from 'csvtojson';
import ky from 'ky';

/**
 * Fetch a csv file, represented with an Object per row.
 *
 * @async
 * @param {string} csvPath Path to the csv file
 * @param {string} baseUrl Base URL for the path to the csv file
 * @returns {Promise<Array<object>>} Promise that resolves to Array of JSON objects per data row of the csv file.
 */
export async function fetchCsvToJson(csvPath: string, baseUrl: string): Promise<Array<{ [key: string]: any }>> {
    let r = await ky(csvPath, { prefixUrl: baseUrl });
    return csv({ delimiter: ';' }).fromString(await r.text());
}
