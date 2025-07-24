/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : GeneratedSchemaPanelLayout.ts (Mobile-Responsive Version)
 * Author : Sesh Ragavachari
 * Date   : 2025-07-24
 * Version: 2.0
 *
 * Mobile-first responsive layout for the schema panel
 * ------------------------------------------------------------------ */

import styled from "styled-components";

/* ------------------------------------------------------------------ */
/* Responsive breakpoints                                             */
/* ------------------------------------------------------------------ */
const BREAKPOINTS = {
  mobile: "768px",
  tablet: "1024px",
};

/* ------------------------------------------------------------------ */
/* Root container: full height, vertical flex                        */
/* ------------------------------------------------------------------ */
export const PanelRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
`;

/* ------------------------------------------------------------------ */
/* Provider row: responsive layout for controls                      */
/* ------------------------------------------------------------------ */
export const ProviderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    gap: 6px;
    padding: 12px 16px;

    /* Make dropdowns more mobile-friendly */
    & .MuiFormControl-root {
      min-width: 110px !important;

      & .MuiInputLabel-root {
        font-size: 14px;
      }

      & .MuiSelect-select {
        font-size: 14px;
        padding: 8px 32px 8px 12px;
      }
    }

    /* Touch-friendly buttons */
    & .MuiIconButton-root {
      min-width: 44px;
      min-height: 44px;
      margin: 2px;

      & .MuiSvgIcon-root {
        font-size: 18px;
      }
    }

    /* Responsive typography */
    & .MuiTypography-caption {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    /* Extra small screens - stack controls */
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    /* Group dropdowns together */
    & > div:first-child {
      display: flex;
      gap: 8px;
      justify-content: space-between;

      & .MuiFormControl-root {
        flex: 1;
        min-width: 100px !important;
      }
    }

    /* Center action buttons */
    & > div:last-child {
      display: flex;
      gap: 8px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Link navigation: horizontal scroll on mobile                      */
/* ------------------------------------------------------------------ */
export const LinkBar = styled.div`
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid #e0e0e0;
  background: #ffffff;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    gap: 12px;
    padding: 12px 16px;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;

    /* Hide scrollbar but keep functionality */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }

    /* Ensure links don't shrink */
    & > * {
      flex-shrink: 0;
      white-space: nowrap;
      font-size: 13px;
    }

    /* Add gradient fade at edges */
    position: relative;

    &::after {
      content: "";
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 20px;
      background: linear-gradient(to right, transparent, #ffffff);
      pointer-events: none;
    }
  }

  @media (max-width: 480px) {
    padding: 8px 12px;

    & > * {
      font-size: 12px;
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Main body: code/JSON viewer with responsive behavior              */
/* ------------------------------------------------------------------ */
export const PanelBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    /* On mobile, ensure content fills available space */
    min-height: 200px;
  }
`;

/* ------------------------------------------------------------------ */
/* Scrollable JSON / code area with mobile optimizations            */
/* ------------------------------------------------------------------ */
export const JsonArea = styled.div`
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 0 12px 12px;
  -webkit-overflow-scrolling: touch;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    padding: 0 8px 8px;

    /* Mobile-optimized syntax highlighting */
    & pre {
      font-size: 12px !important;
      line-height: 1.4 !important;
      margin: 0;
      padding: 12px !important;
      border-radius: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;

      /* Better horizontal scrolling */
      white-space: pre;
      word-wrap: normal;
      word-break: normal;
    }

    /* Compact line numbers */
    & .linenumber {
      font-size: 11px !important;
      min-width: 32px !important;
      padding-right: 8px !important;
      color: #888 !important;
      text-align: right;
      user-select: none;
    }

    /* Improve code readability */
    & code {
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      word-spacing: normal;
      word-break: normal;
      word-wrap: normal;
      tab-size: 2;
    }

    /* Better JSON syntax highlighting on mobile */
    & .token.property {
      color: #0451a5;
    }

    & .token.string {
      color: #0a3069;
    }

    & .token.number {
      color: #09885a;
    }

    & .token.boolean {
      color: #0451a5;
    }
  }

  @media (max-width: 480px) {
    /* Extra small screens - more compact */
    padding: 0 6px 6px;

    & pre {
      font-size: 11px !important;
      padding: 8px !important;
    }

    & .linenumber {
      font-size: 10px !important;
      min-width: 28px !important;
      padding-right: 6px !important;
    }
  }

  @media (min-width: ${BREAKPOINTS.tablet}) {
    padding: 0 16px 16px;

    & pre {
      font-size: 13px !important;
      padding: 16px !important;
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Mobile action bar for copy/download                               */
/* ------------------------------------------------------------------ */
export const MobileActionBar = styled.div`
  display: none;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-top: 1px solid #e0e0e0;
    gap: 12px;

    /* Prominent action buttons */
    & .MuiButton-root {
      min-height: 44px;
      font-size: 14px;
      flex: 1;
      max-width: 140px;
      border-radius: 8px;
    }

    & .MuiIconButton-root {
      min-width: 44px;
      min-height: 44px;
    }

    /* Success state */
    & .success-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #4caf50;
      font-size: 13px;
      font-weight: 500;
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Loading overlay for mobile                                         */
/* ------------------------------------------------------------------ */
export const LoadingOverlay = styled.div<{ show: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: ${(props) => (props.show ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);

  @media (max-width: ${BREAKPOINTS.mobile}) {
    background: rgba(255, 255, 255, 0.9);

    & .MuiCircularProgress-root {
      width: 32px !important;
      height: 32px !important;
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Status indicator for mobile                                        */
/* ------------------------------------------------------------------ */
export const StatusIndicator = styled.div<{
  type: "success" | "error" | "loading";
}>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => {
    switch (props.type) {
      case "success":
        return "#4caf50";
      case "error":
        return "#f44336";
      case "loading":
        return "#ff9800";
      default:
        return "#666";
    }
  }};

  @media (max-width: ${BREAKPOINTS.mobile}) {
    font-size: 11px;
  }
`;

/* ------------------------------------------------------------------ */
/* Responsive typography helpers                                      */
/* ------------------------------------------------------------------ */
export const ResponsiveText = styled.span<{
  size?: "small" | "medium" | "large";
}>`
  font-size: ${(props) => {
    switch (props.size) {
      case "small":
        return "12px";
      case "large":
        return "16px";
      default:
        return "14px";
    }
  }};

  @media (max-width: ${BREAKPOINTS.mobile}) {
    font-size: ${(props) => {
      switch (props.size) {
        case "small":
          return "11px";
        case "large":
          return "14px";
        default:
          return "13px";
      }
    }};
  }

  @media (max-width: 480px) {
    font-size: ${(props) => {
      switch (props.size) {
        case "small":
          return "10px";
        case "large":
          return "13px";
        default:
          return "12px";
      }
    }};
  }
`;

/* ------------------------------------------------------------------ */
/* Mobile-specific improvements                                       */
/* ------------------------------------------------------------------ */
export const MobileOptimizations = styled.div`
  /* Smooth scrolling for better UX */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  /* Remove tap highlight */
  -webkit-tap-highlight-color: transparent;

  /* Improve touch interactions */
  & button,
  & .MuiIconButton-root,
  & .MuiButton-root {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  @media (max-width: ${BREAKPOINTS.mobile}) {
    /* Prevent zoom on input focus (iOS) */
    & input,
    & select,
    & textarea {
      font-size: 16px;
    }

    /* Better scrolling performance */
    & * {
      -webkit-overflow-scrolling: touch;
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Accessibility improvements                                         */
/* ------------------------------------------------------------------ */
export const A11yEnhancements = styled.div`
  /* Skip link for keyboard navigation */
  & .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;

    &:focus {
      top: 6px;
    }

    @media (max-width: ${BREAKPOINTS.mobile}) {
      font-size: 14px;
      padding: 12px;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: more) {
    & * {
      border-color: currentColor !important;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    & * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
