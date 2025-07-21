/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025 Sesh Ragavachari
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
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ------------------------------------------------------------------
 *
 * File   : LegalDownloadDialog.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑20
 * Version: 1.3 (“Don’t repeat” checkbox)
 *
 * Purpose
 *   Native <dialog> shown before each ZIP download.
 *   • Summarises API‑key cost, data‑privacy, and “AS IS” liability.
 *   • Displays full MIT license (scrollable).
 *   • Optional “Don’t show this again” check‑box (rendered when the
 *     parent passes showCheckbox = true).  If ticked, the parent
 *     chooses whether to persist that choice.
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  /** render the “Don’t show again” box when true */
  showCheckbox?: boolean; // ← optional
  onAccept: (dontRepeat: boolean) => void;
  onCancel: () => void;
}

export const LegalDownloadDialog = ({ open, onAccept, onCancel }: Props) => {
  const dlg = useRef<HTMLDialogElement>(null);
  const [dontRepeat, setDontRepeat] = useState(false);

  /* sync native <dialog> element */
  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    open ? el.showModal() : el.close();
  }, [open]);

  /* reset checkbox whenever dialog re‑opens */
  useEffect(() => {
    if (open) setDontRepeat(false);
  }, [open]);

  /* ------------------------------------------------------------ */
  return (
    <dialog ref={dlg} className="legal-dialog">
      <h2>⚠️ Important Legal Notice</h2>

      {/* ---------- API keys & billing --------------------------- */}
      <section className="disclaimer">
        <h3>API Keys & Billing</h3>
        <ul>
          <li>
            You must supply <strong>your own</strong> LLM API keys.
          </li>
          <li>
            All token usage, rate limits, and charges are your responsibility.
          </li>
          <li>StructOut never stores or pays for your API usage.</li>
        </ul>
      </section>

      {/* ---------- Data privacy -------------------------------- */}
      <section className="disclaimer">
        <h3>Data Privacy & LLM Behaviour</h3>
        <ul>
          <li>Inputs/outputs flow through third‑party LLM providers.</li>
          <li>Review provider policies (GDPR, CCPA…) before sending data.</li>
          <li>
            LLM outputs may be inaccurate or unsafe – validate independently.
          </li>
        </ul>
      </section>

      {/* ---------- Liability ----------------------------------- */}
      <section className="disclaimer">
        <h3>Liability & Warranty</h3>
        <ul>
          <li>
            StructOut is demo software supplied <strong>“AS IS”</strong>.
          </li>
          <li>
            You assume <strong>all liability</strong> for downstream effects.
          </li>
          <li>No warranties – express or implied.</li>
        </ul>
      </section>

      {/* ---------- Full MIT text ------------------------------- */}
      <h3>MIT License</h3>
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

      <p className="final">
        <strong>WARNING:</strong> API calls cost money – please verify pricing.
      </p>

      <label className="dont-repeat">
        <input
          type="checkbox"
          checked={dontRepeat}
          onChange={(e) => setDontRepeat(e.target.checked)}
        />
        Don’t show this again
      </label>

      {/* ---------- actions ------------------------------------ */}
      <menu>
        <button onClick={onCancel} className="cancel">
          Cancel
        </button>
        <button onClick={() => onAccept(dontRepeat)} className="primary">
          I Understand & Accept
        </button>
      </menu>

      {/* ---------- styles -------------------------------------- */}
      <style>{`
        /* =====================  LEGAL‑DIALOG  ===================== */
          /* Scope‑busting selector for CSS‑modules / Vite */
           dialog.legal-dialog {
            --dlg-bg-light:#ffffff;
            --dlg-bg-dark :#212121;
            --dlg-text-dark:#e4e4e4;
            --dlg-accent  :#1976d2;

            width: clamp(320px, 90vw, 720px);
            max-height: 82vh;
            padding: 2.25rem 2.5rem;
            border: none;
            border-radius: 12px;
            background: var(--dlg-bg-light);
            box-shadow: 0 16px 40px rgb(0 0 0 / .35);
            overflow-y: auto;
            font-family: system-ui, sans-serif;
            color: #1a1a1a;
          }
          @media (prefers-color-scheme: dark) {
            dialog.legal-dialog {
              background: var(--dlg-bg-dark);
              color: var(--dlg-text-dark);
            }
          }

          dialog.legal-dialog::backdrop{
            background: rgb(0 0 0 / .55);
          }

          /* ---------- headings ---------- */
          dialog.legal-dialog h2{
            margin-top:0; margin-bottom:1.75rem;
            font-size:1.55rem; font-weight:600;
            display:flex; align-items:center; gap:.55rem;
          }
          dialog.legal-dialog h3{
            margin:1.75rem 0 .8rem 0;
            font-size:1.1rem; font-weight:600;
          }

          /* ---------- disclaimer blocks ---------- */
          dialog.legal-dialog.disclaimer{
            padding:1rem 1rem 1rem 1.25rem;
            border-left:4px solid #ffb300;
            border-radius:6px;
            background:#fffbea;
          }
          @media(prefers-color-scheme:dark){
           dialog.legal-dialog.disclaimer{
              background:#2d2d1f;
            }
          }
          dialog.legal-dialog.disclaimer ul{
            margin:.5rem 0; padding-left:1.25rem;
          }
          dialog.legal-dialog.disclaimer li{margin-bottom:.45rem}

          /* ---------- license scroll box ---------- */
          dialog.legal-dialog pre.license{
            max-height:14rem; overflow:auto;
            padding:1rem; border-radius:6px;
            font-size:.78rem; white-space:pre-wrap;
            background:#f3f3f3;
          }
          @media(prefers-color-scheme:dark){
            dialog.legal-dialog pre.license{
              background:#2a2a2a;
            }
          }

          /* ---------- final warning ---------- */
          dialog.legal-dialog.final{
            margin:1.6rem 0 1rem 0;
            padding:.9rem;
            text-align:center;
            background:#ffebee;
            border:2px solid #f44336;
            border-radius:6px;
            color:#c62828;
            font-weight:600;
          }
          @media(prefers-color-scheme:dark){
            :global(dialog.legal-dialog) .final{
              background:#452525;
            }
          }

          /* ---------- “don’t repeat” ---------- */
          /* ---------- “don’t repeat” ---------- */
          dialog.legal-dialog .dont-repeat{
            display:flex; align-items:center; gap:.55rem;
            margin:1.1rem 0 .4rem 0;
            font-size:.83rem; color:#666;
            user-select:none;
          }

          /* ---------- action buttons ---------- */
          dialog.legal-dialog menu{
            margin-top:2rem; padding:0;
            display:flex; justify-content:flex-end; gap:1rem;
          }
          dialog.legal-dialog menu button{
            padding:.55rem 1.35rem;
            border:none; border-radius:6px;
            font-size:.95rem; cursor:pointer;
            transition:background-color .18s ease, opacity .18s ease;
          }
          dialog.legal-dialog button.cancel{
            background:#e0e0e0; color:#424242;
          }
          dialog.legal-dialog button.cancel:hover{
            background:#cfcfcf;
          }
          dialog.legal-dialog button.primary{
            background:var(--dlg-accent); color:#fff; font-weight:600;
          }
          dialog.legal-dialog button.primary:hover{
            background:#1257a8;
          }
      `}</style>
    </dialog>
  );
};
