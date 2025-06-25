### `docs/credentials-setup.md`

```markdown
# Credentials Setup

| Provider | Environment variable |
|----------|----------------------|
| OpenAI   | `OPENAI_API_KEY` |
| Anthropic| `ANTHROPIC_API_KEY` |
| Bedrock  | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` |

Save keys in `.env`, or use a secrets manager.

```bash
# .env example
OPENAI_API_KEY=sk-••••
