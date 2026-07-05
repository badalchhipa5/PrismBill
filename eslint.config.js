import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // Server-specific
    {
        files: ['server/**/*.ts'],
        languageOptions: {
            globals: globals.node,
        },
    },

    // Client-specific
    {
        files: ['client/**/*.{ts,tsx}'],
        languageOptions: {
            globals: globals.browser,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        plugins: { react, 'react-hooks': reactHooks },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
        },
    },

    // Shared rules, all files
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },

    prettier, // must be last — disables ESLint rules that conflict with Prettier formatting
];
