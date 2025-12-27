// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '$env/static/public' {
	export const PUBLIC_PARQUET_URL: string;
	export const PUBLIC_CACHE_TTL: string;
	export const PUBLIC_ARROW_URL: string;
	export const PUBLIC_DATA_SOURCE: string;
	export const PUBLIC_CURRENCIES_URL: string;
}

export {};
