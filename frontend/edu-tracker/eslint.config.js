import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/api/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Fetch-on-mount effects predate this rule. Restructuring every page to
      // event-driven fetching is real work; until then this stays a warning
      // so the lint gate still catches everything else.
      'react-hooks/set-state-in-effect': 'warn',
      // useAuth is the context accessor every page imports; not a component,
      // but intentionally exported from the same module as its provider.
      'react-refresh/only-export-components': ['error', { allowExportNames: ['useAuth'] }],
    },
  },
])
