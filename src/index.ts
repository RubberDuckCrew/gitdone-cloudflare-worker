import { type OAuthRequestBody, type WorkerEnv } from "./types";

export default {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async fetch(
		request: Request,
		env: WorkerEnv,
		_ctx: ExecutionContext,
	): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		const rateLimitResponse = handleRateLimit(request, env);
		if (rateLimitResponse) {
			return rateLimitResponse;
		}

		let body: unknown;

		try {
			body = await request.json();
		} catch {
			return new Response("Invalid JSON", { status: 400 });
		}

		const validationResponse = validateBody(body);
		if (validationResponse) {
			return validationResponse;
		}

		const payload = body as OAuthRequestBody;
		const client_id = env.CLIENT_ID;
		const client_secret = env.CLIENT_SECRET;

		if (!client_id || !client_secret) {
			return new Response("Missing client credentials", { status: 500 });
		}

		const params = new URLSearchParams({
			client_id,
			client_secret,
			code: payload.code,
			redirect_uri: "gitdone://callback",
			code_verifier: payload.code_verifier,
		});

		const githubRes = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params.toString(),
			},
		);

		const githubData = await githubRes.json();

		return new Response(JSON.stringify(githubData), {
			headers: {
				"Content-Type": "application/json",
			},
		});
	},
} satisfies ExportedHandler<WorkerEnv>;

// Returns a 429 response if the rate limit is exceeded
// Otherwise, it returns null to indicate that the request can proceed
export function handleRateLimit(
	request: Request,
	env: WorkerEnv,
): Response | null {
	const ip = request.headers.get("CF-Connecting-IP") || "unknown";
	const now = Date.now();
	const windowMs = 10 * 60 * 1000; // 10 Minutes
	const maxRequests = 10;
	const rateLimitStore = env.RATE_LIMIT_STORE || (env.RATE_LIMIT_STORE = {});
	const entry = rateLimitStore[ip] || { count: 0, start: now };
	if (now - entry.start > windowMs) {
		rateLimitStore[ip] = { count: 1, start: now };
	} else {
		if (entry.count >= maxRequests) {
			return new Response("Too Many Requests", { status: 429 });
		}
		entry.count++;
		rateLimitStore[ip] = entry;
	}
	return null;
}

export function validateBody(body: unknown): Response | null {
	if (typeof body !== "object" || body === null) {
		return new Response("Missing code", { status: 400 });
	}

	const payload = body as Record<string, unknown>;
	if (typeof payload.code !== "string" || !payload.code) {
		return new Response("Missing code", { status: 400 });
	}

	if (typeof payload.code_verifier !== "string" || !payload.code_verifier) {
		return new Response("Missing code_verifier", { status: 400 });
	}

	return null;
}
