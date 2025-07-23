# Introduction

**StructOut** is a visual workbench—built in **React**—that lets you design, validate, and _use_ **JSON-Schema**-based “structured output” prompts for any major LLM provider in minutes.  
If you like the “model-first” developer ergonomics of **Pydantic** but build front-end tools, StructOut brings that same clarity to the browser while adding a few opinionated super-powers:

- **Drag-and-drop Schema Designer** – create nested objects, arrays, and enums visually; instant undo/redo keeps edits snappy.
- **Live JSON-Schema preview** – every keystroke re-renders a Draft-07 schema you can copy, export, or bundle.
- **One-click client snippets** – generate a self-contained Python (Pydantic) demo or TypeScript helper so back-end teams can test the contract immediately.
- **Provider-agnostic bundles** – OpenAI, Anthropic, Groq, Gemini, Perplexity, Llama, and any future model share the same UI; quirks live behind a tiny `providerRegistry.ts` manifest you can extend.
- **Download-and-run artifacts** – press **Download Bundle** to get your schema, model, typed helper, and ready-to-run example in one ZIP.

---

## Why Structured Output?

Generative models excel at free-form prose, yet most production workflows need **typed data that flows straight into code, dashboards, or downstream services**. JSON-Schema provides an explicit contract that:

- Constrains hallucinations
- Unifies validation across providers
- Remains language-agnostic—any runtime can parse JSON

Every major vendor now supports JSON-Schema-style function or tool calls, so StructOut targets this common denominator instead of re-writing prompts for each new model.

---

## How StructOut Works (10 000-ft view)

1. **Workbench bootstrap** – Vite mounts `<App />`; a thin shell restores the last-used provider and schema.
2. **SchemaDesigner** (left pane) maintains a flat `Map<id, SchemaField>` for O(1) edits, then streams structure to a JSON-Schema generator.
3. **GeneratedSchemaPanel** (right pane) pretty-prints the schema _and_ stitches a provider-specific client snippet via `providerSnippets.ts` and `ideHelperGenerator.ts`.
4. **Provider abstraction** – `providerRegistry.ts` normalises SDK imports, auth variables, call patterns, and header rules, so the UI never changes when you switch from OpenAI to Gemini.

---

## Concepts

| Concept               | StructOut (React)                                    |
|-----------------------|------------------------------------------------------|
| **Authoring surface** | Visual designer + TypeScript types                   |
| **Validation**        | Provider returns → Pydantic model inside the snippet |
| **Contract sharing**  | Draft-07 JSON produced live                          |
| **Extensibility**     | Add/override providers via `providerRegistry.ts`     |


---

## Pain Points Solved

- **Provider lock-in** – flip a drop-down, not your code base.
- **Glue-code fatigue** – snippets include secure key retrieval, timing, token counts, and pretty-print helpers out of the box.
- **On-call friction** – bundles ship with `.d.ts` files so editors get IntelliSense immediately.
- **Team hand-offs** – designers see hierarchy visually; back-end devs get a test harness; QA gets a JSON-Schema to validate fixtures. One source of truth covers all roles.

---

## Next Steps

1. **Create your first schema** from **File → New**, or load an example from the Explorer sidebar.
2. **Select a provider/model** in the right pane.
3. **Copy or download** the auto-generated snippet and run `python <id>_main.py` (or `npm run demo`).
4. **Need a new provider?** Add a JSON manifest, register it in `providerRegistry.ts`, and StructOut auto-adapts—no front-end rebuild required.

Welcome to **structured output without the yak-shaving.** 🎉

---

## Watch Intro Video

<div style="text-align: center;">
  <video controls width="720">
    <source src="assets/Short_Intro.mp4" type="video/mp4" />
    Your browser doesn’t support the video tag.
  </video>
</div>
