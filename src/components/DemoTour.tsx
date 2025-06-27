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
    // @ts-expect-error
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) setRun(false);
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
