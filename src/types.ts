export type RateLimitEntry = {
	count: number;
	start: number;
};

export type RateLimitStore = Record<string, RateLimitEntry>;

export type WorkerEnv = {
	CLIENT_ID?: string;
	CLIENT_SECRET?: string;
	RATE_LIMIT_STORE?: RateLimitStore;
};

export type OAuthRequestBody = {
	code: string;
	code_verifier: string;
};
