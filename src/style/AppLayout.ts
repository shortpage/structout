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
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : AppLayout.ts (Mobile-Responsive Version)
 * Author : Sesh Ragavachari
 * Date   : 2025-07-24
 * Version: 2.0 - Mobile Support Added
 *
 *  Responsive 3-column layout that becomes tabs on mobile:
 *     • Explorer      (drawer on mobile)
 *     • Designer      (main tab)
 *     • Generated-Schema (tab)
 * ------------------------------------------------------------------ */

import styled from "styled-components";

/* ------------------------------------------------------------------ */
/* Responsive breakpoints                                             */
/* ------------------------------------------------------------------ */
const BREAKPOINTS = {
  mobile: "768px",
  tablet: "1024px",
  desktop: "1200px",
};

/* ------------------------------------------------------------------ */
/* Column widths for desktop (unchanged)                             */
/* ------------------------------------------------------------------ */
const COL_EXPLORER = 20;
const COL_DESIGNER = 45;
const COL_SCHEMA = 35;

/* ------------------------------------------------------------------ */
/* Root: Responsive padding and height                               */
/* ------------------------------------------------------------------ */
export const Root = styled.div`
  height: 100vh;
  padding: 8px;
  display: flex;
  flex-direction: column;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    height: 92vh;
    padding: 16px;
  }
`;

/* ------------------------------------------------------------------ */
/* Responsive Header Layout                                           */
/* ------------------------------------------------------------------ */
export const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  gap: 8px;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    flex-direction: row;
    align-items: center;
    padding: 12px 24px;
    flex-wrap: wrap;
  }
`;

export const HeaderLeft = styled.div`
  flex: 0 0 auto;
  order: 1;
  display: flex;
  align-items: center;
`;

export const HeaderCenter = styled.div`
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  order: 3;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    order: 2;
  }
`;

export const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 0 0 auto;
  order: 2;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    align-items: flex-end;
    order: 3;
  }
`;

/* ------------------------------------------------------------------ */
/* Main Frame: Mobile tabs vs Desktop columns                        */
/* ------------------------------------------------------------------ */
export const Frame = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #ccc;
  border-radius: 4px;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    flex-direction: row;
  }
`;

/* ------------------------------------------------------------------ */
/* Mobile Tab Navigation                                              */
/* ------------------------------------------------------------------ */
export const TabNavigation = styled.div`
  display: flex;
  border-bottom: 1px solid #ccc;
  background: #f8f9fa;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    display: none;
  }
`;

export const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 8px;
  background: ${(props) => (props.active ? "#fff" : "transparent")};
  border: none;
  border-bottom: ${(props) =>
    props.active ? "2px solid #2962ff" : "2px solid transparent"};
  font-size: 14px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  color: ${(props) => (props.active ? "#2962ff" : "#666")};
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch-friendly */

  &:hover {
    background: #f0f0f0;
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 480px) {
    font-size: 13px;
    padding: 10px 6px;
  }
`;

/* ------------------------------------------------------------------ */
/* Bottom Tab Bar – fixed at viewport bottom (mobile only)            */
/* ------------------------------------------------------------------ */
export const BottomTabBar = styled("nav")`
  position: fixed;
  bottom: env(safe-area-inset-bottom);
  left: 0;
  width: 100%;
  height: 56px; /* material bottom‑nav height */
  display: flex;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  z-index: 1000;

  @media (min-width: 768px) {
    display: none; /* hide on desktop */
  }
`;

/* ------------------------------------------------------------------ */
/* Mobile Content Container                                           */
/* ------------------------------------------------------------------ */
export const MobileContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    display: none;
  }
`;

export const FabWrap = styled("div")`
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 72px); /* sits above tab bar */
  right: 16px;
  z-index: 1200;
`;

/* ------------------------------------------------------------------ */
/* Desktop Columns (Hidden on Mobile)                                */
/* ------------------------------------------------------------------ */
export const DesktopColumns = styled.div`
  display: none;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    display: flex;
    flex: 1;
    min-height: 0;
  }
`;

export const ExplorerCol = styled.div`
  flex: 0 0 ${COL_EXPLORER}%;
  max-width: ${COL_EXPLORER}%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ccc;

  @media (min-width: ${BREAKPOINTS.desktop}) {
    flex: 0 0 280px;
    max-width: 280px;
  }
`;

export const DesignerCol = styled.div`
  flex: 0 0 ${COL_DESIGNER}%;
  max-width: ${COL_DESIGNER}%;
  min-width: 320px; /* Reduced from 400px for better mobile-desktop transition */
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ccc;

  @media (min-width: ${BREAKPOINTS.desktop}) {
    min-width: 400px;
  }
`;

export const SchemaCol = styled.div`
  flex: 0 0 ${COL_SCHEMA}%;
  max-width: ${COL_SCHEMA}%;
  display: flex;
  flex-direction: column;
`;

/* ------------------------------------------------------------------ */
/* Scroll Areas with Mobile Optimizations                            */
/* ------------------------------------------------------------------ */
export const ScrollArea = styled.div`
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch; /* Smooth iOS scrolling */
`;

/* ------------------------------------------------------------------ */
/* Mobile-Optimized Branding                                         */
/* ------------------------------------------------------------------ */
export const BrandWrap = styled.div`
  padding: 8px 0;
  line-height: 1;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    padding: 20px 0 12px;
  }
`;

export const BrandName = styled.h1`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: -0.5px;

  & > span {
    color: #2962ff;
  }

  @media (min-width: ${BREAKPOINTS.tablet}) {
    font-size: 30px;
  }
`;

export const TagLine = styled.p`
  margin: 4px 0 0;
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 0.85rem;
  line-height: 1.4;
  letter-spacing: 0.25px;
  color: #64748b;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    font-size: 1rem;
    line-height: 1.65;
  }
`;

/* ------------------------------------------------------------------ */
/* Mobile Drawer System                                               */
/* ------------------------------------------------------------------ */
export const DrawerOverlay = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: ${(props) => (props.open ? 1 : 0)};
  visibility: ${(props) => (props.open ? "visible" : "hidden")};
  transition: all 0.3s ease;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    display: none;
  }
`;

export const DrawerContent = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 85vw;
  max-width: 320px;
  background: white;
  z-index: 1001;
  transform: translateX(${(props) => (props.open ? "0" : "-100%")});
  transition: transform 0.3s ease;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  @media (min-width: ${BREAKPOINTS.tablet}) {
    position: static;
    transform: none;
    box-shadow: none;
  }
`;

/* ------------------------------------------------------------------ */
/* Mobile Menu Button                                                 */
/* ------------------------------------------------------------------ */
export const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
  cursor: pointer;

  &:hover {
    background: #f5f5f5;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (min-width: ${BREAKPOINTS.tablet}) {
    display: none;
  }
`;
