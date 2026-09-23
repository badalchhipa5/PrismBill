/** @type {import('jest').Config} */
module.exports = {
    rootDir: __dirname,
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^@prismbill/shared-type$': '<rootDir>/../packages/shared-type/src/index.ts',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: '<rootDir>/tsconfig.test.json',
                diagnostics: true,
            },
        ],
    },
    clearMocks: true,
    restoreMocks: true,
    collectCoverageFrom: ['**/*.ts', '!server.ts', '!src/**', '!types/**', '!**/*.d.ts'],
};
