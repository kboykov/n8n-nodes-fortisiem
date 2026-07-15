module.exports = {
	root: true,
	env: {
		node: true,
		es2020: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'no-console': 'warn',
	},
};
