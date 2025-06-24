[![CI](https://github.com/shortpage/structout/actions/workflows/ci.yml/badge.svg)](https://github.com/shortpage/structout/actions/workflows/ci.yml)

# Structout


> **Visual JSON‑schema workbench** – build a schema, preview valid output, and
> export a ready‑to‑run Pydantic + LLM demo bundle in one click.

## 1 Clone & bootstrap

```
git clone https://github.com/shortpage/structout.git
cd structout
pnpm install      # or npm i / yarn
pnpm dev          # http://localhost:1420
```

**Prereqs**

* Node ≥ 18 + pnpm
* Rust stable + Cargo (only for Tauri)
* macOS/Linux: Xcode CLT / build‑essential  
  Windows: VS Build Tools + WebView2 runtime

---

## 2 Desktop build (Tauri)

```
pnpm tauri dev    # hot‑reload desktop shell
pnpm tauri build  # signed installers → src-tauri/target/release/bundle
```


## 3 Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Vite dev‑server |
| `pnpm build` | Web production build |
| `pnpm tauri dev` | Desktop shell (dev) |
| `pnpm tauri build` | Desktop installers |
| `pnpm lint` | ESLint + Prettier |
| `pnpm test` | Vitest |
| `pnpm format` | Prettier write |

---

## 4 Documentation

Full guide on GitBook → **Structout Documentation**  
https://your-gitbook-url.com/structout <!-- replace URL -->

---

## 5 Contributing

Fork → branch → `pnpm lint && pnpm test` → PR.  
CI must pass.

© 2025 Sesh Ragavachari — MIT License

## Acknowledgements

StructOut is built on a fantastic open-source stack.  
Special thanks to **[Pydantic](https://docs.pydantic.dev/)** for providing the
runtime data-validation engine that powers our Python side.

Pydantic is MIT-licensed; the full licence text is included in
[`LICENSES/pydantic.LICENSE`](./LICENSES/pydantic.LICENSE).
