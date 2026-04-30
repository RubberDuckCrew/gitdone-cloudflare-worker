import { describe, it, expect, beforeEach } from 'vitest';
import { handleRateLimit } from '../src';
import type { WorkerEnv } from '../src/types';

// Create a mock Request object
// This function simulates a request with a specific IP address
function createRequest(ip: string) {
  return {
    headers: {
      get: (key: string) => (key === 'CF-Connecting-IP' ? ip : null)
    }
  } as unknown as Request;
}

describe('handleRateLimit', () => {
	let env: WorkerEnv;

	beforeEach(() => {
		env = { RATE_LIMIT_STORE: {} };
	});

	it('should allow requests under the limit', () => {
		const request = createRequest('1.2.3.4');
		for (let i = 0; i < 9; i++) {
			const res = handleRateLimit(request, env);
			expect(res).toBeNull();
		}
	});

	it('should block requests over the limit', () => {
		const request = createRequest('1.2.3.4');
		for (let i = 0; i < 10; i++) {
			handleRateLimit(request, env);
		}
		const res = handleRateLimit(request, env);
		expect(res).not.toBeNull();
		// @ts-ignore
		expect(res.status).toBe(429);
	});

	it('should reset after windowMs', () => {
		const request = createRequest('1.2.3.4');
		for (let i = 0; i < 10; i++) {
			handleRateLimit(request, env);
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		env.RATE_LIMIT_STORE!['1.2.3.4'].start -= 11 * 60 * 1000;
		const res = handleRateLimit(request, env);
		expect(res).toBeNull();
	});

	it('should free memory for IP after windowMs', () => {
		const request = createRequest('5.6.7.8');
		for (let i = 0; i < 10; i++) {
			handleRateLimit(request, env);
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		env.RATE_LIMIT_STORE!['5.6.7.8'].start -= 11 * 60 * 1000;
		handleRateLimit(request, env);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(env.RATE_LIMIT_STORE!['5.6.7.8'].count).toBe(1);
	});
});
