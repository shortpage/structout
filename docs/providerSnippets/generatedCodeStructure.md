## Generated Code Structure

### Complete Python Script Pattern

Every generated `main.py` follows this structure:

```typescript
"""Tiny self-contained demo ({PROVIDER} SDK)

- Validates JSON output against `{schema}_schema.json`
- Pretty-prints the validated data
- Saves results in ../output/
- Shows static Pydantic layout (below)
- Dumps the first element of every list (if any)

__MODEL LAYOUT _________________________
- schema_name: (SchemaName)
________________________________________

# 1. Imports
import os, json, sys
from datetime import datetime
from {provider_sdk} import {ClientClass}
from pydantic import BaseModel, ValidationError
from {schema}_model import {ModelClass}

# 2. Secure API key
from secure_key import get_api_key
api_key = get_api_key("{PROVIDER_API_KEY}")

# 3. Client initialization
client = {ClientClass}(api_key=api_key{extra_params})

# 4. Output paths
out_dir = os.path.abspath(...)
os.makedirs(out_dir, exist_ok=True)

# 5. Load schema and content
with open("./{schema}_schema.json") as f:
    schema = json.load(f)
with open("../input/{schema}_content.txt") as f:
    content = f.read()

# 6. Timed provider call
t0 = datetime.now()
{provider_specific_api_call}
elapsed_ms = (datetime.now() - t0).total_seconds() * 1000

# 7. Token usage extraction
input_tokens = None
output_tokens = None
# ... extract from response

# 8. Validation
try:
    result = {ModelClass}.model_validate(payload)
except ValidationError as err:
    # ... handle errors

# 9. Output
print("✅ Pretty JSON\n", json.dumps(result.model_dump(), indent=2))
# ... save to files
```

### Generated Bundle Directory Structure

```
{schema}_api/
```
```
  ├── openai/

      ├── {schema}_schema.json         # OpenAI-formatted schema

      ├── {schema}_gpt4o_main.py      # GPT-4 demo script

      └── {schema}_gpt35_main.py      # GPT-3.5 demo script
```

```
  ├── anthropic/

      ├── {schema}_schema.json         # Anthropic-formatted schema

      ├── {schema}_sonnet_main.py     # Claude Sonnet script

      └── {schema}_haiku_main.py      # Claude Haiku script
```

```
  ├── google-gemini/

     └── ... similar structure
```

```
  ├── input/

     └── {schema}_content.txt         # Example prompt
```

```
  ├── output/                          # Results saved here

     ├── {schema}_{model}.json       # Raw JSON output
     
     └── {schema}_{model}.out        # Pretty-printed with metadata
```
```
  ├── {schema}_model.py               # Pydantic model
```

```
  ├── secure_key.py                   # API key helper

  ├── secure_key_gui.py              # GUI for API key entry

  ├── constants.py                    # Shared constants

  └── requirements.txt                # All dependencies
```
