```markdown
# StructOut Quick Start Guide 🚀

A lightning-fast walkthrough for getting productive with **StructOut**—from your very first schema to a fully structured JSON extraction.  
*(You can slot additional examples below the music one as your library grows.)*

---

## 1 · Prerequisites

| Tool | Why you need it |
|------|-----------------|
| **StructOut account** | Sign in or create one free at `app.structout.ai`. |
| **API key** *(optional)* | Only if you'll test via code/SDK rather than the in-browser console. |
| **Raw text sample** | Any unstructured content you'd like to convert to JSON. |

---

## 2 · Create a Workspace & Open the Designer

1. In the left sidebar, click **Workspaces → New Workspace** (a short name is fine).  
2. Inside the workspace, open **Schema Designer**. You'll see an empty canvas ready for fields.

> **Tip:** Workspaces keep related schemas, documents, and team permissions together.

---

## 3 · Build Your First Schema (10-second template)

1. Click **New**.  
2. Fill in the modal:  
   - **ID:** `quickStartSchema`  
   - **Description:** *Starter schema for trying out StructOut*  
3. Add one field:  
   - **Field name:** `example`  
   - **Type:** `String`  
   - **AI prompt:** *Just give me a quick example value*  
4. Click **Save** (top bar).

You now have the tiniest schema—perfect for a smoke test.

---

## 4 · Test Extraction Right Away

1. Switch to **Extraction Console** (upper nav).  
2. Paste some text, e.g.:
   ```text
   Quick brown fox jumps over the lazy dog.
   ```
3. Choose Schema = `quickStartSchema` → **Run**.

**Result:**
```json
{ "example": "Quick brown fox jumps over the lazy dog." }
```

Congrats—your first StructOut round-trip! 🎉

---

## Example 1 · HelloWorldOfMusic 🎵

A richer schema that turns loose party-planning notes into a structured playlist.

Follow the steps in the same Designer or start a new schema—your choice.

### 1 · Create the Schema Shell

| Field | Value |
|-------|-------|
| **ID** | `helloWorldOfMusic` |
| **Description** | Hello World Starter schema for a wedding-party playlist |

### 2 · Add the Root Array `playlist`

1. Click **➕** (root level).
2. **Field name:** `playlist`
3. **Type:** Array → Object
4. **AI prompt:** Party Music Playlist
5. Click **Save**.

### 3 · Define Song-Level Fields (children of playlist)

| Child Field | Type | AI Prompt |
|-------------|------|-----------|
| `track` | String | Name of the Track |
| `position` | Number | Track Position in Playlist |
| `moods` | Array → String | Up to 2 one-word moods (e.g. Upbeat) |
| `djprompts` | Array → Object | Time marker & crowd call-outs |

#### 3.1 · track
- **Type:** String
- **AI prompt:** Name of the Track

#### 3.2 · position
- **Type:** Number
- **AI prompt:** Track Position in Playlist

#### 3.3 · moods
- **Type:** Array → String
- **AI prompt:** Max two moods (e.g. Upbeat)

#### 3.4 · djprompts (plus its sub-fields)
- **Type:** Array → Object
- **AI prompt:** Time Marker and Shout-out Instructions to the Dancing Guests

Inside `djprompts`, add two sub-fields:

| Sub-field | Type | AI Prompt |
|-----------|------|-----------|
| `timemarkersecond` | Number | Second in the song when the prompt fires |
| `djprompt` | String | Simple DJ prompt (e.g. Hands up!) |

### 4 · Save & Test

1. Click **Save** in Designer.
2. In **Extraction Console**, paste:
   ```text
   Reception playlist:
   1. "Can't Stop the Feeling!" – upbeat, joyful. 45 sec: "Everybody clap!"
   2. "Uptown Funk" – funky, party. 30 sec: "Move right!" 75 sec: "Move left!"
   ```
3. Select `helloWorldOfMusic` schema → **Run**.

**Expected JSON (truncated):**
```json
{
  "playlist": [
    {
      "track": "Can't Stop the Feeling!",
      "position": 1,
      "moods": ["upbeat", "joyful"],
      "djprompts": [
        { "timemarkersecond": 45, "djprompt": "Everybody clap!" }
      ]
    },
    {
      "track": "Uptown Funk",
      "position": 2,
      "moods": ["funky", "party"],
      "djprompts": [
        { "timemarkersecond": 30, "djprompt": "Move right!" },
        { "timemarkersecond": 75, "djprompt": "Move left!" }
      ]
    }
  ]
}
```
```
