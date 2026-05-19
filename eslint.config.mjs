import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const ignores = {
  ignores: [
    '.next/**',
    '.yarn/**',
    'node_modules/**',
    'next-env.d.ts',
    'tsconfig.tsbuildinfo',
  ],
};

const config = [
  ignores,
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
