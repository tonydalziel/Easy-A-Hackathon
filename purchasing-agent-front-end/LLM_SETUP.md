# LLM Configuration Guide

This application uses environment variables to configure the LLM provider.

## Setup Instructions

1. Copy the `.env.local` file and update it with your actual values:

```bash
# LLM Configuration
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your-actual-api-key-here
LLM_MODEL=gpt-4o
```

## Supported LLM Providers

### Ollama (Local)
```
LLM_API_URL=http://127.0.0.1:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3.2
```

**Important Notes:**
- Ollama uses the `/v1` endpoint for OpenAI API compatibility
- The endpoint should be `http://127.0.0.1:11434/v1` (not `/api`)
- Port `11434` is the default Ollama port
- API key can be any value (Ollama doesn't require authentication locally)

**Setup:**
1. Make sure Ollama is running:
```bash
ollama serve
```

2. Pull your desired model:
```bash
# Check available models
ollama list

# Pull a model (examples)
ollama pull llama3.2
ollama pull llama3.1
ollama pull mistral
ollama pull qwen2.5
```

3. Test your setup:
```bash
# Verify Ollama is running
curl http://localhost:11434/api/version

# Test chat completion
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Recommended Models for Tool Calling:**
- `llama3.2` (3B) - Fast, good for development
- `llama3.1` (8B) - Better reasoning, supports tool calling
- `qwen2.5` - Excellent tool calling support
- `mistral` - Good balance of speed and capability

### OpenAI
```
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o
```

### Azure OpenAI
```
LLM_API_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2024-02-15-preview
LLM_API_KEY=your-azure-api-key
LLM_MODEL=gpt-4
```

### Other OpenAI-Compatible Providers
Any provider that supports the OpenAI API format (like Together AI, Anyscale, etc.):
```
LLM_API_URL=https://your-provider.com/v1/chat/completions
LLM_API_KEY=your-api-key
LLM_MODEL=your-model-name
```

## Environment Variables

- **LLM_API_URL**: The base URL for your LLM API endpoint
- **LLM_API_KEY**: Your API key for authentication
- **LLM_MODEL**: The model to use (e.g., gpt-4o, gpt-4-turbo, gpt-3.5-turbo)

## Security Notes

- Never commit `.env.local` to version control (already in `.gitignore`)
- Keep your API keys secure and rotate them regularly
- Use different API keys for development and production environments
