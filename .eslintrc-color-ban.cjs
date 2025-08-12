module.exports = {
  overrides: [
    {
      files: ['**/*.{js,ts,tsx}'],
      rules: {
        'no-restricted-imports': ['error', {
          'paths': [
            { 'name': 'aws-sdk', 'message': 'Use @aws-sdk/* v3 clients instead.' }
          ]
        }]
      }
    },
    {
      files: ['frontend/src/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}$/]",
            message: 'Use StackPro design tokens instead of hex colors. Use CSS variables like var(--primary) or Tailwind classes like bg-primary.'
          },
          {
            selector: "Literal[value=/^(text|bg|border)-(black|white|gray|slate|neutral|zinc|stone)-/]",
            message: 'Use StackPro design tokens instead of hardcoded Tailwind colors. Use text-foreground, bg-background, text-muted, etc.'
          }
        ],
      },
    },
    {
      files: ['frontend/src/**/*.css'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}){1,2}$/]",
            message: 'Use StackPro design tokens instead of hex colors. Use CSS variables like var(--primary).'
          }
        ],
      },
    }
  ],
};
