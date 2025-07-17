# JSON Schema Algorithm

## The Problem

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

### Without StructOut: Manual Conversion Nightmare

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

### The Solution

StructOut's JSON Schema Algorithm automatically transforms your single schema definition into the correct format for each provider when you switch the dropdown in the Generated Schema Panel.

```mermaid
graph LR
    A[Your Single Schema] --> B[JSON Schema Algorithm]
    B --> C[OpenAI Format]
    B --> D[Anthropic Format]
    B --> E[Google Format]
    B --> F[Other Providers...]
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#e8f5e9
    style D fill:#e8f5e9
    style E fill:#e8f5e9
```

### When Providers Change Requirements

**Scenario**: OpenAI adds a new required field `version: "1.0"`

Without StructOut:
- Update all OpenAI schemas manually
- Risk missing some schemas
- Test each one individually
- Hope you didn't break anything

With StructOut:
- Update one rule in `openai.json`
- All schemas automatically get the new field
- Single point of maintenance

---

## Overview

StructOut uses a sophisticated algorithm to transform user-defined schemas into provider-specific formats. When you switch providers in the Generated Schema Panel, the system automatically applies different transformation rules to create the exact format each LLM provider expects.

## Architecture Overview

```mermaid
graph TB
    subgraph "Input Sources"
        A[Schema Designer<br/>User-defined fields]
        B[Provider Manifest<br/>api/provider.json]
    end
    
    subgraph "Core Algorithm"
        C[jsonSchemaGenerator]
        D[Header Rule Processor]
        E[Schema Merger]
        F[Post Processor]
    end
    
    subgraph "Output"
        G[Provider-Specific Schema<br/>Ready for API calls]
    end
    
    A --> C
    B --> D
    D --> E
    C --> E
    E --> F
    F --> G
    
    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style G fill:#e8f5e9
```

## Core Components

### 1. Provider Manifest Structure

Each provider has a JSON manifest in `/src/api/` containing:

```
{
  "provider": "openai",
  "apiKey": "OPENAI_API_KEY",
  "llmSchemaHeader": "[...]",      // Transformation rules
  "schemaExclude": ["..."],         // Optional: fields to remove
  "genAIURLPathParameter": "..."    // Optional: API endpoint
}
```

### 2. Header Rules

Header rules define how to construct the wrapper around your schema:

```
interface HeaderRuleEntry {
  key: string;                      // JSON property name
  type: "object" | "string" | "keyvalue" | "boolean" | "array";
  value?: any;                      // Static value
  level: number;                    // Nesting depth
  sourceparam?: "schemaName" | "schemaDescription";  // Dynamic values
  action?: "include" | "exclude";   // Conditional application
  actionLevel?: ("object" | "array")[];  // Where to apply
  end?: boolean;                    // Schema injection point
}
```

## The Transformation Algorithm

```mermaid
flowchart LR
    A1["🔴 Step 1: Parse Rules<br/><br/>Load Provider Manifest<br/>↓<br/>Parse Header Rules<br/>↓<br/>Initialize Empty Structure"]
    
    B1["🔵 Step 2: Build Structure<br/><br/>Process by Level<br/>↓<br/>Create Nested Objects<br/>↓<br/>Apply Rule Values"]
    
    C1["🟡 Step 3: Merge Schema<br/><br/>Find Injection Point<br/>↓<br/>Insert User Schema<br/>↓<br/>Apply Conditionals"]
    
    D1["🟢 Step 4: Post-Process<br/><br/>Apply Exclusions<br/>↓<br/>Add Required Fields<br/>↓<br/>Final Validation"]
    
    A1 ==> B1
    B1 ==> C1
    C1 ==> D1
    
    style A1 fill:#faf5f5,stroke:#666666,stroke-width:2px,color:#000
    style B1 fill:#f5f5fa,stroke:#666666,stroke-width:2px,color:#000
    style C1 fill:#fafaf5,stroke:#666666,stroke-width:2px,color:#000
    style D1 fill:#f5faf5,stroke:#666666,stroke-width:2px,color:#000
```

### Step 1: Initialize and Parse

The algorithm starts by:

1. Loading the provider's JSON manifest.

2. Parsing the `llmSchemaHeader` rules.

3. Creating an empty root object

```
const ruleArray = JSON.parse(manifest.llmSchemaHeader);
const root = {};
const stack = [{ node: root, level: 0, nodeType: "object" }];
```

### Step 2: Build Wrapper Structure

Rules are processed level by level, building the nested structure:

```mermaid
graph TD
    subgraph "Level Processing"
        A[Level 1 Rules] --> B[Create Root Properties]
        B --> C[Level 2 Rules]
        C --> D[Create Nested Objects]
        D --> E[Level 3 Rules]
        E --> F[Continue Until Complete]
    end
    
    style A fill:#fafafa,stroke:#e8e8e8,stroke-width:1px
    style B fill:#fafafa,stroke:#e8e8e8,stroke-width:1px
    style C fill:#f8f8f8,stroke:#e8e8e8,stroke-width:1px
    style D fill:#f8f8f8,stroke:#e8e8e8,stroke-width:1px
    style E fill:#f6f6f6,stroke:#e8e8e8,stroke-width:1px
    style F fill:#f6f6f6,stroke:#e8e8e8,stroke-width:1px
```

### Step 3: Schema Injection

When a rule has `end: true`, the user's schema is injected:

```
if (rule.end) {
  // This is where user schema properties are inserted
  mergeUserSchemaHere(currentNode, userSchema);
}
```

### Step 4: Post-Processing

After the structure is built:

1. **Apply conditional rules**: Add fields based on `action` and `actionLevel`

2. **Remove excluded fields**: Strip fields listed in `schemaExclude`

3. **Add computed values**: Like `required` arrays from field definitions

## Provider Examples

### OpenAI Transformation

```mermaid
graph TB
    subgraph "Input: User Schema"
        US["<div style='text-align: left'>
        type: 'object'<br/>
        properties:<br/>
        &nbsp;&nbsp;name: {type: 'string'}<br/>
        &nbsp;&nbsp;email: {type: 'string'}
        </div>"]
    end
    
    US --> T1[Apply OpenAI Rules]
    
    T1 --> R1["Level 1: type='json_schema'"]
    R1 --> R2["Level 1: json_schema={}"]
    R2 --> R3["Level 2: name='UserInfo'"]
    R3 --> R4["Level 2: strict=true"]
    R4 --> R5["Level 2: schema={}"]
    R5 --> R6["Level 3: properties (end=true)"]
    
    R6 --> |"Inject User Schema"| Result1
    
    subgraph "Output: OpenAI Format"
        Result1["<div style='text-align: left'>
        type: 'json_schema'<br/>
        <b>json_schema:</b><br/>
        &nbsp;&nbsp;name: 'UserInfo'<br/>
        &nbsp;&nbsp;strict: true<br/>
        &nbsp;&nbsp;<b>schema:</b><br/>
        &nbsp;&nbsp;&nbsp;&nbsp;type: 'object'<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;properties:<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: {type: 'string'}<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;email: {type: 'string'}
        </div>"]
    end
    
    OpenAI1[OpenAI Specific] -.-> |"Wrapper"| Result1
    OpenAI2[OpenAI Specific] -.-> |"Strict Mode"| Result1
    
    style US fill:#e3f2fd
    style Result1 fill:#e8f5e9
    style T1 fill:#fff3e0
    style OpenAI1 fill:#ffcccc
    style OpenAI2 fill:#ffcccc
```

### Anthropic Transformation

```mermaid
graph TB
    subgraph "Input: User Schema"
        US2["<div style='text-align: left'>
        type: 'object'<br/>
        properties:<br/>
        &nbsp;&nbsp;name: {type: 'string'}<br/>
        &nbsp;&nbsp;email: {type: 'string'}
        </div>"]
    end
    
    US2 --> T2[Apply Anthropic Rules]
    
    T2 --> A1["Level 1: name='UserInfo'"]
    A1 --> A2["Level 1: description='Extract user'"]
    A2 --> A3["Level 1: input_schema={}"]
    A3 --> A4["Level 2: type='object'"]
    A4 --> A5["Level 2: properties (end=true)"]
    
    A5 --> |"Inject User Schema"| Result2
    
    subgraph "Output: Anthropic Format"
        Result2["<div style='text-align: left'>
        name: 'UserInfo'<br/>
        description: 'Extract user'<br/>
        <b>input_schema:</b><br/>
        &nbsp;&nbsp;type: 'object'<br/>
        &nbsp;&nbsp;properties:<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;name: {type: 'string'}<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;email: {type: 'string'}
        </div>"]
    end
    
    Anthropic1[Anthropic Specific] -.-> |"Tool Format"| Result2
    
    style US2 fill:#e3f2fd
    style Result2 fill:#e8f5e9
    style T2 fill:#fff3e0
    style Anthropic1 fill:#ffcccc
```

### Google Gemini Transformation

```mermaid
graph TB
    subgraph "Input: User Schema"
        US3["<div style='text-align: left'>
        type: 'object'<br/>
        properties:<br/>
        &nbsp;&nbsp;name: {type: 'string'}<br/>
        &nbsp;&nbsp;email: {type: 'string'}<br/>
        additionalProperties: false
        </div>"]
    end
    
    US3 --> T3[Apply Google Rules]
    
    T3 --> G1["Level 1: type='object'"]
    G1 --> G2["Level 1: properties (end=true)"]
    G2 --> G3["Exclude: additionalProperties"]
    
    G3 --> |"Minimal Wrapping"| Result3
    
    subgraph "Output: Google Format"
        Result3["<div style='text-align: left'>
        type: 'object'<br/>
        properties:<br/>
        &nbsp;&nbsp;name: {type: 'string'}<br/>
        &nbsp;&nbsp;email: {type: 'string'}<br/>
        <s>additionalProperties: false</s>
        </div>"]
    end
    
    Google1[Google Specific] -.-> |"Field Exclusion"| Result3
    
    style US3 fill:#e3f2fd
    style Result3 fill:#e8f5e9
    style T3 fill:#fff3e0
    style Google1 fill:#ffcccc
```

## Rule Processing Details

### Level-Based Construction

The algorithm maintains a stack to track nesting:

```
// Process rules by level
for (const rule of rules) {
  // Pop stack until we're at the right level
  while (stack.length && stack[stack.length - 1].level >= rule.level) {
    stack.pop();
  }
  
  // Apply rule at current level
  const parent = stack[stack.length - 1].node;
  processRule(parent, rule);
}
```

### Rule Type Handlers

Each rule type has specific behavior:

| Rule Type | Action | Example |
|-----------|--------|---------|
| `object` | Creates empty object | `schema: {}` |
| `keyvalue` | Sets literal value | `strict: true` |
| `string` | Sets string value | `name: "MySchema"` |
| `boolean` | Sets boolean value | `additionalProperties: false` |
| `array` | Creates array | `required: ["name", "age"]` |

### Dynamic Value Resolution

Some rules pull values dynamically:

```
if (rule.sourceparam === "schemaName") {
  parent[rule.key] = schemaName;
} else if (rule.sourceparam === "schemaDescription") {
  parent[rule.key] = schemaDescription;
} else if (rule.value === "{keynames}") {
  parent[rule.key] = Object.keys(properties);
}
```

## Advanced Features

### Conditional Rules

Rules can be applied conditionally based on the parent type:

```
{
  "key": "additionalProperties",
  "type": "boolean",
  "value": false,
  "action": "include",
  "actionLevel": ["object"]  // Only applied to object types
}
```

### Schema Exclusions

Providers can exclude unsupported keywords:

```
{
  "provider": "google-gemini",
  "schemaExclude": ["additionalProperties", "patternProperties"]
}
```

These fields are removed recursively from the entire schema tree.

### Computed Fields

The `{keynames}` placeholder automatically generates required arrays:

```
{
  "key": "required",
  "type": "array",
  "action": "include",
  "actionLevel": ["object"],
  "value": "{keynames}"  // Becomes ["field1", "field2", ...]
}
```

## Implementation Flow

```mermaid
sequenceDiagram
    participant UI as Schema Designer
    participant Gen as jsonSchemaGenerator
    participant Rules as Rule Processor
    participant Merge as Schema Merger
    
    UI->>Gen: fields[], provider
    Gen->>Rules: Load provider manifest
    Rules->>Rules: Parse header rules
    Rules->>Rules: Build wrapper structure
    Gen->>Merge: Generate core schema
    Merge->>Merge: Find injection point
    Merge->>Merge: Insert user schema
    Merge->>Rules: Apply conditional rules
    Rules->>Gen: Final schema
    Gen->>UI: Provider-specific schema
```

## Key Takeaways

1. **Provider Independence**: One schema definition works for all providers
2. **Rule-Based Transformation**: Header rules define exact output structure
3. **Level-Based Processing**: Rules are applied in order by nesting level
4. **Flexible Injection**: User schema inserted at `end: true` marker
5. **Post-Processing**: Conditional rules and exclusions applied after merge
6. **Type Safety**: Full TypeScript types ensure correct transformations

This algorithm ensures that switching providers in the UI instantly generates the correct schema format without any manual intervention.
