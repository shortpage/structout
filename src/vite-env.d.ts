/// <reference types="vite/client" />

// augment Vite’s ambient types ---------------------------
declare interface ImportMetaEnv {
  /** “1” when the demo build should be read-only */
  readonly VITE_DEMO_READ_ONLY?: "0" | "1";
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
