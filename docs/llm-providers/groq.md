**Grok**  uses the exact same JSON schema structure as OpenAI:

- ✅ Outer wrapper with `type: "json_schema"`
- ✅ Nested `json_schema` object containing:
  - `name` (from schema metadata)
  - `description` (from schema metadata)
  - `strict: true`
  - `schema` object with the actual JSON Schema
- ✅ Conditional rules for:
  - `additionalProperties: false`
  - `required` array with field names

**Example output (identical structure for all three providers):**

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "UserInfo",
    "description": "Extract user information",
    "strict": true,
    "schema": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "email"],
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" }
      }
    }
  }
}
```
