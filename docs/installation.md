# Quick Start

> Three options to get up-and-running. Choose what fits your workflow.

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

## Option 2: Hosted (zero-install)

> Fastest path—no tooling, no downloads.


1. **Open StructOut**  
   <https://ai.structout.dev>

2. **Start designing**  
   Everything runs in the browser. Your schema and settings persist across sessions.


Choose this path when you want to **evaluate StructOut quickly** or demo it without touching a terminal.

---

---

## Option 3: Microsoft Store (App)

> Ideal for locked-down machines that forbid Node/npm.


1. _One-click install_ → [Get StructOut in Microsoft Store](ms-windows-store://pdp/?productid=9N123EXAMPLE)  
   *(If that link doesn’t open the Store app, just search “StructOut” — publisher: **StructOut**.)*
2. Click **Install**.
3. Launch from the **Start menu**.


