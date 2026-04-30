# gitdone-cloudflare-worker

Cloudflare Worker for the GitDone login flow. The worker accepts an OAuth callback POST request, validates the payload, rate-limits requests per IP, and exchanges the `code` for a GitHub access token.

## Required secrets

The worker expects these environment values:

- `CLIENT_ID`
- `CLIENT_SECRET`

## API

### Request

- **Method:** `POST`
- **Content-Type:** `application/json`

Example body:

```json
{
	"code": "oauth_code_from_callback",
	"code_verifier": "pkce_verifier"
}
```

### Responses

- `200 OK` – GitHub OAuth response returned as JSON
- `400 Bad Request` – invalid JSON or missing fields
- `405 Method Not Allowed` – when the request is not `POST`
- `429 Too Many Requests` – rate limit exceeded
- `500 Internal Server Error` – missing GitHub credentials

## Rate limiting

- Counted per IP address using `CF-Connecting-IP`
- Window: **10 minutes**
- Maximum: **10 requests** per IP per window
