/*
 * Simple badge strip for the Workbench header
 * – Uses shields.io SVGs
 * – Links out to the relevant GitHub / PyPI / Slack pages
 */

import React from "react";

interface Badge {
  href: string;
  img: string;
  alt: string;
}

const BADGES: Badge[] = [
  /* CI status */
  {
    href: "https://github.com/shortpage/structout/actions",
    img: "https://img.shields.io/github/actions/workflow/status/shortpage/structout/ci.yml?label=CI&logo=github&logoColor=white",
    alt: "CI status",
  },

  /* MIT licence */
  {
    href: "https://github.com/shortpage/structout/blob/main/LICENSES/LICENSE",
    img: "https://img.shields.io/badge/license-MIT-green.svg",
    alt: "MIT licence",
  },

  /* Slack invite */
  {
    href: "https://join.slack.com/t/structout/shared_invite/XXXXXXXX",
    img: "https://img.shields.io/badge/Slack-Join Slack-4A154B?logo=slack&logoColor=white",
    alt: "Join our Slack",
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
        style={{ lineHeight: 0 }} // remove link baseline shift
      >
        <img src={img} alt={alt} height={20} />
      </a>
    ))}
  </div>
);

export default BadgeLinks;
