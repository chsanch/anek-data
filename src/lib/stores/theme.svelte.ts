import { browser } from '$app/environment';

type Theme = 'dark' | 'light';

function createThemeStore() {
	let theme = $state<Theme>('dark');

	if (browser) {
		// Check localStorage first, then system preference
		const stored = localStorage.getItem('theme') as Theme | null;
		if (stored && (stored === 'dark' || stored === 'light')) {
			theme = stored;
		} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
			theme = 'light';
		}
	}

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		if (browser) {
			localStorage.setItem('theme', theme);
			updateDocument();
		}
	}

	function set(newTheme: Theme) {
		theme = newTheme;
		if (browser) {
			localStorage.setItem('theme', theme);
			updateDocument();
		}
	}

	function updateDocument() {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	// Initialize on creation
	if (browser) {
		updateDocument();
	}

	return {
		get current() {
			return theme;
		},
		get isDark() {
			return theme === 'dark';
		},
		toggle,
		set
	};
}

export const themeStore = createThemeStore();
