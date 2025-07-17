## Runtime Features

### Generated Scripts Include:

1. **Performance Metrics**
   ```python
   elapsed_ms = (datetime.now() - t0).total_seconds() * 1000
   print(f"Exec-time ms: {int(elapsed_ms)}")
   ```

2.  **Token Usage Tracking**
   ```python
    input_tokens = getattr(usage, "prompt_tokens", None)
    output_tokens = getattr(usage, "completion_tokens", None)
   ```

3. **Validation with Pydantic**
   ```python
    try:
        result = ModelClass.model_validate(payload)
    except ValidationError as err:
        # Detailed error reporting
   ```

4. **Log File**
   ```python
    -----------------------------------------------
    Provider     : anthropic
    Model        : claude-3-5-haiku-20241022
    Generated at : 2025-07-17T10:30:45
    Input tokens : 125
    Output tokens: 89
    Exec-time ms : 1234
    -----------------------------------------------
   ```

### Summary

The Provider Code Snippets Generation System is a highly modular, extensible architecture that:

  - Centralizes all provider configurations in one registry
  - Generates complete, runnable Python scripts
  - Handles provider-specific quirks transparently
  - Scales easily to new providers without touching core code
  - Validates all outputs with proper error handling

**To add a new provider, you only need to:**

1. Create a JSON manifest (header rules)
2. Add an entry to the provider registry (with renderCall)
3. Add SDK requirements

**The system handles everything else automatically!**  
