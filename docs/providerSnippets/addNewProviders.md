## Adding New Providers

### Step-by-Step Guide

#### 1. Create Provider Manifest
`/src/api/newprovider.json`:
```json
{
  "provider": "newprovider",
  "apiKey": "NEWPROVIDER_API_KEY",
  "llmSchemaHeader": "[
    {
      "key": "type",
      "type": "keyvalue",
      "value": "object",
      "level": 1
    },
    {
      "key": "properties",
      "type": "object",
      "level": 1,
      "end": true
    }
  ]",
  "schemaExclude": ["additionalProperties"]
}
```

#### 2. Add to Provider Registry
`providerRegistry.ts`:

```typescript
newprovider: {
  // SDK import
  sdkImport: "from newprovider import Client, ClientError",
  
  // Environment variable
  apiKeyEnv: "NEWPROVIDER_API_KEY",
  
  // Client setup
  clientCtor: "Client",
  clientExtra: ', base_url="https://api.newprovider.com"',  // optional
  
  // Models
  models: { 
    pro: "model-pro-v1", 
    lite: "model-lite-v1" 
  },
  defaultModel: "pro",
  
  // Load header rules
  getHeaderRule: async () =>
    normaliseHeader((await loadManifest("newprovider")).llmSchemaHeader, "newprovider"),
  
  // Optional: schema exclusions
  getSchemaExclude: async () =>
    normaliseExclude((await loadManifest("newprovider")).schemaExclude),
  
  // CRITICAL: Provider-specific API call
  renderCall: ({ modelId, schemaVar, contentVar }) => `
response = client.generate(
    model="${modelId}",
    prompt=${contentVar},
    format="json",
    schema=${schemaVar},
    temperature=0.7
)
payload = json.loads(response.content)`,
} as const satisfies ProviderMeta,
```
#### 3. Add Requirements
`/scaffolds/requirements/newprovider.txt`:

```
  newprovider-sdk>=1.0.0
```

**That's it! The system automatically:**

- Generates provider-specific Python scripts
- Handles all models for the provider
- Includes proper error handling
- Creates the complete bundle



