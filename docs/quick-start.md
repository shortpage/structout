# StructOut Quick Start Guide

A lightning-fast walkthrough for getting productive with **StructOut**—from your very first schema to a fully structured JSON extraction.  
*(You can slot additional examples below the music one as your library grows.)*

---

## 1 · Prerequisites

**Installation completed** - Make sure you've completed the installation steps from the Installation section.

**Raw text sample** - Any unstructured content you'd like to convert to JSON.

---

## 2 · Build Your First Schema

1. Click **New** (blue button).
2. Fill in the schema details:
  - **ID:** `quickStartSchema`
  - **Description:** `Starter schema for trying out StructOut`
3. Click **+** to add one field:
  - **Field name:** `examplestring`
  - **Type:** `String`
  - **AI prompt:** `Hello World Greeting!`
4. Click **SAVE** (blue button in the field modal).
5. Click **Save** (top bar) to save the schema.

You now have the tiniest schema—perfect for a smoke test.

## 3 · Review Generated Schema

1. Switch to **Generated Schema** tab to see your JSON Schema output.
2. Review the **Pydantic** model by clicking the **model** tab.
3. Check the **main** tab to see the complete Python code.
4. **Switch providers**: Change from `openai/gpt4o` to `anthropic/sonnet` using the dropdowns.
5. Notice how the JSON Schema and code adapt to different AI providers.

You can copy any of the generated code using the copy button in the top-right of each code panel.

---

## 4 · Test Extraction via Code

### Prerequisites
1. **Get API Keys** - Visit your provider's website (e.g., [OpenAI Platform](https://platform.openai.com/settings)) and generate API keys. See Provider Section for all providers.
2. **Download Bundle** - Click the download button (circled in red) in the Generated Schema panel.

### Setup & Run
1. **Extract & Open** - Unzip the downloaded bundle in your favorite IDE.
2. **Install Dependencies**:
   ```bash
   python -m pip install -r requirements.txt
   ```

3. **Setup API Key** - Configure your API key (details in API Key Setup section).
4. **Create Input File** - In the `input/` directory, create `quickstartschema_content.txt` and paste:
   ```text
   My Name is World
   ```

5. **Run the extraction**:
   ```bash
   cd anthropic
   python quickstartschema_sonnet_main.py
   Master pass‑phrase:
   ```
   *(Provide Master passphrase if prompted)*

### Check Results
Look in the `output/` folder for:
- **`quickstartschema_sonnet.json`** - Structured JSON output
- **`quickstartschema_sonnet.out`** - Execution log with performance metrics

**Sample JSON Output:**
```json
{
  "examplestring": "Hello World!"
}
```

**Sample Log Output:**
```text
2025-07-16T15:16:55

-----------------------------------------------
 Provider     : anthropic
 Model        : claude-3-5-sonnet-20240620
 Generated at : 2025-07-16T15:16:55
 Input tokens : 356
 Output tokens: 36
 Exec-time ms : 1167
-----------------------------------------------

{
  "examplestring": "Hello World!"
}
```

Congrats 🎉 — your first StructOut extraction!
