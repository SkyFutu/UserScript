import { defineConfig } from 'vite';
import monkey, { type MonkeyUserScript } from 'vite-plugin-monkey';

export function createMonkeyConfig(options: MonkeyUserScript) {
  return defineConfig({
    plugins: [
      monkey({
        entry: 'src/main.ts',
        userscript: {
          namespace: 'https://github.com/SkyFutu/UserScript',
          author: 'Sky',
          license: 'MIT',
          supportURL: 'https://github.com/SkyFutu/UserScript/issues',
          homepage: 'https://github.com/SkyFutu/UserScript',
          'run-at': 'document-start',
          ...options,
        },
      }),
    ],
  });
}