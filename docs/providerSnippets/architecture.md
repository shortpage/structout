### High-Level Flow

```mermaid
flowchart LR
    subgraph "User Interface"
        A[Select Provider]
        B[Select Model]
        C[Click IDE Helpers]
    end
    
    subgraph "Generation Pipeline"
        D[Provider Registry]
        E[Template Engine]
        F[Code Generator]
    end
    
    subgraph "Output"
        G[main.py]
        H[model.py]
        I[requirements.txt]
    end
    
    A --> D
    B --> D
    C --> E
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    
    style A fill:#fdf0f0,stroke:#666666
    style B fill:#fdf0f0,stroke:#666666
    style C fill:#fdf0f0,stroke:#666666
    style D fill:#f0f0fd,stroke:#666666
    style E fill:#f0f0fd,stroke:#666666
    style F fill:#f0f0fd,stroke:#666666
    style G fill:#f0fdf0,stroke:#666666
    style H fill:#f0fdf0,stroke:#666666
    style I fill:#f0fdf0,stroke:#666666
```

### Key Files

```
src/utils/

├── providerRegistry.ts      # Provider configurations & API snippets

├── providerSnippets.ts      # Template engine for Python generation

├── ideHelperGenerator.ts    # Pydantic model generation

├── bundleHelpers.ts         # ZIP bundle creation

└── loadProviderConfig.ts    # Provider manifest loader
```

```
src/api/

├── openai.json             # OpenAI header rules

├── anthropic.json          # Anthropic header rules

├── google-gemini.json      # Gemini header rules

└── ... other providers
```
