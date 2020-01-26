module.exports = {
  "env": {
      "browser": true,
      "es6": true,
      "node": true
  },
  "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended"
  ],
  "globals": {
      "Atomics": "readonly",
      "SharedArrayBuffer": "readonly"
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
      "ecmaVersion": 2018,
      "sourceType": "module",
      "project": "./tsconfig.json"
  },
  "plugins": [
      "@typescript-eslint"
  ],
  "rules": {
      "@typescript-eslint/no-floating-promises": 2,
      "no-unused-expressions": 2,
      "no-unused-vars": 0,
  },
};
