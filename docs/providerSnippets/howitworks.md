### 1. Provider Selection Process (Sample)

| User Action | System Response |
|-------------|-----------------|
| Select "anthropic" | Load anthropic config from registry |
| Select "haiku" model | Get model ID "claude-3-5-haiku-20241022" |
| Click "main" tab | Generate Python script with Anthropic SDK |


### 2. Code Generation Pipeline

```mermaid
flowchart TB
    %% ───  LOAD & GENERATE  ─────────────────────────────────────
    subgraph S1["📥 LOAD"]
        direction LR
        MANIFEST[Provider Manifest]:::load --> HEADERS[Header Rules]:::load --> MODELS[Model List]:::load
    end
    subgraph S2["🔧 GENERATE"]
        direction LR
        PYDANTIC[Pydantic Model]:::gen --> SCRIPT[Main Script]:::gen --> REQS[Requirements]:::gen
    end
    MODELS --> PYDANTIC
    REQS ==> SCHEMA
    %% ───  ASSEMBLE & PACKAGE  ──────────────────────────────────
    subgraph S3["📦 ASSEMBLE"]
        direction LR
        SCHEMA[Provider Schema]:::asm --> PYTHON[Python Script]:::asm --> DEPS[Dependencies]:::asm
    end
    subgraph S4["🚀 PACKAGE"]
        direction LR
        ZIP[ZIP Archive]:::pkg --> HELPERS[Helper Scripts]:::pkg --> OUTPUT[Final Bundle]:::pkg
    end
    DEPS --> ZIP
    OUTPUT ==> COMPLETE((✅<br/>Complete)):::done
    %% keep subgraphs side‑by‑side
    S1 ~~~ S2
    S3 ~~~ S4
    %% ───  Styling  ─────────────────────────────────────────────
    classDef load fill:#E8F0FE,stroke:#4285F4,color:#37474F,stroke-width:1px;
    classDef gen  fill:#EDE7F6,stroke:#673AB7,color:#37474F,stroke-width:1px;
    classDef asm  fill:#E8F5E9,stroke:#388E3C,color:#37474F,stroke-width:1px;
    classDef pkg  fill:#FFF3E0,stroke:#F57C00,color:#37474F,stroke-width:1px;
    classDef done fill:#FDECEA,stroke:#D32F2F,color:#D32F2F,stroke-width:2px,font-size:18px,font-weight:bold;
```

