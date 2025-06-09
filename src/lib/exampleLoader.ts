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
 * File   : exampleLoader.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 *  Load design‑time **example schemas** (JSON files under `/src/examples/`)
 *  into a runtime map so the user can start from ready‑made templates.
 *  The list is compiled at *build‑time* via Vite’s `import.meta.glob`.
 *
 *  Keep bundle size predictable: guard the glob behind the
 *  `EXAMPLE_ENABLED` flag so production builds can strip the examples
 *  entirely (map = {}).  When enabled we use the eager option so the
 *  modules are statically analysed and fully typed.
 *
 *  • To add an example, just drop a `<name>.json` file in
 *    `/src/examples/`.  No code changes required.
 *  • If examples grow large, switch from `eager:true` to dynamic
 *    imports and lazily fetch only when a user selects one.
 * -------------------------------------------------------------- */
import { EXAMPLE_ENABLED } from "./constants";

interface ExamplePayload {
  metadataName: string;
  metadataDescription?: string;
  fields: unknown[];
}

export const EXAMPLES: Record<string, ExamplePayload> = EXAMPLE_ENABLED
  ? Object.fromEntries(
      Object.entries(
        // use only { eager: true } – fully typed
        import.meta.glob("../examples/*.json", { eager: true }),
      ).map(([path, mod]) => {
        const obj = (mod as { default: ExamplePayload }).default; // 👈 cast
        const id = path.split("/").pop()!.replace(".json", "");
        return [id, obj];
      }),
    )
  : {};
