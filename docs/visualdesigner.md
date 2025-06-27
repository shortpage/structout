# Visual Designer

The **Visual Designer** is StructOut’s canvas for building JSON-Schema _visually_ instead of by hand.  
Think of it as a spreadsheet-like table: every row is a field, indentation shows hierarchy, and a compact toolbar gives you one-click schema ops (add, move, delete, lock).

Your screen is always split into three panes:

| Area | What it does |
|------|--------------|
| **Explorer** | Browse local-storage drafts & built-in examples. |
| **Designer table** | Add / nest / reorder fields; every keystroke streams into JSON instantly. |
| **Schema preview** | Read-only Draft-07 spec you can copy or download. |

---

## Authoring workflow

### 1. Create a new schema
1. Fill **ID** and **Description** in the header.
2. Click **➕ Add top-level object**. The button is enabled only when both fields are non-empty and pass profanity/XSS checks :contentReference[oaicite:5]{index=5}.

### 2. Add fields
* Hover a parent row → click **➕** to add a child.
* New children default to `string`; pick another type from the inline dropdown.
* Objects and array-objects are **locked** by default; click 🔒 to unlock before adding children :contentReference[oaicite:6]{index=6}.

### 3. Hierarchy & nesting
Indentation reflects depth (max 3 levels in UI).  
Valid parents are **object** and **array-object**. Arrays of primitives (`string[]`, `number[]`) can’t hold sub-fields.

### 4. Move & delete fields
* **▲ / ▼** move siblings up or down (only within the same depth).
* The root row’s 🗑️ is disabled to protect the schema head :contentReference[oaicite:7]{index=7}.
* Delete any other row (or subtree) with the 🗑️ icon.

### 5. Save or wipe
* Press **💾 Save** to persist the draft in `localStorage`.
* **File → New** wipes the canvas—safer than deleting the root.

---

## Field-type examples

| Example | Designer view | Resulting JSON |
|---------|---------------|----------------|
| **Simple object** | `user → name:string, age:number` | `{ "user": { "name": "Alice", "age": 30 } }` |
| **Array of objects** | `posts[] → title, url` | `{ "posts": [{ "title": "...", "url": "..." }] }` |
| **String array** | `tags:string[]` | `{ "tags": ["ai", "schema"] }` |
| **Number array** | `scores:number[]` | `{ "scores": [0.95, 0.87] }` |

---

## Keyboard & UX tips
* **Double-click** a row or hit **✏️** to open the full Field Editor dialog.
* `Ctrl + S` triggers Save.
* Validation blocks profanity and wide-net XSS patterns before changes hit the schema :contentReference[oaicite:8]{index=8}.

---

That’s all you need to start painting rich, nested schemas without ever touching JSON! 🎨
