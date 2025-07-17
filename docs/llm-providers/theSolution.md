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

```json
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

```typescript
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

```typescript
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

```typescript
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
