## Core Components

### 1. Provider Registry (`providerRegistry.ts`)

**Central configuration hub for all providers:**

```typescript
export const PROVIDER_META = {
  openai: {
    // SDK import statement
    sdkImport: "from openai import OpenAI, OpenAIError",
    
    // API key environment variable
    apiKeyEnv: "OPENAI_API_KEY",
    
    // Client constructor
    clientCtor: "OpenAI",
    
    // Available models
    models: { 
      gpt4o: "gpt-4o", 
      gpt35: "gpt-3.5-turbo" 
    },
    defaultModel: "gpt4o",
    
    // Header rules loader
    getHeaderRule: async () => {...},
    
    // THE CORE: Provider-specific API call
    renderCall: ({ modelId, schemaVar, contentVar }) => `...`
  },
  // ... other providers
}
```

### 2. Template Engine (`providerSnippets.ts`)

**Assembles complete Python scripts:**

```typescript
export function buildMainTemplate(
  provider: ProviderId,
  id: string,
  modelCls: string,
  hasArray: boolean,
  layout: string,
  modelKey?: ModelKey
): string {
  // 1. Look up provider configuration
  const meta = PROVIDER_META[provider];
  
  // 2. Get provider's custom API call
  const rawCall = meta.renderCall({...});
  
  // 3. Wrap with boilerplate
  return banner + imports + apiKey + clientInit + 
         schemaLoad + apiCall + validation + output;
}
```

### 3. Helper Generator (`ideHelperGenerator.ts`)

**Converts JSON Schema to Pydantic models:**

```typescript
function buildModel(schema: JsonSchemaNode, rootId: string) {
// Converts JSON Schema → Pydantic classes
// Handles nested objects, arrays, and types
return {
code: "class Model(BaseModel):\n    field: str",
hasArray: false,
layout: "- model: (Model)"
};
}
```
