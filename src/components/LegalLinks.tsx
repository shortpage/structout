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
 * File   : LegalLinks.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 *  Provide Header and Footer links (About, Privacy, Terms, MIT License) and
 *  Keep the component *tiny*: defer markdown hydration to `react‑markdown`
 *  + `remark‑gfm` and import GitHub stylesheet for instant typography.
 *
 *  • Consumers: bottom of <GeneratedSchemaPanel/> and <Workbench/>.
 *  • To add new docs, drop an .md file into `/public/legal/` and
 *    extend `DOC_FILE`.
 *  • BASE_URL logic ensures paths resolve both in dev (/) and when
 *    the app is deployed under a sub‑folder (GitHub Pages, etc.).
 * -------------------------------------------------------------- */

import { useState } from "react";
import type React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ↓ one import = full GitHub markdown styles */
import "github-markdown-css/github-markdown-light.css";

type DocKey = "about" | "privacy" | "terms";

const DOC_FILE: Record<DocKey, string> = {
  about: "ABOUT.md",
  privacy: "PRIVACY_POLICY.md",
  terms: "TERMS_OF_USE.md",
};

export default function LegalLinks(): React.JSX.Element {
  const [markdown, setMarkdown] = useState<string | null>(null);

  /** fetch + open the selected document */
  const open = async (key: DocKey) => {
    const base =
      (
        import.meta as ImportMeta & {
          readonly env: { readonly BASE_URL?: string };
        }
      ).env.BASE_URL ?? "/"; // 👈 cast + fallback

    const text = await fetch(`${base}legal/${DOC_FILE[key]}`).then((r) =>
      r.text(),
    );
    setMarkdown(text);
  };

  return (
    <>
      <nav style={{ display: "flex", gap: "1rem", padding: "4px 8px" }}>
        <button className="link-button" onClick={() => open("about")}>
          About
        </button>
        <button className="link-button" onClick={() => open("privacy")}>
          Privacy&nbsp;Policy
        </button>
        <button className="link-button" onClick={() => open("terms")}>
          Terms&nbsp;of&nbsp;Use
        </button>
        <a
          className="link-button"
          href="https://github.com/seshragav/structout/blob/main/docs/license.md"
          target="_blank"
          rel="noreferrer"
        >
          MIT&nbsp;License
        </a>
      </nav>

      <Dialog
        open={Boolean(markdown)}
        onClose={() => setMarkdown(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {markdown && (
          <DialogContent sx={{ p: 3 }}>
            {/* GitHub styles apply to .markdown-body */}
            <article className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </article>
          </DialogContent>
        )}
      </Dialog>

      {/* button reset */}
      <style>{`
        .link-button {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.75rem;
          cursor: pointer;
          color: var(--accent-color, #1d70fe);
        }
        .link-button:hover { text-decoration: underline; }
      `}</style>
    </>
  );
}
