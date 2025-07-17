### Level-Based Construction

The algorithm maintains a stack to track nesting:

```typescript
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

```typescript
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

```json
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
