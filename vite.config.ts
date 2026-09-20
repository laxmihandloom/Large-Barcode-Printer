// vitest/config re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
	plugins: [react()],

	// Production is served from https://laxmihandloom.github.io/Large-Barcode-Printer/,
	// so the build needs the repo name as its base. Dev stays at the root so the
	// app is reachable at exactly http://localhost:3000 - the redirect URI
	// registered with Zoho. Serving dev under /Large-Barcode-Printer/ would make
	// the OAuth redirect no longer match.
	base: command === 'build' ? '/Large-Barcode-Printer/' : '/',

	server: {
		// Pinned to 3000 because the Zoho OAuth client registration lists
		// http://localhost:3000 as both a redirect URI and a JavaScript domain.
		// Letting Vite fall back to another port would break login.
		port: 3000,
		strictPort: true,
	},

	build: {
		outDir: 'dist',
	},

	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.ts',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
	},
}));
