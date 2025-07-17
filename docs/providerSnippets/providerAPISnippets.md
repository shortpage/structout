## Provider API Snippets

### Where They Live

All provider-specific API code resides in `providerRegistry.ts` within each provider's `renderCall` function:

```
providerRegistry.ts

└── PROVIDER_META

├── openai.renderCall       → OpenAI API code

├── anthropic.renderCall    → Anthropic API code

├── google-gemini.renderCall → Gemini API code

└── [YetAnotherProvider].renderCall   → Provider's API code
```

### API Snippets

#### OpenAI

```typescript
# Client initialization
client = OpenAI(api_key=api_key)

completion = client.beta.chat.completions.parse(
    model="${modelId}",
    messages=[
        {"role":"system","content":"You are a helpful assistant."},
        {"role":"user","content":${contentVar}},
    ],
    response_format=${schemaVar},
)
msg = completion.choices[0].message
payload = msg.parsed if msg.parsed else json.loads(msg.content)
```

#### Anthropic

```typescript
# Client initialization
client = Anthropic(api_key=api_key)

msg = client.messages.create(
model="${modelId}",
max_tokens=4096,
temperature=0,
tools=[${schemaVar}],
tool_choice={"type":"tool","name":${toolNameVar}},
messages=[{"role":"user","content":${contentVar}}],
)
tool_block = next(
blk for blk in msg.content if getattr(blk,"type",None)=="tool_use"
)
payload = tool_block.input
```

#### Google Gemini

```typescript
# Client initialization
client = genai.Client(api_key=api_key)

contents = [genai.types.Content(role="user",
            parts=[genai.types.Part.from_text(text=${contentVar})])]
cfg = genai.types.GenerateContentConfig(
    temperature=1, top_p=0.95, top_k=40,
    max_output_tokens=12500,
    response_mime_type="application/json",
    response_schema=${schemaVar},
)
response = client.models.generate_content(
    model="${modelId}", contents=contents, config=cfg,
)
payload = json.loads(response.text)
```

#### Llama

```typescript
# Client initialization
client = LlamaAPIClient(api_key=api_key)

completion = client.chat.completions.create(
  model="${modelId}",
  messages=[
    {"role":"system","content":"You are a helpful assistant."},
    {"role":"user","content":${contentVar}},
],
response_format={
  "type":"json_schema",
  "json_schema":${schemaVar},
},
)
payload = json.loads(completion.completion_message.content.text)
```

#### Grok (Uses OpenAI SDK)

```typescript
# Client initialization - Note the custom base_url
client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")

completion = client.beta.chat.completions.parse(
  model="${modelId}",
  messages=[
    {"role":"system","content":"You are a helpful assistant."},
    {"role":"user","content":${contentVar}},
],
response_format=${schemaVar},
)
msg = completion.choices[0].message
payload = msg.parsed if msg.parsed else json.loads(msg.content)
```

#### Perplexity (Uses OpenAI SDK)

```typescript
# Client initialization - Note the custom base_url
client = OpenAI(api_key=api_key, base_url="https://api.perplexity.ai")

completion = client.beta.chat.completions.parse(
    model="${modelId}",
    messages=[
        {"role":"system","content":"You are a helpful assistant."},
        {"role":"user","content":${contentVar}},
    ],
    response_format=${schemaVar},
)
msg = completion.choices[0].message
payload = msg.parsed if msg.parsed else json.loads(msg.content)
```


