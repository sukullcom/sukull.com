module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  root: true,
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react/no-unescaped-entities': 'error',
    'react/jsx-key': 'error',
    '@next/next/no-img-element': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  },
  overrides: [
    {
      // Only apply these overrides in development
      files: ['**/*'],
      rules: {
        // These can be manually fixed progressively
        '@typescript-eslint/no-unused-vars': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        '@typescript-eslint/no-explicit-any': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      }
    },
    {
      // Disable no-unused-vars for specific files
      files: [
        './app/(main)/study-buddy/page.tsx',
        './app/(main)/sukull-code-editor/snippets/page.tsx',
        './app/(main)/sukull-code-editor/snippets/search-snippets.tsx',
        './app/admin/studentApplication/lists.tsx',
        './app/admin/teacherApplication/lists.tsx',
        './components/bottom-navigator.tsx',
        './components/sidebar.tsx',
        './components/ui/custom-toaster.tsx'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
}; 