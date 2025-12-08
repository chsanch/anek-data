/**
 * Creates a debounced version of a function that delays execution
 * until after a specified wait time has elapsed since the last call.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
	fn: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return function (...args: Parameters<T>) {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			fn(...args);
			timeoutId = null;
		}, wait);
	};
}

/**
 * Simple in-memory cache with TTL support
 */
export class QueryCache<T> {
	private cache = new Map<string, { data: T; timestamp: number }>();
	private ttl: number;

	constructor(ttlMs: number = 30000) {
		this.ttl = ttlMs;
	}

	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;

		if (Date.now() - entry.timestamp > this.ttl) {
			this.cache.delete(key);
			return undefined;
		}

		return entry.data;
	}

	set(key: string, data: T): void {
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	invalidate(key?: string): void {
		if (key) {
			this.cache.delete(key);
		} else {
			this.cache.clear();
		}
	}

	has(key: string): boolean {
		return this.get(key) !== undefined;
	}
}
