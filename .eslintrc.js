module.exports = {
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended'
  ],
  plugins: ['prettier'],
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parser: 'babel-eslint',
  rules: {
    'comma-dangle': ['error', 'never'],
    'max-len': ['error', {
      code: 120,
      ignoreComments: true,
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true
    }],
    'prettier/prettier': ['error', {
      singleQuote: true
    }]
  },
  // import/no-unresolvedがwebpackのaliasに対するエラーを吐くのを防止する
  settings: {
    'import/resolver': {
      webpack: {
        config: 'webpack.config.js'
      }
    }
  }
};
