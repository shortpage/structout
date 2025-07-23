/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025 Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ------------------------------------------------------------------
 *
 * File   : LegalDownloadDialog.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑20
 * Version: 1.3 (“Don’t repeat” checkbox)
 *
 * Purpose
 *   Native <dialog> shown before each ZIP download.
 *   • Summarises API‑key cost, data‑privacy, and “AS IS” liability.
 *   • Displays full MIT license (scrollable).
 *   • Optional “Don’t show this again” check‑box (rendered when the
 *     parent passes showCheckbox = true).  If ticked, the parent
 *     chooses whether to persist that choice.
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import "../style/legal-dialog.css"; // adjust path if needed

interface Props {
  open: boolean;
  showCheckbox?: boolean;
  onAccept: (dontRepeat: boolean) => void;
  onCancel: () => void;
}

export const LegalDownloadDialog = ({
  open,
  showCheckbox = true,
  onAccept,
  onCancel,
}: Props) => {
  const dlg = useRef<HTMLDialogElement>(null);
  const [dontRepeat, setDontRepeat] = useState(false);

  /* sync native <dialog> */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    dlg.current && (open ? dlg.current.showModal() : dlg.current.close());
  }, [open]);

  /* reset checkbox when reopening */
  useEffect(() => {
    if (open) setDontRepeat(false);
  }, [open]);

  return (
    <dialog ref={dlg} className="legal-dialog">
      <h2>⚠️Important Legal Notice</h2>
      <p className="legal-intro">
        You’re about to download code snippets that uses third‑party LLM calls.
        calls. Please review these key points:
      </p>

      {/* ---------- API keys & billing --------------------------- */}
      <section className="disclaimer">
        <h3>API keys & billing</h3>
        <ul>
          <li>
            You must supply <strong>your own</strong> LLM&nbsp;API&nbsp;keys.
          </li>

          <li>
            Keys stay <strong>on your machine only</strong>. The generated stub
            reads them from your local OS vault&nbsp; (Keychain Access on macOS,
            Credential Manager on Windows, Secret Service on Linux) via Python{" "}
            <code>keyring</code>.
          </li>
          <li>
            You add the key to that vault yourself by running the provided
            `secure_key` setup helper; nothing is stored automatically.
          </li>
          <li>
            <strong>
              StructOut never uploads, transmits, or logs your keys
            </strong>
          </li>

          <li>
            Any token usage or charges are your responsibility.&nbsp;
            <span style={{ color: "#c62828", fontWeight: 600 }}>
              API calls incur provider costs—verify pricing.
            </span>
          </li>
        </ul>
      </section>

      {/* ---------- Data privacy -------------------------------- */}
      <section className="disclaimer">
        <h3>Data privacy & LLM behaviour</h3>
        <ul>
          <li>Inputs/outputs flow through third‑party LLM providers.</li>
          <li>Review provider policies (GDPR, CCPA…) before sending data.</li>
          <li>
            LLM outputs may be inaccurate or unsafe – validate independently.
          </li>
        </ul>
      </section>

      {/* ---------- Liability ----------------------------------- */}
      <section className="disclaimer">
        <h3>Liability & warranty</h3>
        <ul>
          <li>
            StructOut is supplied <strong>“AS IS”.</strong>
          </li>
          <li>
            You accept <strong>all liability</strong> for downstream effects.
          </li>
          <li>No express or implied warranties.</li>
        </ul>
      </section>

      {/* ---------- MIT License accordion ----------------------- */}
      <details className="license-accordion">
        <summary>View MIT License</summary>
        <pre className="license">{`Copyright (c) 2025 Sesh Ragavachari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}</pre>
      </details>

      {showCheckbox && (
        <label className="dont-repeat">
          <input
            type="checkbox"
            checked={dontRepeat}
            onChange={(e) => setDontRepeat(e.target.checked)}
          />
          Don’t show this again
        </label>
      )}

      {/* ---------- actions ------------------------------------ */}
      <menu>
        <button onClick={onCancel} className="cancel">
          Cancel
        </button>
        <button onClick={() => onAccept(dontRepeat)} className="primary">
          Download & Accept
        </button>
      </menu>
    </dialog>
  );
};
