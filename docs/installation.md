# Quick Start

> Two options to get up-and-running. Choose what fits your workflow.

---

## Option 1: Clone repo & run locally

#### Prerequisites
* Node 18 + (LTS) and _pnpm_ (or _npm/yarn_)
* Rust toolchain & Tauri CLI if you want a native desktop build

### Steps

```bash
# Clone Repo
git clone https://github.com/seshragav/structout.git
```

```bash
# Change Directory to Project Dir.
cd structout
```

```bash
# Install Dependencies
pnpm install        # or: npm install
```

```bash
# Start dev server (Slow Load)
pnpm dev
```

```bash
# Build production bundle (for Faster Build)
pnpm build
```

```bash
# (Desktop) create native binary
pnpm tauri build  # generates .msi
```

---

## Option 2: Hosted

> Fastest path—no tooling, no downloads.

1. **Open StructOut Demo**  
   <https://app.structout.dev>

2. **Explore the interface**  
   Everything runs in the browser.

Choose this path when you want to **evaluate StructOut quickly** or demo it without touching a terminal.

---


## Option 3: Native App


_Microsoft Partner Store and iOS App, Coming soon..._
