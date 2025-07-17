## Provider Configurations

### Current Provider Support

| Provider | SDK Type | Models | Special Features |
|----------|----------|---------|------------------|
| **OpenAI** | Native | gpt-4o, gpt-3.5-turbo | Beta parsing API |
| **Anthropic** | Native | Claude Sonnet/Haiku | Tool-based approach |
| **Google Gemini** | Native | Flash, Pro | Config-based |
| **Grok** | OpenAI-compatible | grok-3, grok-3-fast | Custom base URL |
| **Perplexity** | OpenAI-compatible | sonar-pro, sonar | Custom base URL |
| **Llama** | Native | Maverick-17B | Hybrid approach |

### Provider Schema Patterns

```mermaid
graph LR
    subgraph "OpenAI Pattern"
        A1[json_schema wrapper]
        A2[strict: true]
        A3[schema object]
        A1 --> A2 --> A3
    end
    
    subgraph "Anthropic Pattern"
        B1[No wrapper]
        B2[input_schema]
        B3[Clean structure]
        B1 --> B2 --> B3
    end
    
    subgraph "Gemini Pattern"
        C1[Minimal]
        C2[Direct properties]
        C3[Excludes fields]
        C1 --> C2 --> C3
    end
```
