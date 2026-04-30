declare module 'cloudflare:test' {
	interface ProvidedEnv extends Env {
		CLIENT_ID: string;
		CLIENT_SECRET: string;
		RATE_LIMIT: number;
	}
}
