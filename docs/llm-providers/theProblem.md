Imagine you've designed a simple schema to extract user information:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "User's full name"
    },
    "email": {
      "type": "string",
      "description": "User's email address"
    },
    "age": {
      "type": "integer",
      "description": "User's age in years"
    }
  },
  "required": ["name", "email"]
}
```

### Manual Conversion Nightmare

You'd need to manually create different versions for each provider:

**OpenAI expects:**
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
      "properties": {
        "name": {
          "type": "string",
          "description": "User's full name"
        },
        "email": {
          "type": "string",
          "description": "User's email address"
        },
        "age": {
          "type": "integer",
          "description": "User's age in years"
        }
      },
      "required": ["name", "email"]
    }
  }
}
```

**Anthropic expects:**
```json
{
  "name": "UserInfo",
  "description": "Extract user information",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "User's full name"
      },
      "email": {
        "type": "string",
        "description": "User's email address"
      },
      "age": {
        "type": "integer",
        "description": "User's age in years"
      }
    },
    "required": ["name", "email"]
  }
}
```

**Google Gemini expects:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "User's full name"
    },
    "email": {
      "type": "string",
      "description": "User's email address"
    },
    "age": {
      "type": "integer",
      "description": "User's age in years"
    }
  },
  "required": ["name", "email"]
}
```

### The Challenge

- **6 different formats** to maintain (OpenAI, Anthropic, Google, Grok, Perplexity, Llama)
- **Manual updates** when providers change their requirements
- **Error-prone** copy-paste between formats
- **Version control nightmare** tracking changes across formats
- **No single source of truth** for your schema definition
