## Flow

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
