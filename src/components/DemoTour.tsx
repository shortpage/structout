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
 *
 * File   : DemoTour.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-07-18
 * Version: 1.0
 *
 *   Purpose
 *    A Joyride-powered, click-through tour that walks first-time users
 *    through the StructOut workbench:
 *      1. Opens the Examples folder and selects “ChocolateBrownies”
 *      2. Highlights the metadata header (ID & Description)
 *      3. Guides users through the field list and read-only dialog
 *      4. Demonstrates provider selection, helper links, model picker,
 *         and ZIP download
 *
 *   State
 *    • run ­– controls whether the tour is active
 *
 *   Control flow
 *    ▶ Joyride callback ➜ auto-clicks “Cancel” after the field-edit step
 *    ▶ Finishes / skips ➜ sets run=false to prevent reruns
 *
 *   Styling
 *    • High z-index (12 000) so tooltips appear above MUI dialogs
 *    • Continuous mode with Skip button for quick exit
 *
 * ------------------------------------------------------------------ */

import { useState } from "react";
import Joyride, { CallBackProps, Step, STATUS } from "react-joyride";

const click = (sel: string) =>
  document.querySelector<HTMLElement>(sel)?.click();

const steps: Step[] = [
  /* 1 ─ sidebar: open Examples folder & choose ChocolateBrownies */
  {
    target: '[data-tour="sidebar-examples"]',
    content: "Open the Examples collection.",
    spotlightClicks: true,
  },
  {
    target: '[data-tour="sidebar-ex-chocolatebrownies"]',
    content: "Click on chocolatebrownies",
    spotlightClicks: true,
  },

  /* 2 ─ header: show ID & description */
  { target: "#meta-id", content: "Schema ID appears here." },
  { target: "#meta-desc", content: "…and the description here." },

  /* 3 ─ field list */
  { target: ".mrt-table", content: "Browse the field list." },

  /* 4 ─ field dialog (open then cancel) */
  {
    target: '[data-tour="field-edit"]',
    content: "Open the first field in read-only mode.",
    spotlightClicks: true,
  },
  {
    target: '[data-tour="dialog-cancel"]',
    content: "Close the dialog.",
    spotlightClicks: true,
  },

  /* 5 ─ provider / helpers / model / download */
  {
    target: "#provider-select",
    content: "Pick a provider.",
    spotlightClicks: true,
    placement: "right",
  },
  {
    target: "#link-helpers",
    content: "Open IDE helper code.",
    spotlightClicks: true,
  },
  {
    target: "#link-helper-main",
    content: 'Switch to the "main" helper.',
    spotlightClicks: true,
  },
  {
    target: "#model-select",
    content: "Explore available models.",
    spotlightClicks: true,
  },
  {
    target: "#btn-download",
    content: "Download everything as a ZIP.",
    spotlightClicks: true,
  },
];

export default function DemoTour() {
  const [run, setRun] = useState(true);

  const handle = ({ type, index, status }: CallBackProps) => {
    /* after field-edit step opens the dialog, auto-click Cancel */
    if (type === "step:after" && index === 6) {
      click('[data-tour="dialog-cancel"]');
    }
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showSkipButton
      callback={handle}
      styles={{ options: { zIndex: 12000 } }}
    />
  );
}
