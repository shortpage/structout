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
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : BadgeLinks.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑06‑09
 * Version: 1.0
 *
 *  Simple badge strip for the Workbench header
 *    • Uses shields.io SVGs
 *    • Links out to GitHub Actions, licence, Slack invite, Docs, Verified
 *    • Renders flex‑wrapped for narrow screens
 * -------------------------------------------------------------- */

import React from "react";

interface Badge {
  href: string;
  img: string;
  alt: string;
}

const BADGES: Badge[] = [
  /* CI status */
  {
    href: "https://github.com/shortpage/structout/actions",
    img: "https://img.shields.io/github/actions/workflow/status/shortpage/structout/ci.yml?label=CI&logo=github&logoColor=white",
    alt: "CI status",
  },

  /* MIT licence */
  {
    href: "https://github.com/shortpage/structout/blob/main/LICENSES/LICENSE",
    img: "https://img.shields.io/badge/license-MIT-green.svg",
    alt: "MIT licence",
  },

  /* Slack invite */
  {
    href: "https://join.slack.com/t/structout/shared_invite/zt-39p6sjr4i-p9ljnreUdntSleaTJH7mQg",
    img: "https://img.shields.io/badge/Slack-4A154B?logo=slack&logoColor=white",
    alt: "Join our Slack",
  },

  /* Documentation */
  {
    href: "https://doc.structout.dev",
    img: "https://img.shields.io/badge/Documentation-blue",
    alt: "Project documentation",
  },

  /* Verified repository (signed commits) */
  {
    href: "https://github.com/shortpage/structout/commits/main",
    img: "https://img.shields.io/badge/Verified-blue",
    alt: "All commits signed & verified",
  },
];

const BadgeLinks: React.FC = () => (
  <div
    style={{
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      justifyContent: "center",
    }}
  >
    {BADGES.map(({ href, img, alt }) => (
      <a
        key={img}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ lineHeight: 0 }} /* remove link baseline shift */
      >
        <img src={img} alt={alt} height={20} />
      </a>
    ))}
  </div>
);

export default BadgeLinks;
