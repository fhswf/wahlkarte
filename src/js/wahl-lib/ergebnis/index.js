/* @license
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

//@flow

export {
    ConstantFieldDescription, CollectedFieldDescription, CalculatedFieldDescription,
    Ergebnis, ErgebnisKommunalwahlNRW, ErgebnisBuergerentscheid,
} from './ergebnis';
export type { FieldDescription, DataTypeType, DataTypeAndArgsType } from './ergebnis';

export {
    ResultDescription, CollectedResultDescription,
    ErgebnisAnalysis,
} from './analysis';

export {
    ErgebnisAnalysisCollection,
} from './analysis-collection';
export type { CollectedResultType, DataTypeFnResultType } from './analysis-collection';
