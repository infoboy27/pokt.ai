# LLM Endpoint Guide for Text-to-Text Service

## 🎯 Quick Answer: Where to Get LLM Endpoints

You have **3 main options** for getting LLM endpoints:

### 1. **Self-Hosted (Free, Recommended for Testing)** ⭐
- **Ollama** - Easiest, completely free, runs locally
- **vLLM** - High performance, requires GPU
- **Text Generation Inference** - Hugging Face, Docker-based

### 2. **Free Cloud APIs** 🆓
- **Groq** - Very fast, free tier available
- **Together AI** - Free credits
- **Hugging Face Inference** - Free tier

### 3. **Paid Cloud APIs** 💰
- **OpenAI** - GPT-3.5/GPT-4
- **Anthropic** - Claude
- **Google** - Gemini

---

## 🚀 Recommended: Ollama (Easiest Setup)

### Installation

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (choose one)
ollama pull llama2          # 7B model, good for general use
ollama pull mistral         # 7B model, very capable
ollama pull codellama       # Code-focused model
ollama pull phi             # Small, fast model (2.7B)

# Start Ollama server (runs automatically after install)
# If not running: ollama serve
```

### Test Ollama

```bash
# Test locally
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

### Configure PATH Gateway

Update `/home/shannon/shannon/gateway/config/gateway_config.yaml`:

```yaml
- service_id: text-to-text
  send_all_traffic: true
  fallback_endpoints:
    - default_url: "http://host.docker.internal:11434/api/generate"
    # Use host.docker.internal if gateway runs in Docker
    # Use localhost:11434 if gateway runs on host
```

Then restart: `docker restart shannon-testnet-gateway`

---

## 🌐 Free Cloud Options

### Groq (Very Fast, Free Tier)

1. **Sign up**: https://console.groq.com
2. **Get API key** from dashboard
3. **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

**Note**: Groq uses OpenAI-compatible API, but PATH gateway may need custom header handling for API keys.

### Together AI (Free Credits)

1. **Sign up**: https://together.ai
2. **Get API key**
3. **Endpoint**: `https://api.together.xyz/v1/chat/completions`

### Hugging Face Inference

1. **Sign up**: https://huggingface.co
2. **Get API key**
3. **Endpoint**: `https://api-inference.huggingface.co/models/{model-name}`

**Example models**:
- `meta-llama/Llama-2-7b-chat-hf`
- `mistralai/Mistral-7B-Instruct-v0.1`
- `microsoft/phi-2`

---

## 💰 Paid Options (Most Reliable)

### OpenAI

- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Cost**: Pay per token
- **Models**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Sign up**: https://platform.openai.com

### Anthropic Claude

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Cost**: Pay per token
- **Models**: Claude 3 Opus, Sonnet, Haiku
- **Sign up**: https://console.anthropic.com

---

## 🔧 Self-Hosted Options (Advanced)

### vLLM (High Performance, Requires GPU)

```bash
# Install vLLM
pip install vllm

# Run server
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-2-7b-chat-hf \
  --port 8000 \
  --host 0.0.0.0
```

**Endpoint**: `http://localhost:8000/v1/chat/completions`

### Text Generation Inference (Docker)

```bash
docker run --gpus all -p 8080:80 \
  ghcr.io/huggingface/text-generation-inference:latest \
  --model-id meta-llama/Llama-2-7b-chat-hf
```

**Endpoint**: `http://localhost:8080/generate`

---

## 📝 Configuration Examples

### For Ollama (Local)

```yaml
- service_id: text-to-text
  send_all_traffic: true
  fallback_endpoints:
    - default_url: "http://host.docker.internal:11434/api/generate"
```

### For OpenAI-Compatible APIs

**Note**: PATH gateway may need custom configuration for API keys. You might need to:
1. Set up a proxy/wrapper service that adds API keys
2. Use a service like nginx to add headers
3. Modify PATH gateway to support custom headers

### Testing After Configuration

```bash
# Test through PATH gateway
curl -X POST http://localhost:3069/v1 \
  -H "Content-Type: application/json" \
  -H "Target-Service-Id: text-to-text" \
  -H "App-Address: pokt14ng2mx2uux8cg8yr0dfp3kkna9apntkg6mtxpw" \
  -d '{
    "model": "llama2",
    "prompt": "Hello, how are you?",
    "stream": false
  }'
```

---

## 🎯 My Recommendation

**For testing/development**: Use **Ollama**
- ✅ Completely free
- ✅ No API keys needed
- ✅ Runs locally
- ✅ Easy to install
- ✅ Multiple models available

**For production**: Use **Groq** or **Together AI**
- ✅ Free tier available
- ✅ Fast response times
- ✅ No local resources needed
- ⚠️ Requires API key handling

---

## 📚 Resources

- **Ollama**: https://ollama.com
- **Groq**: https://console.groq.com
- **Together AI**: https://together.ai
- **Hugging Face**: https://huggingface.co
- **OpenAI**: https://platform.openai.com
- **Pocket Network LLM Guide**: https://pocket.network/open-weight-ai

---

## 🚀 Quick Start Command

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama2

# Test it
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello!",
  "stream": false
}'

# Update gateway config (see above)
# Restart gateway
docker restart shannon-testnet-gateway
```

