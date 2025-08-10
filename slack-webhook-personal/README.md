# slack-webhook-personal (Vercel project root)

Minimal Vercel project exposing an OpenAI chat proxy.

## Endpoint
- POST `/api/openai-chat`
  - Body: `{ "prompt": string, "max_tokens"?: number, "temperature"?: number }`
  - Response: `{ content: string }`

## Env
- `OPENAI_API_KEY` (required)

## Deploy
1. In Vercel, import this folder as a new project.
2. Set `OPENAI_API_KEY` in Project → Settings → Environment Variables.
3. Deploy.

## Test
```bash
curl -s -X POST https://<your-domain>.vercel.app/api/openai-chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Say hello","max_tokens":10}'
```

