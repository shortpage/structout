### 1. Provider Selection Process (Sample)

| User Action | System Response |
|-------------|-----------------|
| Select "anthropic" | Load anthropic config from registry |
| Select "haiku" model | Get model ID "claude-3-5-haiku-20241022" |
| Click "main" tab | Generate Python script with Anthropic SDK |


### 2. Code Generation Pipeline

```mermaid
flowchart TB
    %% Row 1: LOAD and GENERATE stages
    subgraph S1["📥 LOAD"]
        direction LR
        MANIFEST[Provider Manifest]:::load --> HEADERS[Header Rules]:::load --> MODELS[Model List]:::load
    end
    
    subgraph S2["🔧 GENERATE"]
        direction LR
        PYDANTIC[Pydantic Model]:::gen --> SCRIPT[Main Script]:::gen --> REQS[Requirements]:::gen
    end
    
    %% Connect stages in Row 1
    MODELS --> PYDANTIC
    
    %% Flow down to Row 2
    REQS ==> SCHEMA
    
    %% Row 2: ASSEMBLE and PACKAGE stages
    subgraph S3["📦 ASSEMBLE"]
        direction LR
        SCHEMA[Provider Schema]:::asm --> PYTHON[Python Script]:::asm --> DEPS[Dependencies]:::asm
    end
    
    subgraph S4["🚀 PACKAGE"]
        direction LR
        ZIP[ZIP Archive]:::pkg --> HELPERS[Helper Scripts]:::pkg --> OUTPUT[Final Bundle]:::pkg
    end
    
    %% Connect stages in Row 2
    DEPS --> ZIP
    
    %% Flow down to Row 3
    OUTPUT ==> COMPLETE((✅<br/>Complete)):::done
    
    %% Position stages side by side
    S1 ~~~ S2
    S3 ~~~ S4
    
    %% Styling
    classDef load fill:#42A5F5,stroke:#1565C0,color:#fff,stroke-width:2px
    classDef gen fill:#AB47BC,stroke:#6A1B9A,color:#fff,stroke-width:2px
    classDef asm fill:#66BB6A,stroke:#2E7D32,color:#fff,stroke-width:2px
    classDef pkg fill:#FFA726,stroke:#EF6C00,color:#fff,stroke-width:2px
    classDef done fill:#EF5350,stroke:#C62828,color:#fff,stroke-width:4px,font-size:20px
```

