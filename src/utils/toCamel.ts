/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : toCamel.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-07-18
 * Version: 1.0
 *
 * Purpose
 *   Normalises arbitrary user-supplied text into canonical **camelCase**:
 *     1. Replaces every non-alphanumeric run with a single space
 *     2. Lower-cases the entire string (kills funky caps like “tEst”)
 *     3. Feeds the result to change-case’s `camelCase()` helper
 *
 *   Example
 *     toCamel("This-is  a  Test_ID")  ➜  "thisIsATestId"
 *
 * Export
 *   toCamel(raw: string): string
 * ------------------------------------------------------------------ */

import { camelCase } from "change-case";

/**
 * Normalises user text and returns true camelCase.
 * 1. strips non-alphanum         → word boundaries
 * 2. lower-cases the whole thing → kills weird caps like tEst
 * 3. feeds result to change-case
 */
export const toCamel = (raw: string): string =>
  camelCase(
    raw
      .replace(/[^A-Za-z0-9]+/g, " ") // separate junk with spaces
      .toLowerCase(),
  );
